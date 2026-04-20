#!/usr/bin/env node
// Generate an RSA keypair for signing Convex-bound JWTs.
// Usage: node scripts/generate-jwt-keys.mjs
// Paste the printed NUXT_JWT_PRIVATE_KEY line into .env.

import { generateKeyPair, exportPKCS8 } from 'jose'

const { privateKey } = await generateKeyPair('RS256', { modulusLength: 2048, extractable: true })
const pem = await exportPKCS8(privateKey)
const b64 = Buffer.from(pem, 'utf8').toString('base64')

console.log('# Add to .env (keep private):')
console.log(`NUXT_JWT_PRIVATE_KEY=${b64}`)
