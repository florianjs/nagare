<script setup lang="ts">
definePageMeta({ layout: 'u-dashboard', middleware: 'auth' })
const { t } = useI18n()

type Mode = 'click' | 'move' | 'scroll'
type Pt = { x: number; y: number; ts: number }

const { siteId, activeSite } = useActiveSite()

const mode = ref<Mode>('click')
const path = ref('/')

const { data: pages } = await useFetch<{ path: string; views: number }[]>(
  () => siteId.value ? `/api/u/sites/${siteId.value}/pages` : '',
  { key: () => `pages-for-heatmap-${siteId.value}`, immediate: !!siteId.value, default: () => [] },
)

const { data: points, refresh: refreshPoints } = await useFetch<Pt[]>(
  () => siteId.value ? `/api/u/sites/${siteId.value}/heatmap` : '',
  {
    key: () => `heatmap-${siteId.value}-${path.value}-${mode.value}`,
    query: { path, kind: mode },
    immediate: !!siteId.value,
    default: () => [],
  },
)

watch([path, mode], () => refreshPoints())

const dots = computed(() =>
  (points.value ?? []).map(p => ({ x: p.x * 100, y: p.y * 100, weight: 0.5 })),
)

const iframeSrc = computed(() => {
  if (!activeSite.value) return ''
  const domain = activeSite.value.domain
  const url = domain.startsWith('http') ? domain : `https://${domain}`
  return url.replace(/\/$/, '') + path.value
})

const modes = computed<{ id: Mode; label: string; desc: string }[]>(() => [
  { id: 'click', label: t('dash.heatmap.modes.clicks'), desc: t('dash.heatmap.modeDescs.clicks') },
  { id: 'scroll', label: t('dash.heatmap.modes.scroll'), desc: t('dash.heatmap.modeDescs.scroll') },
  { id: 'move', label: t('dash.heatmap.modes.move'), desc: t('dash.heatmap.modeDescs.move') },
])
</script>

<template>
  <div class="max-w-[1600px] mx-auto">
    <DashboardPageHeader
      :section="t('dash.heatmap.section')"
      :title="activeSite?.domain ?? t('dash.heatmap.section')"
      :subtitle="t('dash.heatmap.pointsOnPath', { n: points?.length ?? 0, mode, path })"
    >
      <HeatmapLegend />
    </DashboardPageHeader>

    <UEmptyState
      v-if="!points || points.length === 0"
      :message="t('dash.heatmap.emptyMsg')"
    />

    <template v-else>
      <div class="grid grid-cols-12 gap-8 mb-10">
        <div class="col-span-12 lg:col-span-8">
          <div class="label text-mute-2 mb-3">{{ t('dash.heatmap.mode') }}</div>
          <div class="grid grid-cols-3 border border-ink bg-paper">
            <button
v-for="(m, i) in modes" :key="m.id"
              class="p-5 text-left transition-colors"
              :class="[mode === m.id ? 'bg-ink text-paper' : 'hover:bg-mute-6', i > 0 && 'border-l border-ink']"
              @click="mode = m.id">
              <div class="font-display text-2xl italic mb-1">{{ m.label }}</div>
              <div class="label" :class="mode === m.id ? 'text-mute-4' : 'text-mute-2'">{{ m.desc }}</div>
            </button>
          </div>
        </div>
        <div class="col-span-12 lg:col-span-4">
          <div class="label text-mute-2 mb-3">{{ t('dash.heatmap.page') }}</div>
          <div class="border border-ink bg-paper divide-y divide-mute-5 max-h-48 overflow-y-auto">
            <button
v-for="p in (pages ?? [])" :key="p.path"
              class="w-full flex items-center justify-between px-4 py-2.5 font-mono text-sm transition-colors"
              :class="path === p.path ? 'bg-ink text-paper' : 'hover:bg-mute-6'"
              @click="path = p.path">
              <span class="truncate pr-4">{{ p.path }}</span>
              <span class="tabular text-xs" :class="path === p.path ? 'text-mute-4' : 'text-mute-2'">{{ p.views.toLocaleString() }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="border border-ink bg-paper h-[70vh] min-h-[400px]">
        <HeatmapViewer
          :src="iframeSrc"
          :mode="mode === 'click' ? 'clicks' : mode === 'move' ? 'move' : 'scroll'"
          :click-dots="mode === 'click' ? dots : undefined"
          :move-dots="mode === 'move' ? dots : undefined"
          :label="path"
        />
      </div>

      <p class="mt-6 font-mono text-xs text-mute-2">
        {{ t('dash.heatmap.iframeNote', { url: iframeSrc }) }}
      </p>
    </template>
  </div>
</template>
