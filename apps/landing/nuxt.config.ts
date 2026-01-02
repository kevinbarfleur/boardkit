// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@unocss/nuxt',
    '@vueuse/nuxt',
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'en', class: 'dark' },
      title: 'Boardkit — The offline-first modular whiteboard',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'An infinite canvas with productivity widgets that works 100% offline. Your data stays on your device. No cloud, no account, no tracking.' },
        { name: 'theme-color', content: '#0a0a0a' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://boardkit.sh' },
        { property: 'og:title', content: 'Boardkit — The offline-first modular whiteboard' },
        { property: 'og:description', content: 'An infinite canvas with productivity widgets that works 100% offline. Your data stays on your device.' },
        { property: 'og:image', content: 'https://boardkit.sh/og-image.png' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@boardkit' },
        { name: 'twitter:title', content: 'Boardkit — The offline-first modular whiteboard' },
        { name: 'twitter:description', content: 'An infinite canvas with productivity widgets that works 100% offline.' },
        { name: 'twitter:image', content: 'https://boardkit.sh/og-image.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        // Inter font from Google Fonts
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,500;1,8..60,600&display=swap' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true },
  },

  nitro: {
    preset: 'static',
  },
})
