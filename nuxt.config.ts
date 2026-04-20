// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/fonts',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    'nuxt-auth-utils',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@nuxt/eslint',
  ],
  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
      fallbackLocale: 'en',
    },
    bundle: {},
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    convexUrl: process.env.CONVEX_URL ?? '',
    jwtPrivateKey: process.env.NUXT_JWT_PRIVATE_KEY ?? '',
    public: {
      convexSiteUrl: process.env.CONVEX_SITE_URL ?? '',
      appUrl: process.env.NUXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    },
  },
  nitro: {
    preset: process.env.NITRO_PRESET || undefined,
  },
  app: {
    head: {
      title: 'Nagare - Analytics without surveillance',
      htmlAttrs: { lang: 'en', class: 'grain' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Cookieless, GDPR-native analytics. Self-host in one command.',
        },
        { name: 'theme-color', content: '#0a0a0a' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
});
