<script setup lang="ts">
definePageMeta({ layout: 'u-dashboard', middleware: 'auth' })
const { t } = useI18n()

type Row = { source: string; channel: string; visitors: number; sessions: number }

const { siteId, range, activeSite } = useActiveSite()

const { data: rows } = await useFetch<Row[]>(
  () => siteId.value ? `/api/u/sites/${siteId.value}/referrers` : '',
  {
    key: () => `refs-${siteId.value}-${range.value}`,
    query: { range },
    immediate: !!siteId.value,
    default: () => [],
  },
)

const channelFilter = ref<string | null>(null)
const filtered = computed(() => channelFilter.value ? rows.value!.filter(r => r.channel === channelFilter.value) : rows.value!)
const maxV = computed(() => Math.max(1, ...filtered.value.map(r => r.visitors)))

const channels = computed(() => {
  const m = new Map<string, number>()
  for (const r of rows.value ?? []) m.set(r.channel, (m.get(r.channel) ?? 0) + r.visitors)
  const total = Array.from(m.values()).reduce((a, b) => a + b, 0) || 1
  return Array.from(m.entries())
    .map(([name, visitors]) => ({ name, visitors, pct: visitors / total * 100 }))
    .sort((a, b) => b.visitors - a.visitors)
})
</script>

<template>
  <div class="max-w-[1600px] mx-auto">
    <DashboardPageHeader
      :section="t('dash.referrers.section')"
      :title="activeSite?.domain ?? t('dash.referrers.section')"
      :subtitle="`${rows?.length ?? 0} ${t('dash.referrers.sources')} · ${range}`"
    >
      <URangeSelector />
    </DashboardPageHeader>

    <UEmptyState v-if="!rows || rows.length === 0" />

    <template v-else>
      <div class="border border-ink bg-paper mb-10">
        <div class="px-6 py-4 border-b border-ink flex items-center justify-between">
          <span class="label">{{ t('dash.referrers.channel') }}</span>
          <span class="label text-mute-2">{{ t('dash.referrers.visitors', { n: channels.reduce((a, c) => a + c.visitors, 0).toLocaleString() }) }}</span>
        </div>
        <div class="p-6">
          <div v-if="channels.length > 0" class="flex h-14 border border-ink">
            <div
v-for="(c, i) in channels" :key="c.name"
              class="flex items-center px-4 font-mono text-xs transition-opacity hover:opacity-80"
              :class="[i > 0 && 'border-l border-ink', i % 2 === 0 ? 'bg-ink text-paper' : 'bg-mute-6 text-ink']"
              :style="{ width: c.pct + '%' }">
              <span class="truncate">{{ c.name }}</span>
            </div>
          </div>
          <div class="flex mt-3 flex-wrap gap-y-3">
            <div v-for="c in channels" :key="c.name" class="flex-1 pr-4 min-w-[140px]" :style="{ flexBasis: c.pct + '%' }">
              <div class="font-mono tabular text-xl">{{ c.visitors.toLocaleString() }}</div>
              <div class="label text-mute-2 truncate">{{ c.name }} · {{ c.pct.toFixed(1) }}%</div>
            </div>
          </div>
        </div>
      </div>

      <div class="border border-ink bg-paper">
        <div class="px-6 py-4 border-b border-ink flex items-center justify-between flex-wrap gap-3">
          <span class="label">{{ t('dash.referrers.allSources') }}</span>
          <div class="flex gap-1 label">
            <button
class="px-3 py-1 border border-ink transition-colors"
              :class="!channelFilter ? 'bg-ink text-paper' : 'hover:bg-mute-6'"
              @click="channelFilter = null">{{ t('dash.referrers.filter.all') }}</button>
            <button
v-for="c in [
                { id: 'Direct', tr: 'direct' },
                { id: 'Search', tr: 'search' },
                { id: 'Social', tr: 'social' },
                { id: 'Referral', tr: 'referral' },
              ]" :key="c.id"
              class="px-3 py-1 border border-ink transition-colors"
              :class="channelFilter === c.id ? 'bg-ink text-paper' : 'hover:bg-mute-6'"
              @click="channelFilter = c.id">{{ t(`dash.referrers.filter.${c.tr}`) }}</button>
          </div>
        </div>
        <table class="w-full">
          <thead class="border-b border-ink">
            <tr class="text-left label text-mute-2">
              <th class="px-5 py-3 font-normal w-10">#</th>
              <th class="px-5 py-3 font-normal">{{ t('dash.table.source') }}</th>
              <th class="px-5 py-3 font-normal">{{ t('dash.table.channel') }}</th>
              <th class="px-5 py-3 font-normal text-right">{{ t('dash.table.visitors') }}</th>
              <th class="px-5 py-3 font-normal text-right">{{ t('dash.table.sessions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in filtered" :key="r.source" class="border-b border-mute-5 last:border-b-0 hover:bg-mute-6 group">
              <td class="px-5 py-3 font-mono text-xs text-mute-2 tabular">{{ String(i + 1).padStart(2, '0') }}</td>
              <td class="px-5 py-3 relative">
                <div class="absolute inset-y-1 left-0 bg-mute-6 group-hover:bg-mute-5" :style="{ width: (r.visitors / maxV * 100) + '%' }" />
                <span class="relative font-mono text-sm">{{ r.source }}</span>
              </td>
              <td class="px-5 py-3 font-mono text-xs text-mute-1 uppercase tracking-wider">{{ r.channel }}</td>
              <td class="px-5 py-3 font-mono tabular text-sm text-right">{{ r.visitors.toLocaleString() }}</td>
              <td class="px-5 py-3 font-mono tabular text-sm text-right text-mute-1">{{ r.sessions.toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
