/**
 * JWT verification config for Convex `ctx.auth.getUserIdentity()`.
 *
 * The Nuxt app signs short-lived JWTs (RS256) with the user's session email and
 * exposes the public JWKS at `${NUXT_PUBLIC_APP_URL}/.well-known/jwks.json`.
 * Convex fetches that JWKS on boot and caches it.
 *
 * Required env on the Convex deployment:
 *   CONVEX_AUTH_DOMAIN = https://<public-nuxt-url>   (no trailing slash)
 *
 * In local dev the URL must be reachable from Convex Cloud — expose Nuxt via a
 * tunnel (cloudflared/ngrok) and point CONVEX_AUTH_DOMAIN at the tunnel host.
 */
// First deploy runs before NUXT_PUBLIC_APP_URL is known — install.sh sets
// CONVEX_AUTH_DOMAIN after the first Worker deploy and redeploys Convex.
// An empty domain disables auth (every getUserIdentity() returns null) so the
// initial deploy does not crash, but all `/api/u/**` calls will 401 until the
// second deploy lands.
// Bracket access avoids Convex's static env-var check, which would otherwise
// abort the first deploy (before install.sh can set CONVEX_AUTH_DOMAIN).
const domain = (process.env as Record<string, string | undefined>)['CONVEX_AUTH_DOMAIN'] ?? ''

export default {
  providers: domain
    ? [{ domain, applicationID: 'nagare-dashboard' }]
    : [],
}
