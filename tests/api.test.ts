import { describe, it, expect } from 'vitest'
import { readdirSync, statSync } from 'node:fs'
import { resolve, relative } from 'node:path'

function listFiles(dir: string, base = dir): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []
  for (const e of entries) {
    const full = resolve(dir, e)
    if (statSync(full).isDirectory()) {
      files.push(...listFiles(full, base))
    } else if (e.endsWith('.ts')) {
      files.push(relative(base, full))
    }
  }
  return files
}

describe('API route structure', () => {
  const apiDir = resolve(__dirname, '../server/api')
  const files = listFiles(apiDir)

  it('auth routes exist', () => {
    expect(files).toContain('auth/login.post.ts')
    expect(files).toContain('auth/logout.post.ts')
  })

  it('setup routes exist', () => {
    expect(files).toContain('setup/status.get.ts')
    expect(files).toContain('setup/create.post.ts')
  })

  it('sites CRUD routes exist', () => {
    expect(files).toContain('u/sites/index.get.ts')
    expect(files).toContain('u/sites/index.post.ts')
    expect(files.some(f => f.includes('index.delete.ts'))).toBe(true)
  })

  it('dashboard data routes exist', () => {
    for (const route of ['overview', 'pages', 'referrers', 'countries', 'devices', 'events', 'heatmap']) {
      expect(files.some(f => f.includes(route)), `Missing route: ${route}`).toBe(true)
    }
  })

  it('all route files follow Nitro naming convention (.get/.post/.delete)', () => {
    for (const f of files) {
      expect(f).toMatch(/\.(get|post|delete|put|patch)\.ts$/)
    }
  })
})
