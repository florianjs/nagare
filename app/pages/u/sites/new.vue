<script setup lang="ts">
definePageMeta({
  layout: 'u-dashboard',
  middleware: 'auth',
})

const { t } = useI18n()
const sitesStore = useSitesStore()

const domain = ref('')
const name = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (!domain.value.trim()) {
    error.value = t('u.newSite.domainRequired')
    return
  }
  loading.value = true
  try {
    const siteId = await sitesStore.create(domain.value, name.value || undefined)
    await navigateTo(`/u/sites/${siteId}/install`)
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    error.value = err?.data?.statusMessage || t('u.newSite.failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-[720px] mx-auto">
    <DashboardPageHeader
      :section="t('u.newSite.section')"
      :title="t('u.newSite.title')"
      :subtitle="t('u.newSite.subtitle')"
    />

    <form class="border border-ink bg-paper" novalidate @submit.prevent="submit">
      <div class="px-8 py-6 space-y-5 border-b border-ink">
        <label class="block">
          <span class="label text-mute-2 mb-2 block">{{ t('u.newSite.domain') }}</span>
          <input
            v-model="domain"
            type="text"
            required
            :placeholder="t('u.newSite.domainPh')"
            class="w-full border border-ink px-3 py-2.5 font-mono text-sm bg-paper focus:outline-none focus:bg-mute-6"
          >
          <span class="text-xs text-mute-2 font-mono mt-2 block">{{ t('u.newSite.domainHint') }}</span>
        </label>
        <label class="block">
          <span class="label text-mute-2 mb-2 block">{{ t('u.newSite.name') }}</span>
          <input
            v-model="name"
            type="text"
            :placeholder="domain || t('u.newSite.namePh')"
            class="w-full border border-ink px-3 py-2.5 font-mono text-sm bg-paper focus:outline-none focus:bg-mute-6"
          >
        </label>
        <div v-if="error" class="text-xs font-mono text-ink bg-mute-6 border border-ink px-3 py-2">
          ✕ {{ error }}
        </div>
      </div>
      <div class="px-8 py-4 flex items-center justify-between">
        <NuxtLink to="/u/dashboard" class="label text-mute-1 hover:text-ink">{{ t('u.newSite.cancel') }}</NuxtLink>
        <button
          type="submit"
          :disabled="loading"
          class="bg-ink text-paper px-6 py-2.5 text-sm disabled:opacity-50 inline-flex items-center gap-2"
        >
          <span>{{ loading ? t('u.newSite.creating') : t('u.newSite.create') }}</span>
          <span v-if="!loading">→</span>
        </button>
      </div>
    </form>
  </div>
</template>
