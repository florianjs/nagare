import { api } from '~~/convex/_generated/api'

export default defineEventHandler(async (event) => {
  const convex = useConvex(event)
  return await convex.query(api.users.setupStatus, {})
})
