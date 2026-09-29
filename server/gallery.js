import { contentVersion, getCatalogueSnapshot } from "./catalogue.js";
import { imageVersion } from "./image-version.js";

export function publicGallery(catalogue) {
  const data = {
    collections: catalogue.collections.map(({ id, count }) => ({ id, count })),
    series: catalogue.series.map(({ collection, name, count }) => ({ collection, name, count })),
    tags: catalogue.tags.map(({ collection, name, count }) => ({ collection, name, count })),
    items: catalogue.items.map((item) => ({
      publicId: item.publicId,
      collection: item.collection,
      series: item.series,
      width: item.width,
      height: item.height,
      tags: item.tags,
      title: item.title,
      caption: item.caption,
      version: item.version,
      imageVersion: imageVersion(item, catalogue.cloudName),
    })),
  };
  return { ...data, version: contentVersion(data) };
}

export function createGalleryHandler({ getSnapshot = getCatalogueSnapshot, now = Date.now } = {}) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    if (!["GET", "HEAD"].includes(req.method)) {
      res.setHeader("Allow", "GET, HEAD");
      res.statusCode = 405;
      return res.end(JSON.stringify({ error: "Method not allowed" }));
    }
    // No caller-supplied Cloudinary expressions, credentials or cache-bypass controls.
    if (new URL(req.url, "http://localhost").search) {
      res.statusCode = 400;
      return res.end(req.method === "HEAD" ? undefined : JSON.stringify({ error: "Invalid parameters" }));
    }
    try {
      const { catalogue, expiresAt } = await getSnapshot();
      const data = publicGallery(catalogue);
      const etag = `"${data.version}"`;
      const remaining = Math.max(1, Math.floor((expiresAt - now()) / 1000));
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      // Use remaining lifetime so CDN + instance cache do not double the TTL.
      res.setHeader("Vercel-CDN-Cache-Control", `public, s-maxage=${remaining}, must-revalidate`);
      res.setHeader("ETag", etag);
      if (req.headers?.["if-none-match"] === etag) {
        res.statusCode = 304;
        return res.end();
      }
      res.statusCode = 200;
      return res.end(req.method === "HEAD" ? undefined : JSON.stringify(data));
    } catch {
      console.error("Gallery unavailable; check Cloudinary configuration, quota and connectivity.");
      res.setHeader("Retry-After", "30");
      res.statusCode = 503;
      return res.end(req.method === "HEAD" ? undefined : JSON.stringify({ error: "Gallery temporarily unavailable" }));
    }
  };
}
