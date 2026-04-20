<script setup lang="ts">
definePageMeta({ layout: 'u-dashboard', middleware: 'auth' });
const { t } = useI18n();

type Row = {
  path: string;
  views: number;
  visitors: number;
  bounceRate: number;
  avgDurationMs: number;
};

const { siteId, range, activeSite } = useActiveSite();

const { data: rows } = await useFetch<Row[]>(
  () => (siteId.value ? `/api/u/sites/${siteId.value}/pages` : ''),
  {
    key: () => `pages-${siteId.value}-${range.value}`,
    query: { range },
    immediate: !!siteId.value,
    default: () => [],
  },
);

const sortKey = ref<'views' | 'visitors' | 'bounceRate' | 'avgDurationMs'>(
  'views',
);
const query = ref('');

const filtered = computed(() => {
  const q = query.value.toLowerCase();
  const d = q
    ? rows.value!.filter((r) => r.path.toLowerCase().includes(q))
    : [...(rows.value ?? [])];
  d.sort((a, b) => {
    const k = sortKey.value;
    if (k === 'bounceRate') return a.bounceRate - b.bounceRate;
    if (k === 'visitors') return b.visitors - a.visitors;
    if (k === 'avgDurationMs') return b.avgDurationMs - a.avgDurationMs;
    return b.views - a.views;
  });
  return d;
});

const maxViews = computed(() =>
  Math.max(1, ...filtered.value.map((r) => r.views)),
);
function fmtDur(ms: number) {
  if (!ms) return '-';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${String(r).padStart(2, '0')}s`;
}
</script>

<template>
  <div class="max-w-[1600px] mx-auto">
    <DashboardPageHeader
      :section="t('dash.pages.section')"
      :title="activeSite?.domain ?? t('dash.pages.section')"
      :subtitle="
        t('dash.common.distinct', { n: filtered.length }) + ' · ' + range
      "
    >
      <URangeSelector />
    </DashboardPageHeader>

    <UEmptyState v-if="filtered.length === 0" />

    <template v-else>
      <div class="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div class="flex items-center border border-ink bg-paper">
          <span class="px-3 text-mute-2 font-mono text-sm">/</span>
          <input
            v-model="query"
            type="text"
            :placeholder="t('dash.pages.filterPh')"
            class="px-2 py-2 font-mono text-sm bg-transparent border-0 outline-none w-64"
          >
        </div>
        <div class="flex items-center gap-1 label">
          <span class="text-mute-2 mr-2">{{ t('dash.pages.sort') }}</span>
          <button
            v-for="k in [
              { id: 'views', tr: 'sortViews' },
              { id: 'visitors', tr: 'sortVisitors' },
              { id: 'bounceRate', tr: 'sortBounce' },
              { id: 'avgDurationMs', tr: 'sortDuration' },
            ] as const"
            :key="k.id"
            class="px-3 py-1.5 border border-ink transition-colors"
            :class="sortKey === k.id ? 'bg-ink text-paper' : 'hover:bg-mute-6'"
            @click="sortKey = k.id"
          >
            {{ t(`dash.pages.${k.tr}`) }}
          </button>
        </div>
      </div>

      <div class="border border-ink bg-paper overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-ink">
            <tr class="text-left label text-mute-2">
              <th class="px-5 py-3 font-normal w-12">#</th>
              <th class="px-5 py-3 font-normal">{{ t('dash.table.path') }}</th>
              <th class="px-5 py-3 font-normal text-right">
                {{ t('dash.table.views') }}
              </th>
              <th class="px-5 py-3 font-normal text-right">
                {{ t('dash.table.visitors') }}
              </th>
              <th class="px-5 py-3 font-normal text-right">
                {{ t('dash.table.bounce') }}
              </th>
              <th class="px-5 py-3 font-normal text-right">
                {{ t('dash.table.duration') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, i) in filtered"
              :key="r.path"
              class="border-b border-mute-5 last:border-b-0 hover:bg-mute-6 group"
            >
              <td class="px-5 py-3 font-mono tabular text-xs text-mute-2">
                {{ String(i + 1).padStart(2, '0') }}
              </td>
              <td class="px-5 py-3 relative">
                <div
                  class="absolute inset-y-1 left-0 bg-mute-6 group-hover:bg-mute-5"
                  :style="{ width: (r.views / maxViews) * 100 + '%' }"
                />
                <span class="relative font-mono text-sm">{{ r.path }}</span>
              </td>
              <td class="px-5 py-3 font-mono tabular text-sm text-right">
                {{ r.views.toLocaleString() }}
              </td>
              <td
                class="px-5 py-3 font-mono tabular text-sm text-right text-mute-1"
              >
                {{ r.visitors.toLocaleString() }}
              </td>
              <td
                class="px-5 py-3 font-mono tabular text-sm text-right text-mute-1"
              >
                {{ (r.bounceRate * 100).toFixed(1) }}%
              </td>
              <td
                class="px-5 py-3 font-mono tabular text-sm text-right text-mute-1"
              >
                {{ fmtDur(r.avgDurationMs) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
