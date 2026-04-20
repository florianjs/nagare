import { api } from '~~/convex/_generated/api'
import type { Id } from '~~/convex/_generated/dataModel'

const RANGES: Record<string, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as Id<'sites'>
  const query = getQuery(event)
  const rangeKey = String(query.range ?? '30d')
  const window = RANGES[rangeKey] ?? RANGES['30d']
  const sinceMs = Date.now() - window!

  const convex = await useConvexAuth(event)
  const baseArgs = { siteId: id, sinceMs }

  const [site, stats, pages, refs, countries, live, online, timeline] = await Promise.all([
    convex.query(api.sites.get, { siteId: id }),
    convex.query(api.queries.siteStats, baseArgs),
    convex.query(api.queries.topPages, { ...baseArgs, limit: 10 }),
    convex.query(api.queries.topReferrers, { ...baseArgs, limit: 10 }),
    convex.query(api.queries.topCountries, { ...baseArgs, limit: 10 }),
    convex.query(api.queries.liveEvents, { siteId: id, limit: 20 }),
    convex.query(api.queries.onlineVisitors, { siteId: id }),
    convex.query(api.queries.visitorTimeline, { siteId: id }),
  ])

  return { site, stats, pages, refs, countries, live, online, timeline, range: rangeKey }
})
