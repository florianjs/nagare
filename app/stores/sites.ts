export type Site = {
  _id: string
  _creationTime: number
  ownerEmail: string
  domain: string
  name: string
  scriptKey: string
}

export const useSitesStore = defineStore('sites', () => {
  const sites = ref<Site[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  async function load(fetcher?: typeof $fetch) {
    if (loading.value) return
    loading.value = true
    try {
      const fn = fetcher ?? $fetch
      sites.value = await fn<Site[]>('/api/u/sites')
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function create(domain: string, name?: string): Promise<string> {
    const { _id } = await $fetch<{ _id: string }>('/api/u/sites', {
      method: 'POST',
      body: { domain, name },
    })
    await load()
    return _id
  }

  async function remove(siteId: string) {
    await $fetch(`/api/u/sites/${siteId}`, { method: 'DELETE' })
    sites.value = sites.value.filter(s => s._id !== siteId)
  }

  async function rotateKey(siteId: string): Promise<string> {
    const { scriptKey } = await $fetch<{ scriptKey: string }>(
      `/api/u/sites/${siteId}/rotate`,
      { method: 'POST' },
    )
    const site = sites.value.find(s => s._id === siteId)
    if (site) site.scriptKey = scriptKey
    return scriptKey
  }

  function getById(id: string): Site | undefined {
    return sites.value.find(s => s._id === id)
  }

  return { sites, loaded, loading, load, create, remove, rotateKey, getById }
})
