# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm run dev` — Vite dev server(內附 demo 資料可直接跑,不需 Cloudinary 憑證)
- `pnpm run fetch:gallery` — 從 Cloudinary Search API 撈取資產,重新產生 `src/data/gallery.json`(需 `.env`,見 `.env.example`)
- `pnpm run build` — 只打包前端(用現有的 gallery.json)
- `pnpm run build:full` — fetch:gallery + build(部署時用)

沒有測試與 lint 設定。

## Architecture

兩階段架構,資料流單向:**build-time script → 靜態 JSON → 前端**。

1. **Build 階段**:`scripts/fetch-gallery.mjs`(Node,唯一使用 API Secret 的地方)呼叫 Cloudinary Search API,查 `asset_folder:{GALLERY_ROOT_FOLDER}/*` 下所有圖片,連同 tags 與 contextual metadata 轉成最小欄位,加上 series/tags 統計,寫入 `src/data/gallery.json`。
2. **前端(Vue 3 + Vite,純靜態)**:直接 import `gallery.json`,不呼叫任何 API。圖片不在專案中——`src/lib/cld.js` 用 `publicId` 組出 Cloudinary delivery URL(`f_auto,q_auto,c_limit,w_{width}`),由 CDN 即時轉檔。所有圖片 URL 一律經過 `cldUrl()`/`cldSrcset()` 產生,不要手寫 URL。

元件:`App.vue` 持有篩選狀態(series 單選、tags 複選 AND),把篩選後的 items 傳給 `MasonryGallery`(瀑布流)與 `Lightbox`;`Sidebar` 只發事件不持狀態。

## 約定

- **Demo 模式**:item 帶 `demoSeed` 欄位時,`cld.js` 改用 picsum 佔位圖——這是 repo 內附 gallery.json 開箱可跑的機制,改 `cld.js` 時要保留。
- Cloudinary 資料夾結構即前端分類:`portfolio/` 子資料夾名稱 = 系列;資產 tags = 標籤;contextual metadata `title`/`caption` = 標題、`alt`/`description` = 說明。
- API Secret 絕不進前端 bundle;前端只用公開 delivery URL。
- 換撈取根資料夾:改 `.env` 的 `GALLERY_ROOT_FOLDER`(預設 `portfolio`)。
