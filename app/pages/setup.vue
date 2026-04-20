<script setup lang="ts">
definePageMeta({ layout: false })

const { t } = useI18n()
const { fetch: refreshSession } = useUserSession()
const setupStore = useSetupStore()

const email = ref('')
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')

function passwordStrength(p: string): { label: string; level: number } {
  let score = 0
  if (p.length >= 12) score++
  if (p.length >= 16) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^A-Z0-9]/i.test(p)) score++
  const labels = ['', 'weak', 'fair', 'good', 'strong', 'excellent'] as const
  return { label: labels[score] ?? '', level: score }
}

const strength = computed(() => passwordStrength(password.value))

async function submit() {
  error.value = ''
  if (password.value !== confirm.value) {
    error.value = t('setup.mismatch')
    return
  }
  if (password.value.length < 12) {
    error.value = t('setup.tooShort')
    return
  }
  loading.value = true
  try {
    await $fetch('/api/setup/create', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    setupStore.markComplete()
    await refreshSession()
    await navigateTo('/u/dashboard', { replace: true })
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    error.value = err?.data?.statusMessage || t('setup.failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-parchment flex flex-col">
    <header class="border-b border-ink">
      <div class="max-w-grid mx-auto px-8 py-5 flex items-center justify-between gap-4">
        <div class="flex items-baseline gap-3">
          <span class="font-display text-3xl italic leading-none">nagare</span>
          <span class="label text-mute-2">{{ t('nav.tagline') }}</span>
        </div>
        <LocaleSwitcher />
      </div>
    </header>

    <main class="flex-1 grid grid-cols-1 md:grid-cols-2">
      <section class="border-r border-ink flex flex-col justify-center p-12 md:p-20 relative">
        <div class="label text-mute-1 mb-10">{{ t('setup.section') }}</div>
        <h1 class="font-display text-h1 max-w-[14ch] mb-8">
          {{ t('setup.titleLine1') }} <em class="italic">{{ t('setup.titleEm') }}</em>
        </h1>
        <p class="text-mute-1 max-w-[46ch] leading-relaxed mb-12">{{ t('setup.body') }}</p>
        <div class="font-mono text-xs text-mute-2 space-y-1.5">
          <div>{{ t('setup.bullet1') }}</div>
          <div>{{ t('setup.bullet2') }}</div>
          <div>{{ t('setup.bullet3') }}</div>
        </div>
      </section>

      <section class="flex items-center justify-center p-8 md:p-12">
        <form class="w-full max-w-md bg-paper border border-ink" novalidate @submit.prevent="submit">
          <div class="px-8 py-6 border-b border-ink">
            <div class="label text-mute-1">{{ t('setup.formLabel') }}</div>
            <div class="font-display italic text-3xl mt-1">{{ t('setup.formTitle') }}</div>
          </div>

          <div class="px-8 py-6 space-y-5">
            <label class="block">
              <span class="label text-mute-2 mb-2 block">{{ t('setup.email') }}</span>
              <input
                v-model="email"
                type="email"
                autocomplete="username"
                required
                class="w-full border border-ink px-3 py-2.5 font-mono text-sm bg-paper focus:outline-none focus:bg-mute-6"
                :placeholder="t('setup.emailPh')"
              >
            </label>
            <label class="block">
              <span class="label text-mute-2 mb-2 block">{{ t('setup.password') }}</span>
              <input
                v-model="password"
                type="password"
                autocomplete="new-password"
                required
                class="w-full border border-ink px-3 py-2.5 font-mono text-sm bg-paper focus:outline-none focus:bg-mute-6"
                :placeholder="t('setup.passwordPh')"
              >
              <div v-if="password" class="mt-2 flex items-center gap-2">
                <div class="flex gap-0.5 flex-1">
                  <div
                    v-for="i in 5"
                    :key="i"
                    class="h-1 flex-1"
                    :class="i <= strength.level ? 'bg-ink' : 'bg-mute-5'"
                  />
                </div>
                <span class="font-mono text-[10px] text-mute-2 uppercase tracking-wider w-20 text-right">
                  {{ strength.label }}
                </span>
              </div>
            </label>
            <label class="block">
              <span class="label text-mute-2 mb-2 block">{{ t('setup.confirm') }}</span>
              <input
                v-model="confirm"
                type="password"
                autocomplete="new-password"
                required
                class="w-full border border-ink px-3 py-2.5 font-mono text-sm bg-paper focus:outline-none focus:bg-mute-6"
                :placeholder="t('setup.passwordPh')"
              >
            </label>
            <div v-if="error" class="text-xs font-mono text-ink bg-mute-6 border border-ink px-3 py-2">
              ✕ {{ error }}
            </div>
          </div>

          <div class="px-8 py-5 border-t border-ink flex items-center justify-between">
            <span class="label text-mute-2">{{ t('setup.oneShot') }}</span>
            <button
              type="submit"
              :disabled="loading"
              class="group inline-flex items-center gap-2 bg-ink text-paper px-5 py-2.5 text-sm disabled:opacity-50"
            >
              <span>{{ loading ? t('setup.creating') : t('setup.create') }}</span>
              <span v-if="!loading" class="group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
          </div>
        </form>
      </section>
    </main>

    <footer class="border-t border-ink">
      <div class="max-w-grid mx-auto px-8 py-4 label text-mute-2 flex items-center justify-between">
        <span>{{ t('setup.footerLeft') }}</span>
        <span class="font-mono">© 2026</span>
      </div>
    </footer>
  </div>
</template>
