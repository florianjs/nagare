import { query } from './_generated/server'
import { v } from 'convex/values'
import type { QueryCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'

async function requireOwner(ctx: QueryCtx, siteId: Id<'sites'>): Promise<Doc<'sites'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Unauthenticated')
  const email = typeof identity.email === 'string' ? identity.email.toLowerCase() : null
  if (!email) throw new Error('Unauthenticated')
  const site = await ctx.db.get(siteId)
  if (!site || site.ownerEmail !== email) throw new Error('Not authorized')
  return site
}

export const siteStats = query({
  args: {
    siteId: v.id('sites'),
    sinceMs: v.number(),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.siteId)

    const events = await ctx.db
      .query('events')
      .withIndex('by_site_ts', q => q.eq('siteId', args.siteId).gte('ts', args.sinceMs))
      .take(10_000)

    const pageviews = events.filter(e => e.type === 'pageview').length
    const visitors = new Set(events.map(e => e.visitorHash)).size

    const visitorPaths = new Map<string, number>()
    for (const e of events) {
      if (e.type !== 'pageview') continue
      visitorPaths.set(e.visitorHash, (visitorPaths.get(e.visitorHash) ?? 0) + 1)
    }
    const singles = Array.from(visitorPaths.values()).filter(c => c === 1).length
    const bounceRate = visitorPaths.size > 0 ? singles / visitorPaths.size : 0

    const durations = events.filter(e => typeof e.durationMs === 'number').map(e => e.durationMs as number)
    const avgDurationMs = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0

    return { pageviews, visitors, bounceRate, avgDurationMs }
  },
})

export const topPages = query({
  args: {
    siteId: v.id('sites'),
    sinceMs: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.siteId)

    const events = await ctx.db
      .query('events')
      .withIndex('by_site_ts', q => q.eq('siteId', args.siteId).gte('ts', args.sinceMs))
      .take(10_000)

    const counts = new Map<string, number>()
    for (const e of events) {
      if (e.type !== 'pageview') continue
      counts.set(e.path, (counts.get(e.path) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, args.limit ?? 10)
  },
})

export const topReferrers = query({
  args: {
    siteId: v.id('sites'),
    sinceMs: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.siteId)

    const events = await ctx.db
      .query('events')
      .withIndex('by_site_ts', q => q.eq('siteId', args.siteId).gte('ts', args.sinceMs))
      .take(10_000)

    const counts = new Map<string, number>()
    for (const e of events) {
      if (e.type !== 'pageview') continue
      const ref = e.referrer || 'Direct / None'
      counts.set(ref, (counts.get(ref) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([source, visitors]) => ({ source, visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, args.limit ?? 10)
  },
})

export const topCountries = query({
  args: {
    siteId: v.id('sites'),
    sinceMs: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.siteId)

    const events = await ctx.db
      .query('events')
      .withIndex('by_site_ts', q => q.eq('siteId', args.siteId).gte('ts', args.sinceMs))
      .take(10_000)

    const counts = new Map<string, Set<string>>()
    for (const e of events) {
      const c = e.country ?? 'ZZ'
      if (!counts.has(c)) counts.set(c, new Set())
      counts.get(c)!.add(e.visitorHash)
    }
    return Array.from(counts.entries())
      .map(([code, set]) => ({ code, visitors: set.size }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, args.limit ?? 20)
  },
})

export const liveEvents = query({
  args: {
    siteId: v.id('sites'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.siteId)

    const events = await ctx.db
      .query('events')
      .withIndex('by_site_ts', q => q.eq('siteId', args.siteId))
      .order('desc')
      .take(args.limit ?? 50)

    return events.map(e => ({
      _id: e._id,
      ts: e.ts,
      path: e.path,
      type: e.type,
      eventName: e.eventName,
      referrer: e.referrer,
      country: e.country,
      deviceType: e.deviceType,
    }))
  },
})

export const onlineVisitors = query({
  args: {
    siteId: v.id('sites'),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.siteId)

    const fiveMinAgo = Date.now() - 5 * 60 * 1000
    const events = await ctx.db
      .query('events')
      .withIndex('by_site_ts', q => q.eq('siteId', args.siteId).gte('ts', fiveMinAgo))
      .take(5_000)

    return new Set(events.map(e => e.visitorHash)).size
  },
})

export const pagesDetail = query({
  args: {
    siteId: v.id('sites'),
    sinceMs: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.siteId)
    const events = await ctx.db
      .query('events')
      .withIndex('by_site_ts', q => q.eq('siteId', args.siteId).gte('ts', args.sinceMs))
      .take(20_000)

    type Agg = {
      views: number
      visitors: Set<string>
      durations: number[]
      visitorPageviews: Map<string, number>
    }
    const byPath = new Map<string, Agg>()
    for (const e of events) {
      if (e.type !== 'pageview') continue
      if (!byPath.has(e.path)) {
        byPath.set(e.path, { views: 0, visitors: new Set(), durations: [], visitorPageviews: new Map() })
      }
      const a = byPath.get(e.path)!
      a.views++
      a.visitors.add(e.visitorHash)
      if (typeof e.durationMs === 'number') a.durations.push(e.durationMs)
      a.visitorPageviews.set(e.visitorHash, (a.visitorPageviews.get(e.visitorHash) ?? 0) + 1)
    }

    const rows = Array.from(byPath.entries()).map(([path, a]) => {
      const avgDur = a.durations.length > 0 ? a.durations.reduce((x, y) => x + y, 0) / a.durations.length : 0
      const singles = Array.from(a.visitorPageviews.values()).filter(c => c === 1).length
      const bounce = a.visitors.size > 0 ? singles / a.visitors.size : 0
      return { path, views: a.views, visitors: a.visitors.size, bounceRate: bounce, avgDurationMs: avgDur }
    })
    return rows.sort((a, b) => b.views - a.views).slice(0, args.limit ?? 100)
  },
})

export const referrersDetail = query({
  args: {
    siteId: v.id('sites'),
    sinceMs: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.siteId)
    const events = await ctx.db
      .query('events')
      .withIndex('by_site_ts', q => q.eq('siteId', args.siteId).gte('ts', args.sinceMs))
      .take(20_000)

    const bySrc = new Map<string, { visitors: Set<string>; sessions: number }>()
    for (const e of events) {
      if (e.type !== 'pageview') continue
      const src = e.referrer || 'Direct / None'
      if (!bySrc.has(src)) bySrc.set(src, { visitors: new Set(), sessions: 0 })
      const a = bySrc.get(src)!
      a.visitors.add(e.visitorHash)
      a.sessions++
    }
    const SEARCH = ['google', 'bing', 'duckduckgo', 'yahoo', 'baidu', 'yandex', 'ecosia', 'brave']
    const SOCIAL = ['twitter', 'x.com', 't.co', 'facebook', 'linkedin', 'reddit', 'mastodon', 'instagram', 'threads', 'bsky', 'tiktok', 'news.ycombinator']
    function channel(src: string): string {
      if (src === 'Direct / None') return 'Direct'
      const low = src.toLowerCase()
      if (SEARCH.some(s => low.includes(s))) return 'Search'
      if (SOCIAL.some(s => low.includes(s))) return 'Social'
      return 'Referral'
    }
    return Array.from(bySrc.entries())
      .map(([source, a]) => ({
        source,
        channel: channel(source),
        visitors: a.visitors.size,
        sessions: a.sessions,
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, args.limit ?? 200)
  },
})

export const countriesDetail = query({
  args: {
    siteId: v.id('sites'),
    sinceMs: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.siteId)
    const events = await ctx.db
      .query('events')
      .withIndex('by_site_ts', q => q.eq('siteId', args.siteId).gte('ts', args.sinceMs))
      .take(20_000)

    const byCountry = new Map<string, Set<string>>()
    for (const e of events) {
      const c = e.country ?? 'ZZ'
      if (!byCountry.has(c)) byCountry.set(c, new Set())
      byCountry.get(c)!.add(e.visitorHash)
    }
    const total = Array.from(byCountry.values()).reduce((a, s) => a + s.size, 0)
    return Array.from(byCountry.entries())
      .map(([code, set]) => ({ code, visitors: set.size, pct: total > 0 ? set.size / total : 0 }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, args.limit ?? 200)
  },
})

export const deviceSplit = query({
  args: {
    siteId: v.id('sites'),
    sinceMs: v.number(),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.siteId)
    const events = await ctx.db
      .query('events')
      .withIndex('by_site_ts', q => q.eq('siteId', args.siteId).gte('ts', args.sinceMs))
      .take(20_000)

    const byDevice = new Map<string, Set<string>>()
    const byBrowser = new Map<string, Set<string>>()
    for (const e of events) {
      const d = e.deviceType ?? 'unknown'
      const b = e.uaFamily ?? 'Other'
      if (!byDevice.has(d)) byDevice.set(d, new Set())
      if (!byBrowser.has(b)) byBrowser.set(b, new Set())
      byDevice.get(d)!.add(e.visitorHash)
      byBrowser.get(b)!.add(e.visitorHash)
    }
    const toList = (m: Map<string, Set<string>>) => {
      const tot = Array.from(m.values()).reduce((a, s) => a + s.size, 0)
      return Array.from(m.entries())
        .map(([label, set]) => ({ label, visitors: set.size, pct: tot > 0 ? Math.round(set.size / tot * 1000) / 10 : 0 }))
        .sort((a, b) => b.visitors - a.visitors)
    }
    return { devices: toList(byDevice), browsers: toList(byBrowser) }
  },
})

export const eventDefinitions = query({
  args: {
    siteId: v.id('sites'),
    sinceMs: v.number(),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.siteId)
    const events = await ctx.db
      .query('events')
      .withIndex('by_site_ts', q => q.eq('siteId', args.siteId).gte('ts', args.sinceMs))
      .take(20_000)

    const byName = new Map<string, { count: number; users: Set<string>; lastSeen: number }>()
    for (const e of events) {
      if (e.type !== 'event') continue
      const n = e.eventName ?? '(unnamed)'
      if (!byName.has(n)) byName.set(n, { count: 0, users: new Set(), lastSeen: 0 })
      const a = byName.get(n)!
      a.count++
      a.users.add(e.visitorHash)
      if (e.ts > a.lastSeen) a.lastSeen = e.ts
    }
    return Array.from(byName.entries())
      .map(([name, a]) => ({ name, count: a.count, users: a.users.size, lastSeen: a.lastSeen }))
      .sort((a, b) => b.count - a.count)
  },
})

export const heatmapPoints = query({
  args: {
    siteId: v.id('sites'),
    path: v.string(),
    kind: v.union(v.literal('click'), v.literal('move'), v.literal('scroll')),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.siteId)

    const points = await ctx.db
      .query('heatmapPoints')
      .withIndex('by_site_path_kind', q =>
        q.eq('siteId', args.siteId).eq('path', args.path).eq('kind', args.kind),
      )
      .order('desc')
      .take(5_000)

    return points.map(p => ({ x: p.xRatio, y: p.yRatio, ts: p.ts }))
  },
})

export const visitorTimeline = query({
  args: {
    siteId: v.id('sites'),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx, args.siteId)

    const now = Date.now()
    const thirtyMinAgo = now - 30 * 60 * 1000

    const events = await ctx.db
      .query('events')
      .withIndex('by_site_ts', q => q.eq('siteId', args.siteId).gte('ts', thirtyMinAgo))
      .take(10_000)

    const buckets: { minute: number; visitors: number }[] = []
    for (let i = 0; i < 30; i++) {
      const bucketStart = thirtyMinAgo + i * 60_000
      const bucketEnd = bucketStart + 60_000
      const hashes = new Set<string>()
      for (const e of events) {
        if (e.ts >= bucketStart && e.ts < bucketEnd) {
          hashes.add(e.visitorHash)
        }
      }
      buckets.push({ minute: i, visitors: hashes.size })
    }

    return buckets
  },
})
