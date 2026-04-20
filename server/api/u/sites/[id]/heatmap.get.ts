import { api } from '~~/convex/_generated/api'
import type { Id } from '~~/convex/_generated/dataModel'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as Id<'sites'>
  const q = getQuery(event)
  const path = String(q.path ?? '/')
  const kindRaw = String(q.kind ?? 'click')
  const kind = (kindRaw === 'click' || kindRaw === 'move' || kindRaw === 'scroll')
    ? (kindRaw as 'click' | 'move' | 'scroll')
    : 'click'
  const convex = await useConvexAuth(event)
  return await convex.query(api.queries.heatmapPoints, { siteId: id, path, kind })
})
