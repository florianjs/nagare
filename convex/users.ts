import { action, query, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'

async function hashPassword(password: string, saltHex?: string): Promise<string> {
  const salt = saltHex
    ? new Uint8Array(saltHex.match(/../g)!.map(h => parseInt(h, 16)))
    : crypto.getRandomValues(new Uint8Array(16))
  const keyMat = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMat,
    256,
  )
  const saltOut = Array.from(salt, b => b.toString(16).padStart(2, '0')).join('')
  const hashOut = Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2$100000$${saltOut}$${hashOut}`
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export const setupStatus = query({
  args: {},
  handler: async (ctx): Promise<{ complete: boolean }> => {
    const users = await ctx.db.query('users').take(1)
    return { complete: users.length > 0 }
  },
})

export const _getByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<Doc<'users'> | null> => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', args.email.toLowerCase()))
      .unique()
  },
})

export const _anyUserExists = internalQuery({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    const users = await ctx.db.query('users').take(1)
    return users.length > 0
  },
})

export const _insertFirstUser = internalMutation({
  args: { email: v.string(), passwordHash: v.string() },
  handler: async (ctx, args): Promise<Id<'users'>> => {
    const existing = await ctx.db.query('users').take(1)
    if (existing.length > 0) {
      throw new Error('Setup already complete')
    }
    return await ctx.db.insert('users', {
      email: args.email.toLowerCase(),
      passwordHash: args.passwordHash,
      createdAt: Date.now(),
    })
  },
})

export const createFirstUser = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<{ ok: true; email: string }> => {
    if (!args.email.includes('@')) throw new Error('Invalid email')
    if (args.password.length < 12) throw new Error('Password must be at least 12 characters')

    const exists: boolean = await ctx.runQuery(internal.users._anyUserExists, {})
    if (exists) throw new Error('Setup already complete')

    const passwordHash = await hashPassword(args.password)
    await ctx.runMutation(internal.users._insertFirstUser, {
      email: args.email,
      passwordHash,
    })
    return { ok: true, email: args.email.toLowerCase() }
  },
})

export const verifyLogin = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean; email?: string }> => {
    const user: Doc<'users'> | null = await ctx.runQuery(internal.users._getByEmail, {
      email: args.email,
    })
    if (!user) return { ok: false }

    const parts = user.passwordHash.split('$')
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return { ok: false }
    const saltHex = parts[2]!
    const candidate = await hashPassword(args.password, saltHex)
    if (!timingSafeEqual(candidate, user.passwordHash)) return { ok: false }

    return { ok: true, email: user.email }
  },
})
