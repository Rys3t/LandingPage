import test from "node:test";
import assert from "node:assert/strict";
import { catalogueConfig, createCatalogueStore, fetchCatalogue } from "../server/catalogue.js";
import { createGalleryHandler, publicGallery } from "../server/gallery.js";
import { sampleCatalogue, invoke } from "./fixtures/catalogue.js";
import { cldUrl, cldSrcset, watermarkedUrl } from "../src/lib/cld.js";

const env = { CLOUDINARY_CLOUD_NAME: "test-cloud", CLOUDINARY_API_KEY: "test-key", CLOUDINARY_API_SECRET: "test-secret" };

test("search is scoped, paginated, versioned, and aggregates each collection separately", async () => {
  const calls = [];
  const catalogue = await fetchCatalogue({ config: catalogueConfig(env), fetchSource: async (url, options) => {
    assert.equal(url, "https://api.cloudinary.com/v1_1/test-cloud/resources/search");
    assert.equal(options.redirect, "error");
    assert.equal(options.method, "POST");
    const body = JSON.parse(options.body);
    calls.push(body);
    assert.deepEqual(body.with_field, ["tags", "context"]);
    const collection = body.expression.includes('"street/*"') ? "street" : "portfolio";
    const secondPage = body.next_cursor === "page-2";
    const resource = {
      resource_type: "image", type: "upload", public_id: `${collection}/Shared/${secondPage ? "second" : "first"}`,
      width: 800, height: 1200, tags: ["shared", "shared"], context: { custom: { title: "Title", description: "Description" } },
      version: 321, created_at: "2026-09-29T00:00:00Z", format: "jpg",
    };
    return Response.json({ resources: [resource], ...(collection === "portfolio" && !secondPage ? { next_cursor: "page-2" } : {}) });
  } });
  assert.equal(calls.length, 3);
  assert.deepEqual(catalogue.collections.map(({ count }) => count), [2, 1]);
  assert.equal(catalogue.items.length, 3);
  assert.equal(catalogue.items[0].title, "Title");
  assert.equal(catalogue.items[0].caption, "Description");
  assert.equal(catalogue.items[0].version, 321);
  assert.deepEqual(catalogue.tags.map(({ collection, count }) => ({ collection, count })), [
    { collection: "portfolio", count: 2 }, { collection: "street", count: 1 },
  ]);
});

test("incomplete search results and invalid configuration never become a successful empty catalogue", async () => {
  assert.throws(() => catalogueConfig({}), /configuration/);
  assert.throws(() => catalogueConfig({ ...env, GALLERY_CACHE_SECONDS: "0" }), /GALLERY_CACHE_SECONDS/);
  assert.throws(() => catalogueConfig({ ...env, GALLERY_STREET_ROOT_FOLDER: "portfolio" }), /root folders/);
  assert.throws(() => catalogueConfig({ ...env, GALLERY_STREET_ROOT_FOLDER: 'bad" OR *' }), /root folders/);
  await assert.rejects(fetchCatalogue({ config: catalogueConfig(env), fetchSource: async () => Response.json({}) }), /Invalid/);
  await assert.rejects(fetchCatalogue({ config: catalogueConfig(env), fetchSource: async () => Response.json({ secret: "never forward this" }, { status: 429 }) }), /returned 429/);
  await assert.rejects(fetchCatalogue({ config: catalogueConfig(env), fetchSource: async () => Response.json({ resources: [], next_cursor: "repeated" }) }), /pagination/);
  await assert.rejects(fetchCatalogue({ config: catalogueConfig(env), fetchSource: async () => Response.json({ resources: [
    { public_id: "unpublished/photo", resource_type: "image", type: "upload", width: 800, height: 1200 },
  ] }) }), /outside configured/);
});

test("cache deduplicates concurrent reads, refreshes at TTL, and backs off without stale authorization", async () => {
  let now = 0;
  let reads = 0;
  let fail = false;
  const getSnapshot = createCatalogueStore({ now: () => now, ttlMs: 60_000, loader: async () => {
    reads++;
    if (fail) throw new Error("offline");
    return { revision: reads };
  } });
  const [first, concurrent] = await Promise.all([getSnapshot(), getSnapshot()]);
  assert.equal(first, concurrent);
  assert.equal(reads, 1);
  now = 59_999;
  assert.equal(await getSnapshot(), first);
  now = 60_000;
  assert.equal((await getSnapshot()).catalogue.revision, 2);
  fail = true;
  now = 120_000;
  await assert.rejects(getSnapshot(), /offline/);
  await assert.rejects(getSnapshot(), /offline/);
  assert.equal(reads, 3);
  fail = false;
  now += 30_000;
  assert.equal((await getSnapshot()).catalogue.revision, 4);
});

test("public payload removes internal fields and has stable content/image versions", () => {
  const catalogue = sampleCatalogue();
  const data = publicGallery(catalogue);
  assert.equal(data.cloudName, undefined);
  assert.equal(data.collections[0].rootFolder, undefined);
  for (const field of ["folder", "createdAt", "format"]) assert.equal(data.items[0][field], undefined);
  catalogue.generatedAt = "later";
  assert.equal(publicGallery(catalogue).version, data.version);
  catalogue.items[0].title = "New title";
  const renamed = publicGallery(catalogue);
  assert.notEqual(renamed.version, data.version);
  assert.equal(renamed.items[0].imageVersion, data.items[0].imageVersion);
  catalogue.items[0].version++;
  assert.notEqual(publicGallery(catalogue).items[0].imageVersion, data.items[0].imageVersion);
});

test("gallery HTTP supports GET/HEAD/ETag, rejects input, and cannot disclose upstream failures", async () => {
  let reads = 0;
  const handler = createGalleryHandler({ now: () => 30_000, getSnapshot: async () => {
    reads++;
    return { catalogue: sampleCatalogue(), expiresAt: 60_000 };
  } });
  const response = await invoke(handler);
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["Vercel-CDN-Cache-Control"], "public, s-maxage=30, must-revalidate");
  assert.equal(response.headers["Cache-Control"], "public, max-age=0, must-revalidate");
  assert.equal(JSON.parse(response.body).items.length, 1);
  assert.equal((await invoke(handler, "/api/gallery", "HEAD")).body, undefined);
  const unchanged = await invoke(handler, "/api/gallery", "GET", { "if-none-match": response.headers.ETag });
  assert.equal(unchanged.statusCode, 304);
  assert.equal(unchanged.body, undefined);
  reads = 0;
  assert.equal((await invoke(handler, "/api/gallery?expression=anything")).statusCode, 400);
  assert.equal((await invoke(handler, "/api/gallery", "POST")).statusCode, 405);
  assert.equal(reads, 0);
  const failing = createGalleryHandler({ getSnapshot: async () => { throw new Error("private credentials"); } });
  const failure = await invoke(failing);
  assert.equal(failure.statusCode, 503);
  assert.equal(failure.headers["Cache-Control"], "no-store");
  assert.ok(!failure.body.includes("private credentials"));
});

test("image helpers use runtime revisions and encode IDs and srcset transformation commas", () => {
  const item = { ...publicGallery(sampleCatalogue()).items[0], publicId: "portfolio/系列/photo?#" };
  assert.match(cldUrl(item, 600), /\/v123\/portfolio\/%E7%B3%BB%E5%88%97\/photo%3F%23$/);
  assert.equal(cldSrcset(item).split(",").length, 3);
  const lightbox = new URL(watermarkedUrl(item), "https://example.com");
  assert.equal(lightbox.searchParams.get("id"), item.publicId);
  assert.equal(lightbox.searchParams.get("v"), item.imageVersion);
});
