export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/api') || to.path.startsWith('/_')) return

  const setupStore = useSetupStore()
  if (setupStore.complete === null) {
    await setupStore.check(useRequestFetch() as typeof $fetch)
  }
  const complete = setupStore.complete ?? false

  if (!complete && to.path !== '/setup') {
    return navigateTo('/setup')
  }
  if (complete && to.path === '/setup') {
    const { loggedIn } = useUserSession()
    return navigateTo(loggedIn.value ? '/u/dashboard' : '/login')
  }
})
