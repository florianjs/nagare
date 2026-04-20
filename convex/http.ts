import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'

const http = httpRouter()

function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function parseUA(ua: string): { family: string; device: string } {
  const u = ua.toLowerCase()
  let family = 'Other'
  if (u.includes('firefox')) family = 'Firefox'
  else if (u.includes('edg/')) family = 'Edge'
  else if (u.includes('chrome')) family = 'Chrome'
  else if (u.includes('safari')) family = 'Safari'
  let device = 'desktop'
  if (/mobile|iphone|android/.test(u) && !/ipad|tablet/.test(u)) device = 'mobile'
  else if (/ipad|tablet/.test(u)) device = 'tablet'
  return { family, device }
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('')
}

function dayNumber(ts: number): number {
  return Math.floor(ts / 86_400_000)
}

import type { ActionCtx } from './_generated/server'

async function ensureDailySalt(ctx: ActionCtx): Promise<string> {
  const day = dayNumber(Date.now())
  const existing: Doc<'dailySalts'> | null = await ctx.runQuery(internal.ingest.getDailySalt, { day })
  if (existing) return existing.salt
  const rand = new Uint8Array(32)
  crypto.getRandomValues(rand)
  const salt = Array.from(rand, b => b.toString(16).padStart(2, '0')).join('')
  await ctx.runMutation(internal.ingest.setDailySalt, { day, salt })
  return salt
}

function clientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '0.0.0.0'
  )
}

function dnt(req: Request): boolean {
  return req.headers.get('dnt') === '1' || req.headers.get('sec-gpc') === '1'
}

http.route({
  path: '/ingest',
  method: 'OPTIONS',
  handler: httpAction(async (_ctx, req) => {
    return new Response(null, { status: 204, headers: cors(req.headers.get('origin')) })
  }),
})

http.route({
  path: '/ingest',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const origin = req.headers.get('origin')

    // DNT/GPC check is handled client-side in t.js.
    // The data-ignore-dnt attribute opts out (legal: no cookies, hashed IPs, ePrivacy Art 5(3) exempt).
    // Server does NOT re-check — if the client sent the event, the decision was already made.

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return new Response('Invalid JSON', { status: 400, headers: cors(origin) })
    }

    const { k, p, r, t, n, d, hx, hy, hk } = body ?? {}
    if (typeof k !== 'string' || typeof p !== 'string') {
      return new Response('Bad payload', { status: 400, headers: cors(origin) })
    }

    const site: Doc<'sites'> | null = await ctx.runQuery(internal.sites.bySiteKey, { scriptKey: k })
    if (!site) {
      return new Response('Unknown site', { status: 404, headers: cors(origin) })
    }

    const ip = clientIp(req)
    const ua = req.headers.get('user-agent') ?? ''
    const salt = await ensureDailySalt(ctx)
    const visitorHash = await sha256Hex(`${ip}|${ua}|${salt}|${site._id}`)

    const { family, device } = parseUA(ua)
    const country = req.headers.get('cf-ipcountry') ?? undefined

    const type: 'pageview' | 'event' = t === 'event' ? 'event' : 'pageview'

    await ctx.runMutation(internal.ingest.insertEvent, {
      siteId: site._id,
      ts: Date.now(),
      path: p,
      type,
      eventName: typeof n === 'string' ? n : undefined,
      visitorHash,
      referrer: typeof r === 'string' && r ? r : undefined,
      uaFamily: family,
      deviceType: device,
      country,
      durationMs: typeof d === 'number' ? d : undefined,
    })

    if (
      typeof hx === 'number' &&
      typeof hy === 'number' &&
      (hk === 'click' || hk === 'move' || hk === 'scroll')
    ) {
      await ctx.runMutation(internal.ingest.insertHeatmapPoint, {
        siteId: site._id,
        path: p,
        kind: hk,
        xRatio: Math.max(0, Math.min(1, hx)),
        yRatio: Math.max(0, Math.min(1, hy)),
        ts: Date.now(),
        visitorHash,
      })
    }

    return new Response(null, { status: 204, headers: cors(origin) })
  }),
})

export default http
