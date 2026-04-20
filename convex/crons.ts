import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'
import { internalMutation } from './_generated/server'

const crons = cronJobs()

// CNIL analytics recommendation: raw events retained <= 13 months, even
// pseudonymous. Beyond that we keep only aggregates (rollupsHourly).
const RETENTION_MS = 13 * 30 * 86_400_000
const BATCH = 500

export const rotateOldSalts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Math.floor(Date.now() / 86_400_000) - 30
    const old = await ctx.db
      .query('dailySalts')
      .withIndex('by_day', q => q.lt('day', cutoff))
      .take(100)
    for (const s of old) await ctx.db.delete(s._id)
    return null
  },
})

export const pruneOldEvents = internalMutation({
  args: {},
  handler: async (ctx): Promise<number> => {
    const cutoff = Date.now() - RETENTION_MS
    const batch = await ctx.db
      .query('events')
      .withIndex('by_ts', q => q.lt('ts', cutoff))
      .take(BATCH)
    for (const e of batch) await ctx.db.delete(e._id)
    if (batch.length === BATCH) {
      await ctx.scheduler.runAfter(0, internal.crons.pruneOldEvents, {})
    }
    return batch.length
  },
})

export const pruneOldHeatmapPoints = internalMutation({
  args: {},
  handler: async (ctx): Promise<number> => {
    const cutoff = Date.now() - RETENTION_MS
    const batch = await ctx.db
      .query('heatmapPoints')
      .withIndex('by_ts', q => q.lt('ts', cutoff))
      .take(BATCH)
    for (const p of batch) await ctx.db.delete(p._id)
    if (batch.length === BATCH) {
      await ctx.scheduler.runAfter(0, internal.crons.pruneOldHeatmapPoints, {})
    }
    return batch.length
  },
})

crons.interval(
  'prune old daily salts',
  { hours: 6 },
  internal.crons.rotateOldSalts,
  {},
)

crons.daily(
  'prune events >13 months',
  { hourUTC: 3, minuteUTC: 0 },
  internal.crons.pruneOldEvents,
  {},
)

crons.daily(
  'prune heatmap points >13 months',
  { hourUTC: 3, minuteUTC: 15 },
  internal.crons.pruneOldHeatmapPoints,
  {},
)

export default crons
