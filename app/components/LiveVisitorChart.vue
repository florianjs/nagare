<script setup lang="ts">
import { Line } from 'vue-chartjs'
import type { ScriptableContext, TooltipItem } from 'chart.js'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip)

const props = defineProps<{
  data: { minute: number; visitors: number }[]
}>()

const labels = computed(() =>
  props.data.map((_, i) => {
    const minsAgo = 30 - i
    if (minsAgo === 30) return '-30m'
    if (minsAgo === 20) return '-20m'
    if (minsAgo === 10) return '-10m'
    if (minsAgo === 0) return 'now'
    return ''
  }),
)

const peak = computed(() => Math.max(...props.data.map(d => d.visitors)))
const total = computed(() => props.data.reduce((s, d) => s + d.visitors, 0))

const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      data: props.data.map(d => d.visitors),
      borderColor: '#0a0a0a',
      borderWidth: 1.5,
      backgroundColor: (ctx: ScriptableContext<'line'>) => {
        const chart = ctx.chart
        const { ctx: c, chartArea } = chart
        if (!chartArea) return 'rgba(10,10,10,0.06)'
        const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        grad.addColorStop(0, 'rgba(10,10,10,0.10)')
        grad.addColorStop(1, 'rgba(10,10,10,0)')
        return grad
      },
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      pointHitRadius: 12,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: '#0a0a0a',
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  scales: {
    x: {
      border: { display: false },
      grid: { display: false },
      ticks: {
        font: { family: "'JetBrains Mono', monospace", size: 10, weight: 'normal' as const },
        color: '#a3a3a3',
        maxRotation: 0,
        autoSkip: false,
        callback: function (_: string | number, index: number) {
          return labels.value[index] || ''
        },
      },
    },
    y: {
      border: { display: false },
      position: 'right' as const,
      beginAtZero: true,
      grid: {
        color: 'rgba(10,10,10,0.05)',
        drawTicks: false,
      },
      ticks: {
        font: { family: "'JetBrains Mono', monospace", size: 10, weight: 'normal' as const },
        color: '#a3a3a3',
        padding: 8,
        stepSize: peak.value <= 5 ? 1 : undefined,
        maxTicksLimit: 4,
      },
    },
  },
  plugins: {
    tooltip: {
      backgroundColor: '#0a0a0a',
      titleFont: { family: "'JetBrains Mono', monospace", size: 11, weight: 'bold' as const },
      bodyFont: { family: "'JetBrains Mono', monospace", size: 11, weight: 'normal' as const },
      titleColor: '#a3a3a3',
      bodyColor: '#ffffff',
      borderWidth: 0,
      cornerRadius: 0,
      padding: { top: 8, right: 12, bottom: 8, left: 12 },
      displayColors: false,
      callbacks: {
        title: (items: TooltipItem<'line'>[]) => {
          const idx = items[0]?.dataIndex ?? 0
          const minsAgo = 30 - idx
          return minsAgo === 0 ? 'now' : `-${minsAgo}m`
        },
        label: (item: TooltipItem<'line'>) => {
          const v = item.raw as number
          return `${v} visitor${v !== 1 ? 's' : ''}`
        },
      },
    },
    legend: { display: false },
  },
  animation: {
    duration: 600,
    easing: 'easeOutQuart' as const,
  },
}))
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between mb-3">
      <div class="flex items-baseline gap-4">
        <span class="font-mono tabular text-3xl">{{ peak }}</span>
        <span class="text-mute-2 text-xs label">peak</span>
      </div>
      <div class="flex items-baseline gap-4">
        <span class="text-mute-2 text-xs label">total</span>
        <span class="font-mono tabular text-sm text-mute-1">{{ total }}</span>
      </div>
    </div>
    <div class="h-[140px]">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
