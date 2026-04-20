export const useSetupStore = defineStore('setup', () => {
  const complete = ref<boolean | null>(null)
  const checking = ref(false)

  async function check(fetcher?: typeof $fetch) {
    if (checking.value) return
    checking.value = true
    try {
      const fn = fetcher ?? $fetch
      const { complete: c } = await fn<{ complete: boolean }>('/api/setup/status')
      complete.value = c
    } finally {
      checking.value = false
    }
  }

  function markComplete() {
    complete.value = true
  }

  return { complete, checking, check, markComplete }
})
