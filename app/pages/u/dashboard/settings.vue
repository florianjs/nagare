<script setup lang="ts">
definePageMeta({ layout: 'u-dashboard', middleware: 'auth' });

const { t } = useI18n();
const { siteId, activeSite } = useActiveSite();
const sitesStore = useSitesStore();
const config = useRuntimeConfig();
const convexSiteUrl = config.public.convexSiteUrl as string;
const appUrl = config.public.appUrl as string;

const endpoint = computed(
  () => convexSiteUrl || 'https://YOUR-CONVEX-SITE.convex.site',
);
const appUrlFinal = computed(() => appUrl || 'http://localhost:3000');

const deleting = ref(false);
const keyCopied = ref(false);

async function copyKey() {
  if (!activeSite.value) return;
  await navigator.clipboard.writeText(activeSite.value.scriptKey);
  keyCopied.value = true;
  setTimeout(() => {
    keyCopied.value = false;
  }, 2000);
}

async function rotateSiteKey() {
  if (!siteId.value) return;
  if (!confirm(t('u.install.rotateConfirm'))) return;
  await sitesStore.rotateKey(siteId.value);
}

async function deleteSite() {
  if (!siteId.value || !activeSite.value) return;
  const answer = prompt(t('u.settings.deleteConfirm'));
  if (answer !== activeSite.value.domain) {
    alert(t('u.settings.deleteMismatch'));
    return;
  }
  deleting.value = true;
  try {
    await sitesStore.remove(siteId.value);
    await navigateTo('/u/dashboard');
  } finally {
    deleting.value = false;
  }
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <div class="max-w-[960px] mx-auto">
    <DashboardPageHeader
      :section="t('u.settings.section')"
      :title="t('u.settings.title')"
      :subtitle="activeSite?.domain ?? ''"
    />

    <div v-if="!activeSite" class="font-mono text-mute-2 py-20 text-center">
      {{ t('dash.common.loading') }}
    </div>

    <div v-else class="space-y-8">
      <!-- Site info -->
      <section class="border border-ink bg-paper">
        <div class="px-8 py-4 border-b border-ink">
          <span class="label text-mute-1"
            >§ 01 - {{ t('u.settings.siteInfo') }}</span
          >
        </div>
        <dl class="px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <dt class="label text-mute-2 mb-2">{{ t('u.settings.domain') }}</dt>
            <dd class="font-mono text-sm">{{ activeSite.domain }}</dd>
          </div>
          <div>
            <dt class="label text-mute-2 mb-2">
              {{ t('u.settings.scriptKey') }}
            </dt>
            <dd class="font-mono text-sm flex items-center gap-3">
              <button
                class="group flex items-center gap-2 hover:text-mute-1 transition-colors cursor-pointer"
                :title="
                  keyCopied ? t('u.install.copied') : t('u.settings.copyKey')
                "
                @click="copyKey"
              >
                <span>{{ activeSite.scriptKey.slice(0, 12) }}…</span>
                <span v-if="keyCopied" class="label text-xs text-mute-1">{{
                  t('u.install.copied')
                }}</span>
                <Icon
                  v-else
                  name="lucide:copy"
                  class="w-3.5 h-3.5 text-mute-3 group-hover:text-ink transition-colors"
                />
              </button>
              <button
                class="label text-mute-1 hover:text-ink underline underline-offset-2"
                @click="rotateSiteKey"
              >
                {{ t('u.install.rotate') }}
              </button>
            </dd>
          </div>
          <div>
            <dt class="label text-mute-2 mb-2">
              {{ t('u.settings.created') }}
            </dt>
            <dd class="font-mono text-sm">
              {{ fmtDate(activeSite._creationTime) }}
            </dd>
          </div>
        </dl>
      </section>

      <!-- Tracker snippet -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <span class="label text-mute-1"
            >§ 02 - {{ t('u.settings.trackerSection') }}</span
          >
        </div>
        <p class="text-mute-1 max-w-[56ch] leading-relaxed mb-5">
          {{ t('u.settings.trackerDesc') }}
        </p>
        <InstallSnippets
          :site-key="activeSite.scriptKey"
          :endpoint="endpoint"
          :app-url="appUrlFinal"
        />
      </section>

      <!-- Iframe embedding (heatmap) -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <span class="label text-mute-1"
            >§ 03 - {{ t('u.install.embedTitle') }}</span
          >
        </div>
        <p class="text-mute-1 max-w-[56ch] leading-relaxed mb-5">
          {{
            t('u.install.embedDesc', { origin: appUrlFinal.replace(/\/$/, '') })
          }}
        </p>
        <EmbedSnippets :dashboard-url="appUrlFinal" />
      </section>

      <!-- Danger zone -->
      <section class="border border-ink bg-paper p-8">
        <div class="label text-mute-1 mb-6">
          § 04 - {{ t('u.settings.dangerZone') }}
        </div>

        <div class="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div class="font-display text-xl italic mb-1">
              {{ t('u.settings.deleteTitle') }}
            </div>
            <p class="text-sm text-mute-1 max-w-[48ch]">
              {{ t('u.settings.deleteDesc') }}
            </p>
          </div>
          <button
            :disabled="deleting"
            class="border border-ink px-5 py-2.5 text-sm hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
            @click="deleteSite"
          >
            {{ t('u.settings.deleteBtn') }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
