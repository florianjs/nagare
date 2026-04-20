export function useActiveSite() {
  const route = useRoute()
  const router = useRouter()
  const sitesStore = useSitesStore()

  const siteId = computed(() => route.query.site as string | undefined)
  const range = computed(() => (route.query.range as string) || '30d')

  const activeSite = computed(() =>
    sitesStore.sites.find(s => s._id === siteId.value) ?? null,
  )

  function setRange(r: string) {
    router.push({ query: { ...route.query, range: r } })
  }

  return { siteId, range, activeSite, setRange }
}

export const RANGES = ['24h', '7d', '30d', '90d']
