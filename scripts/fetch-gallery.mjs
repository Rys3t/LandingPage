/** Optional local export; production reads Cloudinary at runtime via /api/gallery. */
import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { fetchCatalogue } from "../server/catalogue.js";

try {
  const catalogue = await fetchCatalogue();
  await writeFile(new URL("../src/data/gallery.json", import.meta.url), JSON.stringify(catalogue, null, 2), "utf8");
  console.log(`完成：${catalogue.items.length} 筆資產 → src/data/gallery.json（本機匯出，網站不讀取此檔）`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
