import { SignJWT, importPKCS8, exportJWK, calculateJwkThumbprint } from 'jose'
import type { JWK } from 'jose'
import type { H3Event } from 'h3'

const ALG = 'RS256'
const APP_ID = 'nagare-dashboard'

type KeyBundle = {
  privateKey: CryptoKey
  jwk: JWK
  kid: string
  issuer: string
}

let cached: KeyBundle | null = null

async function loadKeys(event?: H3Event): Promise<KeyBundle> {
  if (cached) return cached

  const config = useRuntimeConfig(event)
  const b64 = (config.jwtPrivateKey as string) || ''
  if (!b64) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_JWT_PRIVATE_KEY not configured. Run `node scripts/generate-jwt-keys.mjs` and add to .env.',
    })
  }

  const pem = Buffer.from(b64, 'base64').toString('utf8')
  const privateKey = await importPKCS8(pem, ALG, { extractable: true })

  const publicJwk = await exportJWK(privateKey)
  delete publicJwk.d
  delete publicJwk.p
  delete publicJwk.q
  delete publicJwk.dp
  delete publicJwk.dq
  delete publicJwk.qi
  publicJwk.alg = ALG
  publicJwk.use = 'sig'
  const kid = await calculateJwkThumbprint(publicJwk)
  publicJwk.kid = kid

  const issuer = (config.public.appUrl as string).replace(/\/$/, '')

  const bundle: KeyBundle = { privateKey: privateKey as CryptoKey, jwk: publicJwk, kid, issuer }
  cached = bundle
  return bundle
}

export async function getJwks(event?: H3Event): Promise<{ keys: JWK[] }> {
  const { jwk } = await loadKeys(event)
  return { keys: [jwk] }
}

export async function signConvexToken(event: H3Event, email: string): Promise<string> {
  const { privateKey, kid, issuer } = await loadKeys(event)
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: ALG, kid, typ: 'JWT' })
    .setSubject(email)
    .setIssuer(issuer)
    .setAudience(APP_ID)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(privateKey)
}
