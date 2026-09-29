import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { createImageHandler } from "./server/watermark.js";
import { createGalleryHandler } from "./server/gallery.js";
import { fileURLToPath } from "node:url";

// Mirror the production /images rewrite for both local server modes.
function imageProxy(cloudName) {
  return {
    "/images/": {
      target: `https://res.cloudinary.com/${cloudName}/image/upload`,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/images/, ""),
    },
  };
}

function imageApi() {
  const handlers = new Map([
    ["/api/image", createImageHandler()],
    ["/api/gallery", createGalleryHandler()],
  ]);
  const configure = (server) => {
    server.middlewares.use((req, res, next) => {
      const pathname = new URL(req.url, "http://localhost").pathname;
      const handler = handlers.get(pathname);
      if (handler) {
        void handler(req, res).catch(next);
      } else next();
    });
  };
  return { name: "local-gallery-apis", configureServer: configure, configurePreviewServer: configure };
}

export default defineConfig(({ mode }) => {
  // Read credentials only in Node. Never expose them through VITE_* or define.
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (/^(CLOUDINARY_|GALLERY_)/.test(key) && process.env[key] === undefined) process.env[key] = value;
  }
  const proxy = imageProxy(process.env.CLOUDINARY_CLOUD_NAME || "unconfigured");
  return {
    plugins: [vue(), imageApi()],
    server: {
      proxy,
      fs: {
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/gallery.json", "**/server/**", "**/scripts/**"],
      },
    },
    preview: { proxy },
    build: {
      rollupOptions: {
        input: {
          about: fileURLToPath(new URL("./index.html", import.meta.url)),
          gallery: fileURLToPath(new URL("./gallery/index.html", import.meta.url)),
        },
      },
    },
  };
});
