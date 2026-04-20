<script setup lang="ts">
const days = Array.from({ length: 30 }, (_, i) => {
  const base = 1400 + Math.sin(i * 0.4) * 400 + Math.cos(i * 0.9) * 180
  return Math.round(base + (Math.random() * 200 - 100) + i * 22)
})

const max = Math.max(...days)
const min = Math.min(...days)
const w = 1200
const h = 260

const points = days.map((v, i) => {
  const x = (i / (days.length - 1)) * w
  const y = h - ((v - min) / (max - min)) * (h - 20) - 10
  return { x, y, v }
})

const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
const area = `${line} L${w},${h} L0,${h} Z`
</script>

<template>
  <svg :viewBox="`0 0 ${w} ${h}`" class="w-full h-[260px] text-ink" preserveAspectRatio="none">
    <defs>
      <linearGradient id="dash-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="currentColor" stop-opacity="0.1" />
        <stop offset="1" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- gridlines -->
    <g stroke="currentColor" stroke-opacity="0.08">
      <line v-for="i in 5" :key="i" x1="0" :y1="(i - 1) * (h / 4)" :x2="w" :y2="(i - 1) * (h / 4)" />
    </g>

    <!-- area + line -->
    <path :d="area" fill="url(#dash-fade)" />
    <path class="draw" :d="line" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />

    <!-- end marker -->
    <circle v-if="points.length" :cx="points[points.length - 1]!.x" :cy="points[points.length - 1]!.y" r="4" fill="currentColor" />
    <circle v-if="points.length" :cx="points[points.length - 1]!.x" :cy="points[points.length - 1]!.y" r="10" fill="none" stroke="currentColor" stroke-opacity="0.2" />
  </svg>
</template>
