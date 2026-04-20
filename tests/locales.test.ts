import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadJson(file: string) {
  return JSON.parse(readFileSync(resolve(__dirname, '../i18n/locales', file), 'utf-8'))
}

function flatKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flatKeys(v as Record<string, unknown>, path))
    } else {
      keys.push(path)
    }
  }
  return keys.sort()
}

describe('locale files', () => {
  const en = loadJson('en.json')
  const fr = loadJson('fr.json')
  const enKeys = flatKeys(en)
  const frKeys = flatKeys(fr)

  it('EN and FR have identical key structure', () => {
    const missingInFr = enKeys.filter(k => !frKeys.includes(k))
    const missingInEn = frKeys.filter(k => !enKeys.includes(k))
    expect(missingInFr, `Missing in FR: ${missingInFr.join(', ')}`).toEqual([])
    expect(missingInEn, `Missing in EN: ${missingInEn.join(', ')}`).toEqual([])
  })

  it('no empty string values in EN', () => {
    const empty = enKeys.filter(k => {
      const parts = k.split('.')
      let val: unknown = en
      for (const p of parts) val = (val as Record<string, unknown>)?.[p]
      return val === ''
    })
    expect(empty, `Empty EN keys: ${empty.join(', ')}`).toEqual([])
  })

  it('no empty string values in FR', () => {
    const empty = frKeys.filter(k => {
      const parts = k.split('.')
      let val: unknown = fr
      for (const p of parts) val = (val as Record<string, unknown>)?.[p]
      return val === ''
    })
    expect(empty, `Empty FR keys: ${empty.join(', ')}`).toEqual([])
  })

  it('no raw @ in values (vue-i18n linked message conflict)', () => {
    function checkAt(obj: Record<string, unknown>, path = ''): string[] {
      const issues: string[] = []
      for (const [k, v] of Object.entries(obj)) {
        const p = path ? `${path}.${k}` : k
        if (typeof v === 'string' && v.includes('@') && !v.includes("{'@'}")) {
          issues.push(p)
        } else if (v && typeof v === 'object' && !Array.isArray(v)) {
          issues.push(...checkAt(v as Record<string, unknown>, p))
        }
      }
      return issues
    }
    expect(checkAt(en), 'EN has unescaped @').toEqual([])
    expect(checkAt(fr), 'FR has unescaped @').toEqual([])
  })
})
