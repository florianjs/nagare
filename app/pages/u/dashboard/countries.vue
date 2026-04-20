<script setup lang="ts">
definePageMeta({ layout: 'u-dashboard', middleware: 'auth' })
const { t } = useI18n()

type Row = { code: string; visitors: number; pct: number }

const { siteId, range, activeSite } = useActiveSite()

const { data: rows } = await useFetch<Row[]>(
  () => siteId.value ? `/api/u/sites/${siteId.value}/countries` : '',
  {
    key: () => `countries-${siteId.value}-${range.value}`,
    query: { range },
    immediate: !!siteId.value,
    default: () => [],
  },
)

const max = computed(() => Math.max(1, ...(rows.value?.map(r => r.visitors) ?? [1])))
</script>

<template>
  <div class="max-w-[1600px] mx-auto">
    <DashboardPageHeader
      :section="t('dash.countries.section')"
      :title="activeSite?.domain ?? t('dash.countries.section')"
      :subtitle="`${rows?.length ?? 0} ${t('dash.countries.countries')} · ${range}`"
    >
      <URangeSelector />
    </DashboardPageHeader>

    <UEmptyState v-if="!rows || rows.length === 0" />

    <div v-else class="border border-ink bg-paper">
      <div class="px-6 py-4 border-b border-ink flex items-center justify-between">
        <span class="label">{{ t('dash.countries.topCountries') }}</span>
        <span class="label text-mute-2">{{ t('dash.table.visitors') }}</span>
      </div>
      <ul class="divide-y divide-mute-5">
        <li v-for="(c, i) in rows" :key="c.code" class="flex items-center gap-4 px-6 py-3 hover:bg-mute-6 relative">
          <span class="font-mono tabular text-xs text-mute-2 w-5">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="font-mono text-xs bg-ink text-paper px-1.5 py-0.5">{{ c.code }}</span>
          <span class="flex-1 max-w-[340px] h-1 bg-mute-6 relative">
            <span class="absolute inset-y-0 left-0 bg-ink" :style="{ width: (c.visitors / max * 100) + '%' }" />
          </span>
          <span class="font-mono tabular text-sm text-right w-20">{{ c.visitors.toLocaleString() }}</span>
          <span class="font-mono tabular text-xs text-mute-1 w-14 text-right">{{ (c.pct * 100).toFixed(1) }}%</span>
        </li>
      </ul>
    </div>
  </div>
</template>
