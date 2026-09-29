# Cloudinary Gallery

Vue 3 攝影作品集：由 Vercel `/api/gallery` 在伺服器端讀取 Cloudinary，搭配 Sharp 圖片 Function、側邊欄篩選、masonry 瀑布流與 lightbox。前端不再打包 `gallery.json`，照片與標籤變更不必重新部署。

## 快速開始

```bash
pnpm install
pnpm run dev       # 先依下節設定 .env；本機包含 gallery 與 image API
```

## 接上你的 Cloudinary

1. 複製 `.env.example` 為 `.env`,填入 Cloud name / API Key / API Secret
   (Cloudinary Console → Settings → API Keys)
2. 在 Cloudinary 建立 `portfolio` 與 `street` 兩個根資料夾,再依「系列」建立子資料夾,例如:

   ```
   portfolio/
     Fancy Frontier 44 Day1/
     TpGS 26/
   street/
     Taipei Night/
     Stations/
   ```

3. 執行:

   ```bash
   pnpm run dev
   pnpm run build           # 建置前端，不需要執行 fetch:gallery
   ```

## 資料約定

| Cloudinary 端 | 對應前端 |
|---|---|
| `portfolio/`、`street/` 根資料夾 | 側邊欄「作品類型」 |
| 各根資料夾底下的子資料夾名稱 | 當前作品類型的「系列」 |
| 資產的 tags | 當前作品類型的「標籤」(單選，可與系列交集篩選) |
| Contextual metadata 的 `title` / `caption` | 縮圖 hover 標題、lightbox 標題 |
| Contextual metadata 的 `alt` / `description` | lightbox 說明文字 |

要換撈取的根資料夾,改 `.env` 的 `GALLERY_PORTFOLIO_ROOT_FOLDER` 或 `GALLERY_STREET_ROOT_FOLDER`。舊的 `GALLERY_ROOT_FOLDER` 仍可作為人像・活動根資料夾的相容設定。

## 動態目錄與更新

- `/api/gallery` 只回傳畫面所需的分類、系列、標籤與照片欄位；Cloudinary 憑證、cloud name、root folder、folder 等內部欄位不回傳。此 API 是公開作品目錄，顯示的資料與 public ID 仍可由訪客讀取。
- 伺服器快取預設 60 秒，可用 `GALLERY_CACHE_SECONDS` 調整為 30–3600 秒。CDN 只快取剩餘有效時間，避免和伺服器快取重複累加。
- 可見的頁面每 60 秒重新讀取，切回分頁也會檢查；內容未變不重新掛載照片。更新時保留仍有效的篩選條件，以及 Lightbox 正在看的照片。
- Cloudinary 的搜尋索引也需要更新時間。預設在索引更新後約 1–2 分鐘反映到已開啟頁面，並非保證秒級推送。API 錯誤不快取，暫停重試 30 秒；畫面保留上次資料並提供重試按鈕。
- 快取位於各 Function instance，並非全站共享；高流量、多 instance 仍會增加 Cloudinary Search/Admin API 用量。若需更高流量或更即時的更新，可再改用驗證過的 Webhook 與共用私有儲存。
- `pnpm run fetch:gallery` 保留為手動匯出工具；`src/data/gallery.json` 不再被網站或圖片 API 使用，也不會包入 `dist`。現有檔案仍保留在 Git，因此公開 repo 及其歷史並不會因此隱藏。

## 個人介紹頁

- `/` 是預設的 AboutPage，與 `/gallery/` 共用標題列、側邊欄及主內容區；「關於」與作品集在同一個應用程式中切換內容，不重新載入整頁。
- `/gallery/`：照片作品集頁面。About 使用 `/`，不提供舊 `/about/` 入口或轉址。
- `/`：從 LandingPage 移植的個人頭像、輪播簡介、九張連結卡片與頁尾，沿用原版面並套用作品集深色配色。
- Photography 卡片返回目前篩選的作品集；側邊欄的分類、系列及標籤也可直接切回照片瀏覽。瀏覽器上一頁／下一頁保留對應內容及篩選。
- 其餘社群連結保留原網址並開啟新分頁；手機版仍可從標題列開啟側邊欄抽屜。
- 編輯 `src/data/socials.js` 維護連結；元件位於 `src/components/landing/`，本機圖示位於 `src/assets/social/`。
- `pnpm run build` 產生 `dist/index.html` 與 `dist/gallery/index.html`；兩個入口共用 `src/main.js`，支援直接進入及重新整理，不需要額外的路由套件。

## 安全性

- API Secret 只供 Node 伺服器的 Cloudinary 搜尋與手動匯出使用，不會進入前端 bundle，也不可改成 `VITE_*` 變數。
- `.env` 已在 `.gitignore` 中,不要提交。
- 圖片仍使用公開的 Cloudinary delivery API；縮圖統一使用 `/images/...`，正式版透過 Vercel rewrite，本機開發與預覽透過 Vite proxy。Rewrite 不提供圖片存取控制。

## 部署 (Vercel)

- Build command:`pnpm run build`（已設定於 `vercel.json`）
- Output directory:`dist`
- 在 Vercel Project Settings → Environment Variables 設定 `CLOUDINARY_CLOUD_NAME`、`CLOUDINARY_API_KEY`、`CLOUDINARY_API_SECRET`，套用到所需的 Production / Preview 環境，使 Functions 執行時也能讀取。兩個根資料夾變數與 `GALLERY_CACHE_SECONDS` 為選填。新增／變更環境變數後部署一次。
- 上傳、刪除照片或修改標籤／說明後，由 API 自動更新，不必重建。建置本身不需要 API 憑證，但正式網站的 gallery/image Functions 必須具備憑證；缺少時 API 回傳 503。
- 根目錄 `vercel.json` 將 `/images/:path*` 代理到 Cloudinary，縮圖與 `srcset` 使用此路徑；Lightbox 使用 `/api/image`。
- 更換 Cloudinary cloud name 時，必須同步更新 `vercel.json` 的 destination，與 `CLOUDINARY_CLOUD_NAME` 保持一致。
- `pnpm run dev` 與 `pnpm run preview` 已設定對應的圖片代理；其他靜態主機需另設相同代理。正式版圖片代理應在 Vercel Preview Deployment 驗證。

## 圖片最佳化

`src/lib/cld.js` 統一產生 URL,預設帶:

- `f_auto,q_auto`:自動格式(AVIF/WebP)與品質
- `c_limit,w_{width}`:限制寬度、不放大
- 縮圖 `srcset` 提供 320 / 600 / 900px,lightbox 用 2048px

## GitLab CI 範例

```yaml
build:
  image: node:22
  script:
    - corepack enable && corepack prepare --activate
    - pnpm install --frozen-lockfile
    - pnpm run build
  artifacts:
    paths: [dist]
  variables:
    # CLOUDINARY_* 憑證必須另外設定在 Vercel Function 執行環境
    GALLERY_PORTFOLIO_ROOT_FOLDER: portfolio
    GALLERY_STREET_ROOT_FOLDER: street
```

## Sharp 浮水印

- Lightbox 透過 `api/image.js` → `server/watermark.js` 取得已合成 Logo 的 WebP，最大寬度 2048px；縮圖維持原樣。
- Logo 使用 `src/assets/Rys3t_logo.svg`，置於照片底部中央，寬度為照片寬度的 6%（受照片高度限制），邊距為短邊的 2.5%。放大時會與照片一起縮放。
- 原本 Lightbox 的 SVG 疊圖與手機留白定位已移除。
- `pnpm run dev` / `pnpm run preview` 包含本機圖片 API。部署時需連同根目錄 `api/`、`server/` 與 `vercel.json` 部署到 Vercel，只有 `dist` 的純靜態主機不足以執行此功能。
- 圖片 API 與目錄 API 共用伺服器端目錄程式，需要上述 Cloudinary API 憑證。下載圖片本身仍使用公開 delivery URL；原圖仍公開，此功能不提供原圖存取控制。
- 輸出固定 WebP。CDN 快取一天、瀏覽器一小時；照片版本變更會自動更新縮圖與 Lightbox 網址，不需重建。Logo 或合成參數更動才需重建；調整合成參數時更新 `server/image-version.js` 的處理版本字串。移除照片不會立即清除既有瀏覽器／CDN 圖片快取。
- API 僅接受清單內 `id` 及目前版本 `v`，來源最多 20 MiB / 15 秒，輸出最多 4 MB；錯誤不快取，也不回退原圖。
- `pnpm test` 驗證目錄分頁、欄位過濾、更新與失敗重試，以及浮水印像素、動態白名單與快取標頭。Vercel Preview 仍需驗證 Linux Sharp、Function 素材打包與 CDN HIT。
