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
  app: {
    head: {
      title: 'flowy'
    }
  },
  // Runtime configuration. Values should be provided at container/runtime start
  runtimeConfig: {
    // Server-only
    jwtSecret: '',
    // Database (server-only)
    databaseUrl: '',
    dbHost: '',
    dbPort: '',
    dbName: '',
    dbUser: '',
    dbPass: '',
    dbSchema: '',
    // SMTP (server-only)
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    // Public (exposed to client)
    public: {
      nodeEnv: process.env.NODE_ENV || 'development',
      siteUrl: ''
    }
  },
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
  },
  ssr: false
})
