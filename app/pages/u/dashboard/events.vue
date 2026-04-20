<script setup lang="ts">
definePageMeta({ layout: 'u-dashboard', middleware: 'auth' });
const { t } = useI18n();

type Def = { name: string; count: number; users: number; lastSeen: number };
type Live = {
  _id: string;
  ts: number;
  path: string;
  type: string;
  eventName?: string;
  referrer?: string;
  country?: string;
};

const { siteId, range, activeSite } = useActiveSite();

const { data, refresh } = await useFetch<{ defs: Def[]; live: Live[] }>(
  () => (siteId.value ? `/api/u/sites/${siteId.value}/events` : ''),
  {
    key: () => `events-${siteId.value}-${range.value}`,
    query: { range },
    immediate: !!siteId.value,
    default: () => ({ defs: [], live: [] }),
  },
);

let poll: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  if (siteId.value) poll = setInterval(refresh, 5_000);
});
onBeforeUnmount(() => {
  if (poll) clearInterval(poll);
});

const activeType = ref<string | null>(null);
const filteredLive = computed(() =>
  activeType.value
    ? data.value!.live.filter((l) => l.eventName === activeType.value)
    : data.value!.live,
);

function fmtTime(ms: number) {
  return new Date(ms).toTimeString().slice(0, 8);
}
function ago(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm';
  return Math.floor(m / 60) + 'h';
}
</script>

<template>
  <div class="max-w-[1600px] mx-auto">
    <DashboardPageHeader
      :section="t('dash.events.section')"
      :title="activeSite?.domain ?? t('dash.events.section')"
      :subtitle="
        t('dash.events.eventDefsCount', { n: data?.defs.length ?? 0, range })
      "
    >
      <URangeSelector />
    </DashboardPageHeader>

    <UEmptyState
      v-if="!data || (data.defs.length === 0 && data.live.length === 0)"
      :message="t('dash.events.fireHint')"
    />

    <template v-else>
      <div class="border border-ink bg-paper mb-10">
        <div
          class="px-6 py-4 border-b border-ink flex items-center justify-between"
        >
          <span class="label">{{ t('dash.events.definitions') }}</span>
          <span class="label text-mute-2">{{
            t('dash.events.clickToFilter')
          }}</span>
        </div>
        <table v-if="data.defs.length" class="w-full">
          <thead class="border-b border-ink">
            <tr class="text-left label text-mute-2">
              <th class="px-5 py-3 font-normal">{{ t('dash.table.event') }}</th>
              <th class="px-5 py-3 font-normal text-right">
                {{ t('dash.table.count') }}
              </th>
              <th class="px-5 py-3 font-normal text-right">
                {{ t('dash.table.users') }}
              </th>
              <th class="px-5 py-3 font-normal text-right">
                {{ t('dash.table.lastSeen') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="d in data.defs"
              :key="d.name"
              class="border-b border-mute-5 last:border-b-0 hover:bg-mute-6 cursor-pointer"
              :class="activeType === d.name && 'bg-mute-6'"
              @click="activeType = activeType === d.name ? null : d.name"
            >
              <td class="px-5 py-3 font-mono text-sm">{{ d.name }}</td>
              <td class="px-5 py-3 font-mono tabular text-sm text-right">
                {{ d.count.toLocaleString() }}
              </td>
              <td
                class="px-5 py-3 font-mono tabular text-sm text-right text-mute-1"
              >
                {{ d.users.toLocaleString() }}
              </td>
              <td class="px-5 py-3 font-mono text-xs text-right text-mute-1">
                {{ ago(d.lastSeen) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-else
          class="px-6 py-10 font-mono text-xs text-mute-2 text-center"
        >
          {{ t('dash.events.noNamedYet') }}
          <code class="text-ink">window.nagare.event('name')</code>.
        </div>
      </div>

      <div class="border border-ink bg-paper">
        <div
          class="px-6 py-4 border-b border-ink flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <span class="w-2 h-2 rounded-full bg-ink blink" />
            <span class="label">{{ t('dash.events.liveFeed') }}</span>
            <span v-if="activeType" class="label text-mute-2">
              · <span class="font-mono text-ink">{{ activeType }}</span>
              <button class="ml-2 underline" @click="activeType = null">
                {{ t('dash.events.clearFilter') }}
              </button>
            </span>
          </div>
          <span class="label text-mute-2"
            >{{ filteredLive.length }} events</span
          >
        </div>
        <ul v-if="filteredLive.length">
          <li
            v-for="e in filteredLive"
            :key="e._id"
            class="border-b border-mute-5 last:border-b-0 flex items-center gap-5 px-5 py-3 hover:bg-mute-6"
          >
            <span class="font-mono tabular text-xs text-mute-1 w-20 shrink-0">{{
              fmtTime(e.ts)
            }}</span>
            <span class="text-xs bg-ink text-paper px-1.5 py-0.5 shrink-0">{{
              e.eventName ?? e.type
            }}</span>
            <span class="font-mono text-sm flex-1 truncate">{{ e.path }}</span>
            <span
              class="font-mono text-xs text-mute-1 truncate hidden md:inline"
              >{{ e.country ?? '-' }}</span
            >
            <span
              class="font-mono text-xs text-mute-1 truncate hidden lg:inline"
              >{{ e.referrer ?? 'direct' }}</span
            >
          </li>
        </ul>
        <div
          v-else
          class="px-6 py-10 font-mono text-xs text-mute-2 text-center"
        >
          {{ t('dash.events.noInFilter') }}
        </div>
      </div>
    </template>
  </div>
</template>
