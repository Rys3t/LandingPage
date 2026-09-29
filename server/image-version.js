import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

export const logo = readFileSync(new URL("../src/assets/Rys3t_logo.svg", import.meta.url));
// Bump this when changing output quality, dimensions or watermark placement.
const processingVersion = createHash("sha256").update("watermark-v2").update(logo).digest("hex");

export function imageVersion(item, cloudName) {
  return createHash("sha256")
    .update(JSON.stringify([processingVersion, cloudName, item.publicId, item.version ?? item.createdAt]))
    .digest("hex").slice(0, 20);
}
