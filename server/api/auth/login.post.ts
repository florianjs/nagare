import { api } from '~~/convex/_generated/api'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = (body?.email ?? '').trim().toLowerCase()
  const password = (body?.password ?? '').trim()

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Missing credentials' })
  }

  const convex = useConvex(event)

  // Gate: if setup not done, block login explicitly (user should be on /setup).
  const { complete } = await convex.query(api.users.setupStatus, {})
  if (!complete) {
    throw createError({ statusCode: 428, statusMessage: 'Setup required' })
  }

  const result = await convex.action(api.users.verifyLogin, { email, password })

  if (!result.ok) {
    // Small delay to discourage timing-based enumeration.
    await new Promise(r => setTimeout(r, 400 + Math.random() * 200))
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  await setUserSession(event, {
    user: { email: result.email! },
    loggedInAt: Date.now(),
  })
  return { ok: true, email: result.email! }
})
