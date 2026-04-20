import { mutation, query, internalQuery } from './_generated/server'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import type { QueryCtx, MutationCtx } from './_generated/server'

function genKey(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

async function requireEmail(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity()
  const email = identity && typeof identity.email === 'string' ? identity.email.toLowerCase() : null
  if (!email) throw new Error('Unauthenticated')
  return email
}

export const list = query({
  args: {},
  handler: async (ctx): Promise<Doc<'sites'>[]> => {
    const email = await requireEmail(ctx)
    return await ctx.db
      .query('sites')
      .withIndex('by_owner', q => q.eq('ownerEmail', email))
      .order('desc')
      .take(100)
  },
})

export const get = query({
  args: { siteId: v.id('sites') },
  handler: async (ctx, args): Promise<Doc<'sites'> | null> => {
    const email = await requireEmail(ctx)
    const site = await ctx.db.get(args.siteId)
    if (!site || site.ownerEmail !== email) return null
    return site
  },
})

export const create = mutation({
  args: {
    domain: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const email = await requireEmail(ctx)
    const scriptKey = genKey()
    return await ctx.db.insert('sites', {
      ownerEmail: email,
      domain: args.domain,
      name: args.name,
      scriptKey,
    })
  },
})

export const rotateKey = mutation({
  args: { siteId: v.id('sites') },
  handler: async (ctx, args) => {
    const email = await requireEmail(ctx)
    const site = await ctx.db.get(args.siteId)
    if (!site || site.ownerEmail !== email) throw new Error('Not authorized')
    const scriptKey = genKey()
    await ctx.db.patch(args.siteId, { scriptKey })
    return scriptKey
  },
})

export const remove = mutation({
  args: { siteId: v.id('sites') },
  handler: async (ctx, args) => {
    const email = await requireEmail(ctx)
    const site = await ctx.db.get(args.siteId)
    if (!site || site.ownerEmail !== email) throw new Error('Not authorized')
    await ctx.db.delete(args.siteId)
    return null
  },
})

export const bySiteKey = internalQuery({
  args: { scriptKey: v.string() },
  handler: async (ctx, args): Promise<Doc<'sites'> | null> => {
    return await ctx.db
      .query('sites')
      .withIndex('by_script_key', q => q.eq('scriptKey', args.scriptKey))
      .unique()
  },
})
