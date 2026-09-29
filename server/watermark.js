import sharp from "sharp";
import { getCatalogueSnapshot } from "./catalogue.js";
import { imageVersion, logo } from "./image-version.js";
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 4_000_000;

export async function renderWatermark(input) {
  const { data, info } = await sharp(input, { limitInputPixels: 50_000_000 })
    .rotate().resize({ width: 2048, withoutEnlargement: true })
    .raw().toBuffer({ resolveWithObject: true });
  const logoWidth = Math.max(1, Math.round(Math.min(info.width * 0.06, info.height * 0.15)));
  const mark = await sharp(logo).resize({ width: logoWidth }).png().toBuffer();
  const { height: logoHeight } = await sharp(mark).metadata();
  const margin = Math.round(Math.min(info.width, info.height) * 0.025);
  const composite = [{ input: mark, left: Math.floor((info.width - logoWidth) / 2),
    top: Math.max(0, info.height - logoHeight - margin) }];
  for (const quality of [85, 75, 60, 45]) {
    const output = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
      .composite(composite).webp({ quality }).toBuffer();
    if (output.length <= MAX_OUTPUT_BYTES) return output;
  }
  throw new Error("Image exceeds output limit");
}

async function readSource(response) {
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
    throw new Error("Invalid source response");
  }
  if (Number(response.headers.get("content-length")) > MAX_SOURCE_BYTES) {
    await response.body?.cancel();
    throw new Error("Source exceeds size limit");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > MAX_SOURCE_BYTES) throw new Error("Source exceeds size limit");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function createImageHandler({ fetchSource = fetch, getSnapshot = getCatalogueSnapshot } = {}) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD");
      res.statusCode = 405;
      return res.end("Method not allowed");
    }
    const url = new URL(req.url, "http://localhost");
    const params = url.searchParams;
    if ([...params.keys()].some((key) => !["id", "v"].includes(key)) ||
        params.getAll("id").length !== 1 || params.getAll("v").length !== 1) {
      res.statusCode = 400;
      return res.end("Invalid parameters");
    }
    if (!params.get("id") || params.get("id").length > 1024 || !/^[a-f0-9]{20}$/.test(params.get("v"))) {
      res.statusCode = 404;
      return res.end("Image not found");
    }
    let catalogue;
    try {
      ({ catalogue } = await getSnapshot());
    } catch {
      res.setHeader("Retry-After", "30");
      res.statusCode = 503;
      return res.end(req.method === "HEAD" ? undefined : "Gallery temporarily unavailable");
    }
    const item = catalogue.items.find((entry) => entry.publicId === params.get("id"));
    if (!item || params.get("v") !== imageVersion(item, catalogue.cloudName)) {
      res.statusCode = 404;
      return res.end(req.method === "HEAD" ? undefined : "Image not found");
    }
    try {
      // Source is selected exclusively from the trusted catalogue, never a caller URL.
      const path = item.publicId.split("/").map(encodeURIComponent).join("/");
      const revision = item.version ? `v${item.version}/` : "";
      const source = `https://res.cloudinary.com/${encodeURIComponent(catalogue.cloudName)}/image/upload/f_jpg,q_95,c_limit,w_2048/${revision}${path}`;
      const response = await fetchSource(source, { signal: AbortSignal.timeout(15_000),
        redirect: "error" });
      const output = await renderWatermark(await readSource(response));
      res.setHeader("Content-Type", "image/webp");
      res.setHeader("Content-Length", output.length);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");
      res.statusCode = 200;
      res.end(req.method === "HEAD" ? undefined : output);
    } catch (error) {
      console.error("Watermark image processing failed:", error.message);
      res.statusCode = 502;
      res.end("Unable to process image");
    }
  };
}
