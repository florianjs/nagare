import { getJwks } from '~~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=300')
  setHeader(event, 'Content-Type', 'application/json')
  return await getJwks(event)
})
