// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: "2024-04-03",
    devtools: {enabled: true},
    modules: ["@nuxtjs/tailwindcss", "@nuxtjs/color-mode", "nuxt-gtag"],
    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {}
        }
    },
    colorMode: {
        preference: "light",
    },
    gtag: {
        id: 'G-H6P1897Y2J'
      }
    
})