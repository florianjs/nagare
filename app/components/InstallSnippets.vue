<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  siteKey: string
  endpoint: string
  appUrl: string
}>()

type Framework = {
  id: string
  name: string
  file: string
  code: string
}

const SC = '<' + 'script'
const SCE = '</' + 'script>'

const scriptSrc = computed(() => props.appUrl.replace(/\/$/, '') + '/t.js')

const frameworks = computed<Framework[]>(() => [
  {
    id: 'html',
    name: 'HTML',
    file: 'index.html',
    code: `${SC} src="${scriptSrc.value}"\n        data-site-id="${props.siteKey}"\n        data-endpoint="${props.endpoint}"\n        data-ignore-dnt\n        defer>${SCE}`,
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    file: 'nuxt.config.ts',
    code: `export default defineNuxtConfig({
  app: {
    head: {
      script: [
        {
          src: '${scriptSrc.value}',
          'data-site-id': '${props.siteKey}',
          'data-endpoint': '${props.endpoint}',
          'data-ignore-dnt': '',
          defer: true,
        },
      ],
    },
  },
})`,
  },
  {
    id: 'next',
    name: 'Next.js',
    file: 'app/layout.tsx',
    code: `import Script from 'next/script'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${scriptSrc.value}"
          data-site-id="${props.siteKey}"
          data-endpoint="${props.endpoint}"
          data-ignore-dnt
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}`,
  },
  {
    id: 'react',
    name: 'React',
    file: 'index.html',
    code: `<!-- Vite / CRA: add to index.html -->
${SC} src="${scriptSrc.value}"
        data-site-id="${props.siteKey}"
        data-endpoint="${props.endpoint}"
        defer>${SCE}`,
  },
  {
    id: 'vue',
    name: 'Vue',
    file: 'index.html',
    code: `<!-- Vue CLI / Vite: add to index.html inside <head> -->
${SC} src="${scriptSrc.value}"
        data-site-id="${props.siteKey}"
        data-endpoint="${props.endpoint}"
        defer>${SCE}`,
  },
  {
    id: 'svelte',
    name: 'SvelteKit',
    file: 'src/app.html',
    code: `<!-- Add inside <head> in src/app.html -->
${SC} src="${scriptSrc.value}"
        data-site-id="${props.siteKey}"
        data-endpoint="${props.endpoint}"
        defer>${SCE}`,
  },
  {
    id: 'astro',
    name: 'Astro',
    file: 'src/layouts/Layout.astro',
    code: `---
// Add inside <head> of your layout
---
${SC}
  src="${scriptSrc.value}"
  data-site-id="${props.siteKey}"
  data-endpoint="${props.endpoint}"
  defer
  is:inline
>${SCE}`,
  },
  {
    id: 'wp',
    name: 'WordPress',
    file: 'functions.php',
    code: `add_action('wp_head', function() {
    echo '${SC} src="${scriptSrc.value}"
        data-site-id="${props.siteKey}"
        data-endpoint="${props.endpoint}"
        defer>${SCE}';
});`,
  },
])

const active = ref('html')
const activeFramework = computed(() => frameworks.value.find(f => f.id === active.value)!)

const copied = ref(false)
async function copy() {
  await navigator.clipboard.writeText(activeFramework.value.code)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div class="bg-ink text-paper">
    <div class="flex items-center border-b border-mute-1 overflow-x-auto">
      <button
        v-for="f in frameworks"
        :key="f.id"
        class="px-4 py-3 font-mono text-xs whitespace-nowrap transition-colors shrink-0"
        :class="active === f.id
          ? 'bg-paper text-ink'
          : 'text-mute-3 hover:text-paper'"
        @click="active = f.id"
      >
        {{ f.name }}
      </button>
    </div>

    <div class="flex items-center justify-between px-5 py-2.5 border-b border-mute-1">
      <span class="label text-mute-3">{{ activeFramework.file }}</span>
      <button
        class="label text-mute-3 hover:text-paper transition-colors"
        @click="copy"
      >
        {{ copied ? t('u.install.copied') : t('u.install.copy') }}
      </button>
    </div>

    <pre class="px-6 py-5 overflow-x-auto font-mono text-sm leading-[1.8] text-mute-4"><code>{{ activeFramework.code }}</code></pre>
  </div>
</template>
