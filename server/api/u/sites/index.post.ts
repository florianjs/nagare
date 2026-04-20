import { api } from '~~/convex/_generated/api'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ domain?: string; name?: string }>(event)
  const domain = (body?.domain ?? '').trim().toLowerCase()
  const name = (body?.name ?? domain).trim()
  if (!domain) throw createError({ statusCode: 400, statusMessage: 'domain required' })

  const convex = await useConvexAuth(event)
  const siteId = await convex.mutation(api.sites.create, { domain, name })
  return { _id: siteId }
})
