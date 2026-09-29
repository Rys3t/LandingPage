/** Lightbox images have the logo burned into their pixels by the image API. */
export function watermarkedUrl(item) {
  return `/api/image?${new URLSearchParams({ id: item.publicId, v: item.imageVersion })}`;
}
// 正式環境由 Vercel rewrite 代理，本機開發與預覽由 Vite proxy 代理。
const IMAGE_BASE = "/images";

/**
 * 組出 Cloudinary 圖片 URL。
 * 明確提供 demoSeed 的展示資料可使用 Picsum；正式目錄不包含此欄位。
 *
 * @param {object} item  /api/gallery 裡的公開 item
 * @param {number} width 需要的寬度(px)
 * @param {string} q     q_auto 等級:auto | good | eco | low
 */
export function cldUrl(item, width, q = "auto") {
  if (item.demoSeed != null) {
    const h = Math.round((width * item.height) / item.width);
    return `https://picsum.photos/seed/${item.demoSeed}/${width}/${h}`;
  }
  // f_auto:自動格式(AVIF/WebP);q_auto:自動品質;c_limit:不放大原圖
  const quality = q === "auto" ? "q_auto" : `q_auto:${q}`;
  // srcset 以逗號分隔候選項目,所以 transformation 內的逗號必須編碼,
  // 否則瀏覽器會把 q_auto/c_limit 等內容誤判成 descriptor。
  const transformation = `f_auto,${quality},c_limit,w_${width}`.replaceAll(",", "%2C");
  const path = item.publicId.split("/").map(encodeURIComponent).join("/");
  const revision = item.version ? `v${item.version}/` : "";
  return `${IMAGE_BASE}/${transformation}/${revision}${path}`;
}

/** 產生 srcset 字串,給響應式縮圖用 */
export function cldSrcset(item, widths = [320, 600, 900], q = "auto") {
  return widths.map((w) => `${cldUrl(item, w, q)} ${w}w`).join(", ");
}
