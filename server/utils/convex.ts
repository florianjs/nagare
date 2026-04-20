import { ConvexHttpClient } from 'convex/browser'
import type { H3Event } from 'h3'
import { signConvexToken } from './jwt'

function newClient(event?: H3Event): ConvexHttpClient {
  const config = useRuntimeConfig(event)
  const url = config.convexUrl as string
  if (!url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'CONVEX_URL not configured. Set it in .env or wrangler.toml [vars].',
    })
  }
  return new ConvexHttpClient(url)
}

/**
 * Anonymous Convex client — only for public functions (users.setupStatus,
 * users.verifyLogin, users.createFirstUser). Fresh client per call so no auth
 * state leaks across requests.
 */
export function useConvex(event?: H3Event): ConvexHttpClient {
  return newClient(event)
}

/**
 * Authenticated Convex client: signs a short-lived JWT from the Nuxt session
 * so `ctx.auth.getUserIdentity()` returns the logged-in user inside Convex.
 * Fresh client per request — never cache.
 */
export async function useConvexAuth(event: H3Event): Promise<ConvexHttpClient> {
  const session = await requireUserSession(event)
  const email = session.user?.email
  if (!email) throw createError({ statusCode: 401 })
  const token = await signConvexToken(event, email)
  const client = newClient(event)
  client.setAuth(token)
  return client
}
