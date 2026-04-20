<script setup lang="ts">
definePageMeta({ layout: false })

const { t, tm, rt } = useI18n()
const bullets = computed(() =>
  (tm('login.bullets') as string[]).map(b => rt(b)),
)
const route = useRoute()
const { fetch: refreshSession } = useUserSession()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await refreshSession()
    const redirect = (route.query.redirect as string) || '/u/dashboard'
    await navigateTo(redirect)
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    error.value = err?.data?.statusMessage || t('login.error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-parchment flex flex-col">
    <header class="border-b border-ink">
      <div class="max-w-grid mx-auto px-8 py-5 flex items-center justify-between gap-4">
        <NuxtLink to="/" class="flex items-baseline gap-3">
          <span class="font-display text-3xl italic leading-none">nagare</span>
          <span class="label text-mute-2">{{ t('nav.tagline') }}</span>
        </NuxtLink>
        <div class="flex items-center gap-4">
          <LocaleSwitcher />
          <span class="label text-mute-2">{{ t('login.footerLeft') }}</span>
        </div>
      </div>
    </header>

    <main class="flex-1 grid grid-cols-1 md:grid-cols-2">
      <section class="border-r border-ink flex flex-col justify-center p-12 md:p-20 relative">
        <div class="label text-mute-1 mb-10">{{ t('login.section') }}</div>
        <h1 class="font-display text-h1 max-w-[14ch] mb-8">
          {{ t('login.titleLine1') }} <em class="italic">{{ t('login.titleEm') }}</em>
        </h1>
        <p class="text-mute-1 max-w-[44ch] leading-relaxed mb-12">{{ t('login.body') }}</p>
        <div class="font-mono text-xs text-mute-2 space-y-1.5">
          <div v-for="(b, i) in bullets" :key="i">{{ b }}</div>
        </div>
      </section>

      <section class="flex items-center justify-center p-8 md:p-12">
        <form class="w-full max-w-md bg-paper border border-ink" novalidate @submit.prevent="submit">
          <div class="px-8 py-6 border-b border-ink">
            <div class="label text-mute-1">{{ t('login.formLabel') }}</div>
            <div class="font-display italic text-3xl mt-1">{{ t('login.formTitle') }}</div>
          </div>

          <div class="px-8 py-6 space-y-5">
            <label class="block">
              <span class="label text-mute-2 mb-2 block">{{ t('login.email') }}</span>
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                required
                class="w-full border border-ink px-3 py-2.5 font-mono text-sm bg-paper focus:outline-none focus:bg-mute-6"
                :placeholder="t('login.emailPh')"
              >
            </label>
            <label class="block">
              <span class="label text-mute-2 mb-2 block">{{ t('login.password') }}</span>
              <input
                v-model="password"
                type="password"
                autocomplete="current-password"
                required
                class="w-full border border-ink px-3 py-2.5 font-mono text-sm bg-paper focus:outline-none focus:bg-mute-6"
                :placeholder="t('login.passwordPh')"
              >
            </label>
            <div v-if="error" class="text-xs font-mono text-ink bg-mute-6 border border-ink px-3 py-2">
              {{ t('login.errorPrefix') }}{{ error }}
            </div>
          </div>

          <div class="px-8 py-5 border-t border-ink flex items-center justify-between">
            <span class="label text-mute-2">{{ t('login.note') }}</span>
            <button
              type="submit"
              :disabled="loading"
              class="group inline-flex items-center gap-2 bg-ink text-paper px-5 py-2.5 text-sm disabled:opacity-50"
            >
              <span>{{ loading ? t('login.submitting') : t('login.submit') }}</span>
              <span v-if="!loading" class="group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
          </div>
        </form>
      </section>
    </main>

    <footer class="border-t border-ink">
      <div class="max-w-grid mx-auto px-8 py-4 label text-mute-2 flex items-center justify-between">
        <span>{{ t('login.footerLeft') }}</span>
        <span class="font-mono">© 2026</span>
      </div>
    </footer>
  </div>
</template>
