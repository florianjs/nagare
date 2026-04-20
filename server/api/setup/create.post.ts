import { api } from '~~/convex/_generated/api'

export default defineEventHandler(async (event) => {
  const convex = useConvex(event)

  // Backend gate: refuse if any user already exists.
  const { complete } = await convex.query(api.users.setupStatus, {})
  if (complete) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Setup already complete',
    })
  }

  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = (body?.email ?? '').trim().toLowerCase()
  const password = (body?.password ?? '').trim()

  if (!email || !email.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email' })
  }
  if (password.length < 12) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 12 characters' })
  }

  try {
    await convex.action(api.users.createFirstUser, { email, password })
  } catch (e: unknown) {
    const msg = String((e as Error)?.message ?? e)
    if (msg.includes('Setup already complete')) {
      throw createError({ statusCode: 403, statusMessage: 'Setup already complete' })
    }
    throw createError({ statusCode: 400, statusMessage: msg.replace(/^Error: /, '') })
  }

  await setUserSession(event, {
    user: { email },
    loggedInAt: Date.now(),
  })
  return { ok: true, email }
})
