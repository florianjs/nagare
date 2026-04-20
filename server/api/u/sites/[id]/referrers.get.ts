import { api } from '~~/convex/_generated/api'
import type { Id } from '~~/convex/_generated/dataModel'

const RANGES: Record<string, number> = {
  '24h': 86_400_000, '7d': 604_800_000, '30d': 2_592_000_000, '90d': 7_776_000_000,
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as Id<'sites'>
  const q = getQuery(event)
  const window = RANGES[String(q.range ?? '30d')] ?? RANGES['30d']!
  const convex = await useConvexAuth(event)
  return await convex.query(api.queries.referrersDetail, {
    siteId: id, sinceMs: Date.now() - window, limit: 200,
  })
})
