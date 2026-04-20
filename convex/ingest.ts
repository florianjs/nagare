import { internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'

export const insertEvent = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('events', args)
    return null
  },
})

export const insertHeatmapPoint = internalMutation({
  args: {
    siteId: v.id('sites'),
    path: v.string(),
    kind: v.union(v.literal('click'), v.literal('move'), v.literal('scroll')),
    xRatio: v.number(),
    yRatio: v.number(),
    ts: v.number(),
    visitorHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('heatmapPoints', args)
    return null
  },
})

export const getDailySalt = internalQuery({
  args: { day: v.number() },
  handler: async (ctx, args): Promise<Doc<'dailySalts'> | null> => {
    return await ctx.db
      .query('dailySalts')
      .withIndex('by_day', q => q.eq('day', args.day))
      .unique()
  },
})

export const setDailySalt = internalMutation({
  args: { day: v.number(), salt: v.string() },
  handler: async (ctx, args): Promise<Id<'dailySalts'>> => {
    const existing = await ctx.db
      .query('dailySalts')
      .withIndex('by_day', q => q.eq('day', args.day))
      .unique()
    if (existing) return existing._id
    return await ctx.db.insert('dailySalts', args)
  },
})
