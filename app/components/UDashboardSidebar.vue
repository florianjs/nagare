<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const sitesStore = useSitesStore()

const activeSiteId = computed(() => route.query.site as string | undefined)

const views = computed(() => {
  const s = activeSiteId.value ? `?site=${activeSiteId.value}` : ''
  return [
    { label: t('dash.nav.overview'), to: `/u/dashboard${s}` },
    { label: t('dash.nav.pages'), to: `/u/dashboard/pages${s}` },
    { label: t('dash.nav.referrers'), to: `/u/dashboard/referrers${s}` },
    { label: t('dash.nav.countries'), to: `/u/dashboard/countries${s}` },
    { label: t('dash.nav.devices'), to: `/u/dashboard/devices${s}` },
    { label: t('dash.nav.heatmap'), to: `/u/dashboard/heatmap${s}` },
    { label: t('dash.nav.events'), to: `/u/dashboard/events${s}` },
    { label: t('dash.nav.settings'), to: `/u/dashboard/settings${s}` },
  ]
})

function isActive(to: string) {
  const [path] = to.split('?')
  if (path === '/u/dashboard') return route.path === '/u/dashboard'
  return route.path.startsWith(path!)
}
</script>

<template>
  <aside class="border-r border-ink bg-paper flex flex-col">
    <div class="px-6 py-5 border-b border-ink">
      <NuxtLink to="/" class="flex items-baseline gap-2">
        <span class="font-display text-4xl italic leading-none">nagare</span>
        <span class="font-mono text-[10px] text-mute-2">{{ t('u.sidebar.liveSuffix') }}</span>
      </NuxtLink>
    </div>

    <div class="p-4 flex-1 overflow-y-auto">
      <div class="flex items-center justify-between px-3 mb-3 mt-1">
        <span class="label text-mute-2">{{ t('dash.nav.sites') }}</span>
        <NuxtLink to="/u/sites/new" class="text-mute-2 hover:text-ink text-sm leading-none">+</NuxtLink>
      </div>

      <ul v-if="sitesStore.sites.length" class="space-y-0.5">
        <li v-for="s in sitesStore.sites" :key="s._id">
          <NuxtLink
            :to="`/u/dashboard?site=${s._id}`"
            class="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors"
            :class="activeSiteId === s._id ? 'bg-ink text-paper' : 'hover:bg-mute-6'"
          >
            <span class="flex items-center gap-2.5 min-w-0">
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="activeSiteId === s._id ? 'bg-paper blink' : 'bg-ink'"
              />
              <span class="font-mono truncate">{{ s.domain }}</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
      <div v-else class="px-3 py-4 text-xs text-mute-2 font-mono">
        {{ t('u.sidebar.noSites') }}
        <NuxtLink to="/u/sites/new" class="underline hover:text-ink block mt-1">
          {{ t('u.sidebar.createFirst') }}
        </NuxtLink>
      </div>

      <div class="label text-mute-2 px-3 mb-3 mt-8">{{ t('dash.nav.views') }}</div>
      <ul class="space-y-0.5">
        <li v-for="v in views" :key="v.to">
          <NuxtLink
            :to="v.to"
            class="flex items-center justify-between px-3 py-2 text-sm transition-colors"
            :class="isActive(v.to)
              ? 'text-ink font-medium bg-mute-6'
              : activeSiteId ? 'text-mute-1 hover:text-ink hover:bg-mute-6' : 'text-mute-3 pointer-events-none'"
          >
            <span>{{ v.label }}</span>
            <span v-if="isActive(v.to)" class="text-mute-2">→</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </aside>
</template>
