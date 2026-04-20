<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  dashboardUrl: string
}>()

const origin = computed(() => {
  try { return new URL(props.dashboardUrl).origin }
  catch { return props.dashboardUrl }
})

type Config = {
  id: string
  name: string
  file: string
  hint: string
  code: string
}

const configs = computed<Config[]>(() => [
  {
    id: 'nginx',
    name: 'Nginx',
    file: 'nginx.conf',
    hint: 'Add inside the server { } block of your site. Usually /etc/nginx/sites-available/your-site.conf. Run nginx -t && nginx -s reload after.',
    code: `# Allow Nagare dashboard to embed this site (heatmap)
add_header Content-Security-Policy "frame-ancestors 'self' ${origin.value}" always;

# Remove X-Frame-Options if set elsewhere
# proxy_hide_header X-Frame-Options;`,
  },
  {
    id: 'apache',
    name: 'Apache',
    file: '.htaccess',
    hint: 'Place at the root of your site (same level as index.html). Requires mod_headers enabled: a2enmod headers && systemctl restart apache2.',
    code: `# Allow Nagare dashboard to embed this site (heatmap)
Header set Content-Security-Policy "frame-ancestors 'self' ${origin.value}"

# Remove X-Frame-Options if set elsewhere
# Header unset X-Frame-Options`,
  },
  {
    id: 'next',
    name: 'Next.js',
    file: 'next.config.js',
    hint: 'Merge into your existing next.config.js at the project root. If you already have a headers() function, add the new entry to its return array.',
    code: `/** @type {import('next').NextConfig} */
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' ${origin.value}",
          },
          // Remove default X-Frame-Options
          { key: 'X-Frame-Options', value: '' },
        ],
      },
    ]
  },
}`,
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    file: 'nuxt.config.ts',
    hint: 'Merge into your existing nuxt.config.ts at the project root. If you already have routeRules, add the headers to the existing rule.',
    code: `export default defineNuxtConfig({
  routeRules: {
    '/**': {
      headers: {
        'Content-Security-Policy':
          "frame-ancestors 'self' ${origin.value}",
        // Clear X-Frame-Options if set by default
        'X-Frame-Options': '',
      },
    },
  },
})`,
  },
  {
    id: 'vue',
    name: 'Vue',
    file: 'vite.config.ts',
    hint: 'Merge into your existing vite.config.ts. This configures the dev server; for production, set the header on your hosting platform (see Vercel/Cloudflare/Nginx tabs).',
    code: `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    headers: {
      'Content-Security-Policy':
        "frame-ancestors 'self' ${origin.value}",
    },
  },
})`,
  },
  {
    id: 'express',
    name: 'Express',
    file: 'server.js',
    hint: 'Add this middleware before your route handlers in your main server file (server.js, app.js, or index.js).',
    code: `// Allow Nagare dashboard to embed this site (heatmap)
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' ${origin.value}"
  )
  res.removeHeader('X-Frame-Options')
  next()
})`,
  },
  {
    id: 'vercel',
    name: 'Vercel',
    file: 'vercel.json',
    hint: 'Create or edit vercel.json at the project root. If the file already exists, merge the headers array into the existing config. Redeploy after.',
    code: `{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors 'self' ${origin.value}"
        }
      ]
    }
  ]
}`,
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    file: 'public/_headers',
    hint: 'Create a _headers file inside your public/ or dist/ folder (the build output root). Cloudflare Pages reads it on deploy. For Workers, use the Workers tab equivalent in your wrangler config.',
    code: `# Place this file in public/_headers (Cloudflare Pages)
# Deployed alongside your site on next build.
/*
  Content-Security-Policy: frame-ancestors 'self' ${origin.value}`,
  },
])

const active = ref('nginx')
const activeConfig = computed(() => configs.value.find(c => c.id === active.value)!)

const copied = ref(false)
async function copy() {
  await navigator.clipboard.writeText(activeConfig.value.code)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div class="bg-ink text-paper">
    <div class="flex items-center border-b border-mute-1 overflow-x-auto">
      <button
        v-for="c in configs"
        :key="c.id"
        class="px-4 py-3 font-mono text-xs whitespace-nowrap transition-colors shrink-0"
        :class="active === c.id
          ? 'bg-paper text-ink'
          : 'text-mute-3 hover:text-paper'"
        @click="active = c.id"
      >
        {{ c.name }}
      </button>
    </div>

    <div class="flex items-center justify-between px-5 py-2.5 border-b border-mute-1">
      <span class="label text-mute-3">{{ activeConfig.file }}</span>
      <button
        class="label text-mute-3 hover:text-paper transition-colors"
        @click="copy"
      >
        {{ copied ? t('u.install.copied') : t('u.install.copy') }}
      </button>
    </div>

    <pre class="px-6 py-5 overflow-x-auto font-mono text-sm leading-[1.8] text-mute-4"><code>{{ activeConfig.code }}</code></pre>

    <div class="px-5 py-3 border-t border-mute-1 text-xs text-mute-3 leading-relaxed">
      {{ activeConfig.hint }}
    </div>
  </div>
</template>
