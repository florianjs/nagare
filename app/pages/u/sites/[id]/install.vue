<script setup lang="ts">
definePageMeta({
  layout: 'u-dashboard',
  middleware: 'auth',
});

const { t } = useI18n();
const route = useRoute();
const siteId = route.params.id as string;
const config = useRuntimeConfig();
const convexSiteUrl = config.public.convexSiteUrl as string;

const sitesStore = useSitesStore();
if (!sitesStore.loaded)
  await sitesStore.load(useRequestFetch() as typeof $fetch);
const site = computed(() => sitesStore.getById(siteId));

const endpoint = computed(
  () => convexSiteUrl || 'https://YOUR-CONVEX-SITE.convex.site',
);
const appUrl = computed(
  () => (config.public.appUrl as string) || 'http://localhost:3000',
);

async function rotate() {
  if (!confirm(t('u.install.rotateConfirm'))) return;
  await sitesStore.rotateKey(siteId);
}
</script>

<template>
  <div class="max-w-[960px] mx-auto">
    <DashboardPageHeader
      v-if="site"
      :section="t('u.install.section')"
      :title="site.domain"
      :subtitle="
        t('u.install.siteIdLabel', {
          id: siteId.slice(-8),
          key: site.scriptKey.slice(0, 8),
        })
      "
    >
      <NuxtLink
        :to="`/u/dashboard?site=${siteId}`"
        class="label bg-ink text-paper px-4 py-2 hover:bg-mute-1 inline-flex items-center gap-2"
      >
        <span>{{ t('u.install.openDash') }}</span>
        <span>→</span>
      </NuxtLink>
    </DashboardPageHeader>
    <div v-else class="font-mono text-mute-2">
      {{ t('u.install.loadingSite') }}
    </div>

    <div v-if="site" class="space-y-8">
      <!-- § 1 - Snippets (tabbed per framework) -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <div class="label text-mute-1">
            § 01 - {{ t('u.install.addTracker') }}
          </div>
        </div>
        <p class="text-mute-1 max-w-[56ch] leading-relaxed mb-5">
          {{ t('u.install.addTrackerDesc') }}
        </p>
        <InstallSnippets
          :site-key="site.scriptKey"
          :endpoint="endpoint"
          :app-url="appUrl"
        />
      </section>

      <!-- § 2 - SPA routing -->
      <section class="border border-ink bg-paper p-8">
        <div class="label text-mute-1 mb-3">
          § 02 - {{ t('u.install.spaTitle') }}
        </div>
        <h3 class="font-display text-2xl italic mb-3">
          {{ t('u.install.spaSubtitle') }}
        </h3>
        <p class="text-mute-1 max-w-[56ch] leading-relaxed mb-4">
          {{ t('u.install.spaBody') }}
        </p>
        <div
          class="bg-ink text-paper font-mono text-sm px-5 py-4 overflow-x-auto"
        >
          <code class="text-mute-4">{{ t('u.install.spaNote') }}</code>
        </div>
      </section>

      <!-- § 3 - Custom events -->
      <section class="border border-ink bg-paper p-8">
        <div class="label text-mute-1 mb-3">
          § 03 - {{ t('u.install.eventsTitle') }}
        </div>
        <h3 class="font-display text-2xl italic mb-3">
          {{ t('u.install.eventsSubtitle') }}
        </h3>
        <p class="text-mute-1 max-w-[56ch] leading-relaxed mb-4">
          {{ t('u.install.eventsBody') }}
        </p>
        <div
          class="bg-ink text-paper font-mono text-sm px-5 py-4 overflow-x-auto leading-[1.8]"
        >
          <div class="text-mute-3">
            // {{ t('u.install.eventsTrackClick') }}
          </div>
          <div>
            window.nagare.event(<span class="text-paper">'cta.click'</span>)
          </div>
          <div class="mt-3 text-mute-3">
            // {{ t('u.install.eventsTrackPurchase') }}
          </div>
          <div>
            window.nagare.event(<span class="text-paper">'purchase'</span>)
          </div>
        </div>
      </section>

      <!-- § 4 - Heatmap opt-in -->
      <section class="border border-ink bg-paper p-8">
        <div class="label text-mute-1 mb-3">
          § 04 - {{ t('u.install.heatmapTitle') }}
        </div>
        <h3 class="font-display text-2xl italic mb-3">
          {{ t('u.install.heatmapSubtitle') }}
        </h3>
        <p class="text-mute-1 max-w-[56ch] leading-relaxed mb-4">
          {{ t('u.install.heatmapBody') }}
        </p>
        <div
          class="bg-ink text-paper font-mono text-sm px-5 py-4 overflow-x-auto leading-[1.8]"
        >
          <div>
            <span class="text-mute-3">&lt;</span>script
            <span class="text-mute-4">src=</span
            ><span class="text-paper">"…/t.js"</span>
          </div>
          <div>
            <span class="text-mute-4">data-site-id=</span
            ><span class="text-paper">"{{ site.scriptKey }}"</span>
          </div>
          <div>
            <span class="text-mute-4">data-endpoint=</span
            ><span class="text-paper">"{{ endpoint }}"</span>
          </div>
          <div><span class="text-paper">data-ignore-dnt</span></div>
          <div><span class="text-paper">data-track-moves</span></div>
          <div><span class="text-paper">data-track-scroll</span></div>
          <div>
            defer<span class="text-mute-3">&gt;&lt;/</span>script<span
              class="text-mute-3"
              >&gt;</span
            >
          </div>
        </div>
      </section>

      <!-- § 5 - Iframe embedding (heatmap) -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <div class="label text-mute-1">
            § 05 - {{ t('u.install.embedTitle') }}
          </div>
        </div>
        <p class="text-mute-1 max-w-[56ch] leading-relaxed mb-5">
          {{ t('u.install.embedDesc', { origin: appUrl.replace(/\/$/, '') }) }}
        </p>
        <EmbedSnippets :dashboard-url="appUrl" />
      </section>

      <!-- § 6 - Verify -->
      <section class="border border-ink bg-paper p-8">
        <div class="label text-mute-1 mb-3">
          § 06 - {{ t('u.install.verifyTitle') }}
        </div>
        <h3 class="font-display text-3xl italic mb-4">
          {{ t('u.install.verifyTitle') }}
        </h3>
        <ol
          class="text-mute-1 space-y-2 list-decimal list-inside font-mono text-sm"
        >
          <li>
            {{ t('u.install.step1') }}
            <code class="text-ink">&lt;head&gt;</code>
            {{ t('u.install.step1Tail') }}
          </li>
          <li>{{ t('u.install.step2') }}</li>
          <li>
            {{ t('u.install.step3') }}
            <NuxtLink
              :to="`/u/dashboard?site=${siteId}`"
              class="underline text-ink"
              >{{ t('u.install.step3Link') }}</NuxtLink
            >
            {{ t('u.install.step3Tail') }}
          </li>
        </ol>
      </section>

      <!-- § Danger zone -->
      <section class="border border-ink bg-paper p-8">
        <div class="label text-mute-1 mb-3">
          {{ t('u.install.dangerSection') }}
        </div>
        <div class="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div class="font-display text-xl italic mb-1">
              {{ t('u.install.rotateTitle') }}
            </div>
            <p class="text-sm text-mute-1 max-w-[48ch]">
              {{ t('u.install.rotateDesc') }}
            </p>
          </div>
          <button
            class="border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper transition-colors"
            @click="rotate"
          >
            {{ t('u.install.rotate') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
