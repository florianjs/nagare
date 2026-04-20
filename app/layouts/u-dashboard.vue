<script setup lang="ts">
const { user } = useUserSession()
const { t } = useI18n()
const sitesStore = useSitesStore()

if (!sitesStore.loaded) await sitesStore.load(useRequestFetch() as typeof $fetch)

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-paper text-ink grid" style="grid-template-columns: 260px 1fr;">
    <UDashboardSidebar />
    <div class="flex flex-col min-w-0">
      <header class="border-b border-ink bg-paper">
        <div class="flex items-center justify-between px-8 py-4 gap-6">
          <div class="flex items-center gap-3">
            <span class="label bg-ink text-paper px-2 py-1">{{ t('u.session.live') }}</span>
            <span class="label text-mute-1">{{ t('u.session.privateInstance') }}</span>
          </div>
          <div class="flex items-center gap-4">
            <LocaleSwitcher />
            <span class="font-mono text-xs text-mute-1">{{ user?.email }}</span>
            <button
              class="label text-mute-1 hover:text-ink px-3 py-2 border border-ink"
              @click="logout"
            >
              {{ t('u.session.signOut') }}
            </button>
          </div>
        </div>
      </header>
      <main class="flex-1 px-8 py-10 bg-parchment">
        <slot />
      </main>
    </div>
  </div>
</template>
