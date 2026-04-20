import { api } from '~~/convex/_generated/api'

export default defineEventHandler(async (event) => {
  const convex = await useConvexAuth(event)
  return await convex.query(api.sites.list, {})
})
