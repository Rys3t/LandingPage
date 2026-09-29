import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { createImageHandler, renderWatermark } from "../server/watermark.js";
import { imageVersion } from "../server/image-version.js";
import { sampleCatalogue, invoke as invokeHandler } from "./fixtures/catalogue.js";

const catalogue = sampleCatalogue();
const watermarkVersion = imageVersion(catalogue.items[0], catalogue.cloudName);
const getSnapshot = async () => ({ catalogue, expiresAt: Date.now() + 60_000 });
const url = `/api/image?${new URLSearchParams({ id: catalogue.items[0].publicId, v: watermarkVersion })}`;
const solid = (width, height) => sharp({ create: { width, height, channels: 3, background: "#333333" } }).png().toBuffer();
async function invoke(handler, path = url, method = "GET") {
  return invokeHandler(handler, path, method);
}

test("logo is burned into bottom centre pixels in landscape and portrait outputs", async () => {
  for (const [width, height] of [[2400, 1600], [800, 1200]]) {
    const output = await renderWatermark(await solid(width, height));
    const { data, info } = await sharp(output).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, Math.min(width, 2048));
    assert.equal(info.height, Math.round(height * Math.min(1, 2048 / width)));
    assert.ok(output.length < 4_000_000);
    let changed = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const index = (y * info.width + x) * info.channels;
        if (Math.abs(data[index] - 51) > 30) {
          changed++;
          assert.ok(y > info.height * 0.85 && x > info.width * 0.4 && x < info.width * 0.6);
        }
      }
    }
    assert.ok(changed > 10, "logo must alter actual image pixels");
  }
});

test("rejects arbitrary URLs, unknown IDs, duplicate parameters and wrong methods before fetching", async () => {
  const handler = createImageHandler({ getSnapshot, fetchSource: () => { throw new Error("must not fetch"); } });
  assert.equal((await invoke(handler, `${url}&url=https://example.com`)).statusCode, 400);
  assert.equal((await invoke(handler, `${url}&id=duplicate`)).statusCode, 400);
  assert.equal((await invoke(handler, `/api/image?id=missing&v=${watermarkVersion}`)).statusCode, 404);
  assert.equal((await invoke(handler, url.replace(watermarkVersion, "old"))).statusCode, 404);
  assert.equal((await invoke(handler, url, "POST")).statusCode, 405);
});

test("successful GET/HEAD returns WebP and CDN caching; failed source never falls back to original", async () => {
  const input = await solid(800, 1200);
  const handler = createImageHandler({ getSnapshot, fetchSource: async (source) => {
    assert.ok(source.startsWith(`https://res.cloudinary.com/${catalogue.cloudName}/image/upload/`));
    assert.ok(source.includes("/v123/portfolio/2026%20Event/photo"));
    return new Response(input, { headers: { "Content-Type": "image/png" } });
  } });
  const response = await invoke(handler);
  assert.equal(response.statusCode, 200);
  assert.equal((await sharp(response.body).metadata()).format, "webp");
  assert.ok(response.headers["Vercel-CDN-Cache-Control"].includes("s-maxage="));
  assert.equal((await invoke(handler, url, "HEAD")).body, undefined);
  for (const source of [new Response("missing", { status: 404 }), new Response("large", {
    headers: { "Content-Type": "image/jpeg", "Content-Length": String(21 * 1024 * 1024) },
  })]) {
    const failure = await invoke(createImageHandler({ getSnapshot, fetchSource: async () => source }));
    assert.equal(failure.statusCode, 502);
    assert.equal(failure.headers["Cache-Control"], "no-store");
  }
});

test("runtime additions, replacements and removals update the image allowlist without rebuilding", async () => {
  const current = sampleCatalogue();
  const input = await solid(80, 120);
  const handler = createImageHandler({
    getSnapshot: async () => ({ catalogue: current }),
    fetchSource: async () => new Response(input, { headers: { "Content-Type": "image/png" } }),
  });
  const added = { ...current.items[0], publicId: "portfolio/2026 Event/new-photo", version: 456 };
  current.items.push(added);
  const addedUrl = `/api/image?${new URLSearchParams({ id: added.publicId, v: imageVersion(added, current.cloudName) })}`;
  assert.equal((await invoke(handler, addedUrl)).statusCode, 200);
  added.version++;
  assert.equal((await invoke(handler, addedUrl)).statusCode, 404);
  current.items = [];
  assert.equal((await invoke(handler, url)).statusCode, 404);
});

test("catalogue failure fails closed and cannot fall back to the checked-in snapshot", async () => {
  const handler = createImageHandler({
    getSnapshot: async () => { throw new Error("Unavailable"); },
    fetchSource: () => assert.fail("must not fetch a source"),
  });
  const response = await invoke(handler);
  assert.equal(response.statusCode, 503);
  assert.equal(response.headers["Cache-Control"], "no-store");
});
