import { createHash } from "node:crypto";

const DEFAULT_TTL_SECONDS = 60;
const MAX_PAGES_PER_COLLECTION = 20;

export function catalogueConfig(env = process.env) {
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret || !/^[a-zA-Z0-9_-]+$/.test(cloudName)) {
    throw new Error("Missing or invalid Cloudinary server configuration");
  }
  const collections = [
    { id: "portfolio", rootFolder: env.GALLERY_PORTFOLIO_ROOT_FOLDER || env.GALLERY_ROOT_FOLDER || "portfolio" },
    { id: "street", rootFolder: env.GALLERY_STREET_ROOT_FOLDER || "street" },
  ];
  if (new Set(collections.map(({ rootFolder }) => rootFolder)).size !== collections.length ||
      collections.some(({ rootFolder }) => !rootFolder.trim() || /["\\\x00-\x1f*]/.test(rootFolder))) {
    throw new Error("Invalid gallery root folders");
  }
  const ttl = Number(env.GALLERY_CACHE_SECONDS || DEFAULT_TTL_SECONDS);
  if (!Number.isInteger(ttl) || ttl < 30 || ttl > 3600) {
    throw new Error("GALLERY_CACHE_SECONDS must be between 30 and 3600");
  }
  return { cloudName, apiKey, apiSecret, collections, ttlMs: ttl * 1000 };
}

function toItem(asset, source) {
  const publicId = asset.public_id;
  if (typeof publicId !== "string" || !publicId || publicId.length > 1024 ||
      publicId.split("/").some((part) => !part || part === "." || part === "..") ||
      asset.resource_type !== "image" || asset.type !== "upload" ||
      !(asset.width > 0 && asset.height > 0)) {
    throw new Error("Invalid Cloudinary catalogue item");
  }
  const folder = asset.asset_folder || publicId.split("/").slice(0, -1).join("/");
  if (!folder.startsWith(`${source.rootFolder}/`)) {
    throw new Error("Cloudinary item outside configured collection");
  }
  const context = asset.context?.custom ?? asset.context ?? {};
  return {
    collection: source.id,
    publicId,
    folder,
    series: folder.split("/").filter(Boolean).pop() || "uncategorized",
    format: asset.format,
    width: asset.width,
    height: asset.height,
    tags: [...new Set((asset.tags ?? []).filter((tag) => typeof tag === "string"))],
    title: String(context.title || context.caption || ""),
    caption: String(context.alt || context.description || ""),
    createdAt: asset.created_at,
    version: Number.isSafeInteger(asset.version) && asset.version > 0 ? asset.version : null,
  };
}

export async function fetchCatalogue({ config = catalogueConfig(), fetchSource = fetch } = {}) {
  const signal = AbortSignal.timeout(20_000);
  const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/resources/search`;
  const authorization = `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`;
  const batches = await Promise.all(config.collections.map(async (source) => {
    const items = [];
    const cursors = new Set();
    let cursor;
    do {
      if (cursors.size >= MAX_PAGES_PER_COLLECTION || (cursor && cursors.has(cursor))) {
        throw new Error("Cloudinary pagination limit exceeded");
      }
      cursors.add(cursor);
      const response = await fetchSource(endpoint, {
        method: "POST",
        redirect: "error",
        signal,
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify({
          expression: `resource_type:image AND type:upload AND asset_folder:"${source.rootFolder}/*"`,
          with_field: ["tags", "context"],
          sort_by: [{ created_at: "desc" }],
          max_results: 500,
          ...(cursor ? { next_cursor: cursor } : {}),
        }),
      });
      // Do not log upstream bodies: they may include internal account information.
      if (!response.ok) throw new Error(`Cloudinary Search API returned ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.resources)) throw new Error("Invalid Cloudinary search response");
      items.push(...data.resources.map((asset) => toItem(asset, source)));
      cursor = data.next_cursor;
    } while (cursor);
    return items;
  }));
  const items = batches.flat();
  if (new Set(items.map((item) => item.publicId)).size !== items.length) {
    throw new Error("Overlapping gallery collections");
  }
  const series = new Map();
  const tags = new Map();
  const count = (map, collection, name) => {
    const key = `${collection}\0${name}`;
    const entry = map.get(key) ?? { collection, name, count: 0 };
    entry.count++;
    map.set(key, entry);
  };
  for (const item of items) {
    count(series, item.collection, item.series);
    for (const tag of item.tags) count(tags, item.collection, tag);
  }
  const order = new Map(config.collections.map((source, index) => [source.id, index]));
  return {
    generatedAt: new Date().toISOString(),
    cloudName: config.cloudName,
    collections: config.collections.map((source, index) => ({ ...source, count: batches[index].length })),
    series: [...series.values()].sort((a, b) => order.get(a.collection) - order.get(b.collection) || a.name.localeCompare(b.name)),
    tags: [...tags.values()].sort((a, b) => order.get(a.collection) - order.get(b.collection) || b.count - a.count || a.name.localeCompare(b.name)),
    items,
  };
}

// Warm-instance cache and single-flight refresh; no runtime filesystem writes.
// On failure, retain no stale authorization decisions and back off for 30 seconds.
export function createCatalogueStore({ loader = fetchCatalogue, ttlMs = DEFAULT_TTL_SECONDS * 1000, now = Date.now } = {}) {
  let snapshot;
  let pending;
  let failure;
  let retryAt = 0;
  return async function getSnapshot() {
    if (snapshot && now() < snapshot.expiresAt) return snapshot;
    if (now() < retryAt) throw failure;
    if (!pending) {
      pending = Promise.resolve().then(loader).then((catalogue) => {
        snapshot = { catalogue, expiresAt: now() + ttlMs };
        failure = undefined;
        return snapshot;
      }).catch((error) => {
        failure = error;
        retryAt = now() + 30_000;
        throw error;
      }).finally(() => { pending = undefined; });
    }
    return pending;
  };
}

let runtimeStore;
export function getCatalogueSnapshot() {
  if (!runtimeStore) {
    const config = catalogueConfig();
    runtimeStore = createCatalogueStore({ loader: () => fetchCatalogue({ config }), ttlMs: config.ttlMs });
  }
  return runtimeStore();
}

export function contentVersion(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 20);
}
