<script setup lang="ts">
definePageMeta({
  layout: 'u-dashboard',
  middleware: 'auth',
});

type Overview = {
  site: { _id: string; domain: string; name: string; scriptKey: string } | null;
  stats: {
    pageviews: number;
    visitors: number;
    bounceRate: number;
    avgDurationMs: number;
  };
  pages: { path: string; views: number }[];
  refs: { source: string; visitors: number }[];
  countries: { code: string; visitors: number }[];
  live: {
    _id: string;
    ts: number;
    path: string;
    type: string;
    eventName?: string;
    referrer?: string;
    country?: string;
    deviceType?: string;
  }[];
  online: number;
  timeline: { minute: number; visitors: number }[];
  range: string;
};

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const sitesStore = useSitesStore();
if (!sitesStore.loaded)
  await sitesStore.load(useRequestFetch() as typeof $fetch);

if (!route.query.site && sitesStore.sites.length) {
  await router.replace({
    query: { ...route.query, site: sitesStore.sites[0]!._id },
  });
}

const siteId = computed(() => route.query.site as string | undefined);
const range = computed(() => (route.query.range as string) || '30d');

const { data: overview, refresh } = await useFetch<Overview>(
  () =>
    siteId.value
      ? `/api/u/sites/${siteId.value}/overview`
      : '/api/setup/status',
  {
    key: () => `overview-${siteId.value}-${range.value}`,
    query: { range },
    immediate: !!siteId.value,
    default: () => undefined as unknown as Overview,
  },
);

let poll: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  if (siteId.value) poll = setInterval(() => refresh(), 10_000);
});
onBeforeUnmount(() => {
  if (poll) clearInterval(poll);
});
watch(siteId, (v) => {
  if (poll) clearInterval(poll);
  if (v) {
    refresh();
    poll = setInterval(() => refresh(), 10_000);
  }
});

function setRange(r: string) {
  router.push({ query: { ...route.query, range: r } });
}
function fmtTime(ms: number) {
  return new Date(ms).toTimeString().slice(0, 8);
}
function fmtDuration(ms: number) {
  if (!ms) return '0s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${String(r).padStart(2, '0')}s`;
}

function badgeClass(type: string, eventName?: string) {
  const label = eventName ?? type;
  if (label === 'pageview') return 'bg-ink text-paper';
  if (label === 'click') return 'bg-mute-1 text-paper';
  if (label === 'scroll') return 'bg-mute-3 text-ink';
  return 'bg-mute-5 text-ink border border-mute-4'; // other custom events
}

const maxPages = computed(() =>
  Math.max(1, ...(overview.value?.pages.map((p) => p.views) ?? [1])),
);
const maxRefs = computed(() =>
  Math.max(1, ...(overview.value?.refs.map((r) => r.visitors) ?? [1])),
);
const maxCountries = computed(() =>
  Math.max(1, ...(overview.value?.countries.map((c) => c.visitors) ?? [1])),
);
const ranges = ['24h', '7d', '30d', '90d'];
</script>

<template>
  <div v-if="sitesStore.sites.length === 0" class="max-w-[720px] mx-auto">
    <DashboardPageHeader
      :section="t('u.onboard.section')"
      :title="t('u.onboard.title')"
      :subtitle="t('u.onboard.subtitle')"
    />
    <div
      class="border border-ink bg-paper p-12 flex flex-col items-center text-center"
    >
      <div class="font-display italic text-4xl mb-4">
        {{ t('u.onboard.noSites') }}
      </div>
      <i18n-t
        keypath="u.onboard.paste"
        tag="p"
        class="text-mute-1 max-w-[44ch] leading-relaxed mb-8"
      >
        <template #head
          ><code class="font-mono text-ink bg-mute-6 px-1 py-0.5"
            >&lt;head&gt;</code
          ></template
        >
      </i18n-t>
      <NuxtLink
        to="/u/sites/new"
        class="bg-ink text-paper px-7 py-4 text-sm inline-flex items-center gap-3 hover:bg-mute-1"
      >
        <span>{{ t('u.onboard.registerFirst') }}</span>
        <span>→</span>
      </NuxtLink>
    </div>
  </div>

  <div v-else-if="!overview" class="max-w-[1600px] mx-auto">
    <div class="font-mono text-mute-2 py-20 text-center">
      {{ t('dash.common.loading') }}
    </div>
  </div>

  <div v-else class="max-w-[1600px] mx-auto">
    <DashboardPageHeader
      :section="t('dash.overview.section')"
      :title="overview.site?.domain ?? 'Site'"
      :subtitle="`${overview.stats.pageviews.toLocaleString()} · ${overview.stats.visitors.toLocaleString()} · ${overview.range}`"
    >
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2 label">
          <span class="w-2 h-2 rounded-full bg-ink blink" />
          <span class="font-mono tabular"
            >{{ overview.online }} {{ t('dash.common.online') }}</span
          >
        </div>
        <div class="flex border border-ink">
          <button
            v-for="r in ranges"
            :key="r"
            class="px-3 py-1.5 font-mono text-xs transition-colors"
            :class="range === r ? 'bg-ink text-paper' : 'hover:bg-mute-6'"
            @click="setRange(r)"
          >
            {{ t(`dash.ranges.${r}`) }}
          </button>
        </div>
      </div>
    </DashboardPageHeader>

    <div
      class="grid grid-cols-2 md:grid-cols-4 border border-ink bg-paper mb-12"
    >
      <div class="p-6">
        <div class="label text-mute-1 mb-5">
          {{ t('dash.stats.pageviews') }}
        </div>
        <div class="font-mono tabular text-4xl">
          {{ overview.stats.pageviews.toLocaleString() }}
        </div>
      </div>
      <div class="p-6 md:border-l border-ink">
        <div class="label text-mute-1 mb-5">{{ t('dash.stats.visitors') }}</div>
        <div class="font-mono tabular text-4xl">
          {{ overview.stats.visitors.toLocaleString() }}
        </div>
      </div>
      <div class="p-6 border-l border-t md:border-t-0 border-ink">
        <div class="label text-mute-1 mb-5">{{ t('dash.stats.bounce') }}</div>
        <div class="font-mono tabular text-4xl">
          {{ (overview.stats.bounceRate * 100).toFixed(1) }}%
        </div>
      </div>
      <div class="p-6 border-l border-t md:border-t-0 border-ink">
        <div class="label text-mute-1 mb-5">{{ t('dash.stats.duration') }}</div>
        <div class="font-mono tabular text-4xl">
          {{ fmtDuration(overview.stats.avgDurationMs) }}
        </div>
      </div>
    </div>

    <div
      v-if="overview.timeline?.length"
      class="border border-ink bg-paper mb-12"
    >
      <div
        class="flex items-center justify-between px-6 py-3 border-b border-ink"
      >
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-ink blink" />
          <span class="label">{{ t('dash.overview.liveVisitors') }}</span>
        </div>
        <span class="label text-mute-2">{{
          t('dash.overview.last30min')
        }}</span>
      </div>
      <div class="px-6 py-4">
        <LiveVisitorChart :data="overview.timeline" />
      </div>
    </div>

    <div
      class="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink border border-ink mb-12"
    >
      <section class="bg-paper p-6">
        <div class="flex items-center justify-between mb-5">
          <span class="label text-mute-1">{{
            t('dash.overview.topPages')
          }}</span>
          <span class="label text-mute-2">{{ t('dash.table.views') }}</span>
        </div>
        <div
          v-if="overview.pages.length === 0"
          class="font-mono text-xs text-mute-2"
        >
          {{ t('dash.common.noData') }}
        </div>
        <ul v-else class="space-y-1">
          <li v-for="p in overview.pages" :key="p.path" class="relative group">
            <div
              class="absolute inset-y-1 left-0 bg-mute-6"
              :style="{ width: (p.views / maxPages) * 100 + '%' }"
            />
            <div
              class="relative flex items-center justify-between px-3 py-2 font-mono text-sm"
            >
              <span class="truncate pr-4">{{ p.path }}</span>
              <span class="tabular text-mute-1">{{
                p.views.toLocaleString()
              }}</span>
            </div>
          </li>
        </ul>
      </section>

      <section class="bg-paper p-6">
        <div class="flex items-center justify-between mb-5">
          <span class="label text-mute-1">{{
            t('dash.overview.topReferrers')
          }}</span>
          <span class="label text-mute-2">{{ t('dash.table.visitors') }}</span>
        </div>
        <div
          v-if="overview.refs.length === 0"
          class="font-mono text-xs text-mute-2"
        >
          {{ t('dash.common.noData') }}
        </div>
        <ul v-else class="space-y-1">
          <li v-for="r in overview.refs" :key="r.source" class="relative">
            <div
              class="absolute inset-y-1 left-0 bg-mute-6"
              :style="{ width: (r.visitors / maxRefs) * 100 + '%' }"
            />
            <div
              class="relative flex items-center justify-between px-3 py-2 font-mono text-sm"
            >
              <span class="truncate pr-4">{{ r.source }}</span>
              <span class="tabular text-mute-1">{{
                r.visitors.toLocaleString()
              }}</span>
            </div>
          </li>
        </ul>
      </section>

      <section class="bg-paper p-6">
        <div class="flex items-center justify-between mb-5">
          <span class="label text-mute-1">{{
            t('dash.overview.topCountries')
          }}</span>
          <span class="label text-mute-2">{{ t('dash.table.visitors') }}</span>
        </div>
        <div
          v-if="overview.countries.length === 0"
          class="font-mono text-xs text-mute-2"
        >
          {{ t('dash.common.noData') }}
        </div>
        <ul v-else class="space-y-1">
          <li v-for="c in overview.countries" :key="c.code" class="relative">
            <div
              class="absolute inset-y-1 left-0 bg-mute-6"
              :style="{ width: (c.visitors / maxCountries) * 100 + '%' }"
            />
            <div
              class="relative flex items-center justify-between px-3 py-2 font-mono text-sm"
            >
              <span class="flex items-center gap-2">
                <span class="bg-ink text-paper px-1.5 py-0.5 text-[10px]">{{
                  c.code
                }}</span>
              </span>
              <span class="tabular text-mute-1">{{
                c.visitors.toLocaleString()
              }}</span>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <div class="border border-ink bg-paper">
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-ink"
      >
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-ink blink" />
          <span class="label">{{ t('dash.overview.liveEvents') }}</span>
          <span class="label text-mute-2">{{
            t('dash.overview.refreshes')
          }}</span>
        </div>
        <span class="label text-mute-2">{{
          t('dash.overview.recent', { n: overview.live.length })
        }}</span>
      </div>
      <div
        v-if="overview.live.length === 0"
        class="px-6 py-12 text-center font-mono text-xs text-mute-2"
      >
        {{ t('dash.overview.noEventsYet') }}
      </div>
      <table v-else class="w-full font-mono text-sm">
        <thead>
          <tr class="text-left label text-mute-2 border-b border-mute-5">
            <th class="px-6 py-3 font-normal">{{ t('dash.table.time') }}</th>
            <th class="px-6 py-3 font-normal">{{ t('dash.table.type') }}</th>
            <th class="px-6 py-3 font-normal">{{ t('dash.table.path') }}</th>
            <th class="px-6 py-3 font-normal">{{ t('dash.table.country') }}</th>
            <th class="px-6 py-3 font-normal">
              {{ t('dash.table.referrer') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="e in overview.live"
            :key="e._id"
            class="border-b border-mute-5 last:border-b-0 hover:bg-mute-6"
          >
            <td class="px-6 py-3 tabular text-mute-1">{{ fmtTime(e.ts) }}</td>
            <td class="px-6 py-3">
              <span
                class="text-xs px-1.5 py-0.5"
                :class="badgeClass(e.type, e.eventName)"
                >{{ e.eventName ?? e.type }}</span
              >
            </td>
            <td class="px-6 py-3">{{ e.path }}</td>
            <td class="px-6 py-3 text-mute-1">{{ e.country ?? '-' }}</td>
            <td class="px-6 py-3 text-mute-1">{{ e.referrer ?? 'direct' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="overview.stats.pageviews === 0 && overview.site"
      class="mt-8 border border-ink bg-ink text-paper p-8"
    >
      <div class="label text-mute-3 mb-2">
        {{ t('u.onboard.noEventsHeader') }}
      </div>
      <div class="flex items-center justify-between gap-6 flex-wrap">
        <div>
          <div class="font-display text-2xl italic mb-2">
            {{ t('u.onboard.installTitle') }}
          </div>
          <p class="text-mute-3 max-w-[46ch]">
            {{ t('u.onboard.installMsg') }}
            <span class="font-mono text-paper"
              >{{ overview.site.scriptKey.slice(0, 12) }}…</span
            >
          </p>
        </div>
        <NuxtLink
          :to="`/u/sites/${overview.site._id}/install`"
          class="bg-paper text-ink px-5 py-2.5 text-sm"
        >
          {{ t('u.onboard.showSnippet') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
