import { api } from '~~/convex/_generated/api'
import type { Id } from '~~/convex/_generated/dataModel'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as Id<'sites'>
  const convex = await useConvexAuth(event)
  await convex.mutation(api.sites.remove, { siteId: id })
  return { ok: true }
})
