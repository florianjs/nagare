<script setup lang="ts">
definePageMeta({ layout: 'u-dashboard', middleware: 'auth' });
const { t } = useI18n();

type Split = { label: string; visitors: number; pct: number };

const { siteId, range, activeSite } = useActiveSite();

const { data } = await useFetch<{ devices: Split[]; browsers: Split[] }>(
  () => (siteId.value ? `/api/u/sites/${siteId.value}/devices` : ''),
  {
    key: () => `devices-${siteId.value}-${range.value}`,
    query: { range },
    immediate: !!siteId.value,
    default: () => ({ devices: [], browsers: [] }),
  },
);

const empty = computed(() => !data.value?.devices.length);
</script>

<template>
  <div class="max-w-[1600px] mx-auto">
    <DashboardPageHeader
      :section="t('dash.devices.section')"
      :title="activeSite?.domain ?? t('dash.devices.section')"
      :subtitle="t('dash.devices.splitTitle') + ' · ' + range"
    >
      <URangeSelector />
    </DashboardPageHeader>

    <UEmptyState v-if="empty" />

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 border border-ink bg-paper"
    >
      <section
        v-for="(g, gi) in [
          { title: t('dash.devices.deviceType'), data: data.devices },
          { title: t('dash.devices.browser'), data: data.browsers },
        ]"
        :key="g.title"
        class="p-6"
        :class="gi > 0 && 'border-t md:border-t-0 md:border-l border-ink'"
      >
        <div class="flex items-center justify-between mb-6">
          <span class="label">{{ g.title }}</span>
          <span class="label text-mute-2">{{
            t('dash.devices.splits', { n: g.data.length })
          }}</span>
        </div>

        <div class="flex items-center gap-6">
          <div class="relative w-40 h-40 shrink-0">
            <svg viewBox="0 0 200 200" class="w-full h-full -rotate-90">
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="none"
                stroke="currentColor"
                stroke-opacity="0.08"
                stroke-width="22"
              />
              <template v-for="(seg, i) in g.data" :key="seg.label">
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  :stroke-opacity="1 - i * 0.17"
                  stroke-width="22"
                  :stroke-dasharray="`${(seg.pct / 100) * (2 * Math.PI * 70)} ${2 * Math.PI * 70}`"
                  :stroke-dashoffset="
                    -g.data
                      .slice(0, i)
                      .reduce(
                        (a, s) => a + (s.pct / 100) * (2 * Math.PI * 70),
                        0,
                      )
                  "
                />
              </template>
            </svg>
            <div
              class="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div class="font-mono tabular text-2xl">
                {{ g.data[0]?.pct ?? 0 }}%
              </div>
              <div class="label text-mute-2">{{ g.data[0]?.label ?? '-' }}</div>
            </div>
          </div>

          <ul class="flex-1 space-y-2 min-w-0">
            <li
              v-for="(seg, i) in g.data"
              :key="seg.label"
              class="flex items-center gap-3 text-sm"
            >
              <span
                class="w-2 h-2 shrink-0 bg-ink"
                :style="{ opacity: 1 - i * 0.17 }"
              />
              <span class="flex-1 truncate">{{ seg.label }}</span>
              <span class="font-mono tabular text-xs text-mute-1">{{
                seg.visitors.toLocaleString()
              }}</span>
              <span
                class="font-mono tabular text-xs text-mute-1 w-12 text-right"
                >{{ seg.pct }}%</span
              >
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>
