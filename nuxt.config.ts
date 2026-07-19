// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "nuxt-gtag"],
  app: {
    head: {
      htmlAttrs: { lang: "en" },
    },
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  gtag: {
    enabled: process.env.NODE_ENV === "production",
    id: "G-H6P1897Y2J",
  },
});
