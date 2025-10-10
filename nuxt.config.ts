// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    '~/assets/css/main.css',
    '@vue-flow/core/dist/style.css',
    '@vue-flow/core/dist/theme-default.css'
  ],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  nitro: {
    storage: {
      db: {
        driver: 'fs',
        base: './.data/db'
      }
    }
  }
})
