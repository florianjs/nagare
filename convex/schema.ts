import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  sites: defineTable({
    ownerEmail: v.string(),
    domain: v.string(),
    name: v.string(),
    scriptKey: v.string(),
  })
    .index('by_owner', ['ownerEmail'])
    .index('by_script_key', ['scriptKey']),

  events: defineTable({
    siteId: v.id('sites'),
    ts: v.number(),
    path: v.string(),
    type: v.union(v.literal('pageview'), v.literal('event')),
    eventName: v.optional(v.string()),
    visitorHash: v.string(),
    referrer: v.optional(v.string()),
    uaFamily: v.optional(v.string()),
    deviceType: v.optional(v.string()),
    country: v.optional(v.string()),
    durationMs: v.optional(v.number()),
  })
    .index('by_site_ts', ['siteId', 'ts'])
    .index('by_site_path_ts', ['siteId', 'path', 'ts'])
    .index('by_site_visitor_ts', ['siteId', 'visitorHash', 'ts'])
    .index('by_site_referrer', ['siteId', 'referrer'])
    .index('by_ts', ['ts']),

  heatmapPoints: defineTable({
    siteId: v.id('sites'),
    path: v.string(),
    kind: v.union(v.literal('click'), v.literal('move'), v.literal('scroll')),
    xRatio: v.number(),
    yRatio: v.number(),
    ts: v.number(),
    visitorHash: v.string(),
  })
    .index('by_site_path_kind', ['siteId', 'path', 'kind'])
    .index('by_ts', ['ts']),

  rollupsHourly: defineTable({
    siteId: v.id('sites'),
    hour: v.number(),
    pageviews: v.number(),
    visitors: v.number(),
    bouncePct: v.number(),
    avgDurationMs: v.number(),
  }).index('by_site_hour', ['siteId', 'hour']),

  dailySalts: defineTable({
    day: v.number(),
    salt: v.string(),
  }).index('by_day', ['day']),

  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    createdAt: v.number(),
  }).index('by_email', ['email']),
})
