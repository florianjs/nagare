import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('tracker script (t.js)', () => {
  const src = readFileSync(resolve(__dirname, '../public/t.js'), 'utf-8')

  it('is under 4KB', () => {
    expect(src.length).toBeLessThan(4096)
  })

  it('reads data-site-id attribute', () => {
    expect(src).toContain('data-site-id')
  })

  it('reads data-endpoint attribute', () => {
    expect(src).toContain('data-endpoint')
  })

  it('supports Do Not Track opt-out (data-ignore-dnt)', () => {
    expect(src).toContain('doNotTrack')
    expect(src).toContain('data-ignore-dnt')
  })

  it('supports Global Privacy Control opt-out', () => {
    expect(src).toContain('globalPrivacyControl')
  })

  it('hooks pushState for SPA routing', () => {
    expect(src).toContain('pushState')
    expect(src).toContain('popstate')
  })

  it('exposes window.nagare.event API', () => {
    expect(src).toContain('window.nagare')
  })

  it('supports sendBeacon fallback', () => {
    expect(src).toContain('sendBeacon')
  })

  it('has no external dependencies', () => {
    expect(src).not.toContain('import ')
    expect(src).not.toContain('require(')
  })

  it('supports heatmap click tracking', () => {
    expect(src).toContain('hk')
    expect(src).toContain('click')
  })

  it('supports optional move tracking via data-track-moves', () => {
    expect(src).toContain('data-track-moves')
  })

  it('supports optional scroll tracking via data-track-scroll', () => {
    expect(src).toContain('data-track-scroll')
  })
})
