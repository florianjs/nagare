<script setup lang="ts">
type Dot = { x: number; y: number; weight: number }
type ScrollBand = { y: number; reached: number }
type Mode = 'clicks' | 'scroll' | 'move'

const props = withDefaults(
  defineProps<{
    src: string
    mode?: Mode
    clickDots?: Dot[]
    moveDots?: Dot[]
    scrollBands?: ScrollBand[]
    label?: string
  }>(),
  {
    mode: 'clicks',
    clickDots: () => [],
    moveDots: () => [],
    scrollBands: () => [],
    label: '/',
  },
)

const { t } = useI18n()

const iframeLoaded = ref(false)
const wrap = ref<HTMLElement | null>(null)
const heatCanvas = ref<HTMLCanvasElement | null>(null)

const IFRAME_W = 1440
const IFRAME_VIEWPORT_H = 900 // normal desktop viewport height
const pageH = ref(IFRAME_VIEWPORT_H) // real page height from postMessage
const iframeScrollY = ref(0)
const scale = ref(1)

function recomputeScale() {
  if (!wrap.value) return
  scale.value = Math.min(1, wrap.value.clientWidth / IFRAME_W)
}

// The visible viewport height in scaled pixels
const viewW = computed(() => Math.round(IFRAME_W * scale.value))

// Full page height in scaled pixels (for canvas)
const fullScaledH = computed(() => Math.round(pageH.value * scale.value))

function onMessage(e: MessageEvent) {
  if (e.data?.type === 'nagare:height' && typeof e.data.height === 'number') {
    pageH.value = Math.max(e.data.height, IFRAME_VIEWPORT_H)
    nextTick(() => renderHeatmap())
  }
  if (e.data?.type === 'nagare:scroll' && typeof e.data.y === 'number') {
    iframeScrollY.value = e.data.y
  }
}

onMounted(() => {
  recomputeScale()
  window.addEventListener('resize', recomputeScale)
  window.addEventListener('message', onMessage)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', recomputeScale)
  window.removeEventListener('message', onMessage)
})

// Canvas translateY: shift canvas so visible portion aligns with iframe scroll
const canvasTranslateY = computed(() => -Math.round(iframeScrollY.value * scale.value))

// ---- Canvas-based heatmap rendering ----
function renderHeatmap() {
  const canvas = heatCanvas.value
  if (!canvas) return

  const w = viewW.value
  const h = fullScaledH.value
  if (!w || !h) return

  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)

  if (props.mode === 'scroll') return

  const dots = props.mode === 'clicks' ? props.clickDots : props.moveDots
  if (!dots.length) return

  const radius = props.mode === 'clicks'
    ? Math.max(20, Math.round(w * 0.04))
    : Math.max(12, Math.round(w * 0.025))

  dots.forEach(d => {
    const x = (d.x / 100) * w
    const y = (d.y / 100) * h
    const intensity = Math.max(0.1, Math.min(1, d.weight))

    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
    grad.addColorStop(0, `rgba(0,0,0,${intensity})`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  })

  const imageData = ctx.getImageData(0, 0, w, h)
  const pixels = imageData.data

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3]! / 255
    if (alpha < 0.01) {
      pixels[i + 3] = 0
      continue
    }
    const [r, g, b] = heatRGB(alpha)
    pixels[i] = r
    pixels[i + 1] = g
    pixels[i + 2] = b
    const opacity = props.mode === 'clicks'
      ? Math.min(255, Math.round(alpha * 200))
      : Math.min(255, Math.round(alpha * 140))
    pixels[i + 3] = opacity
  }

  ctx.putImageData(imageData, 0, 0)
}

function heatRGB(t: number): [number, number, number] {
  const stops: [number, number, number, number][] = [
    [0.0, 67, 56, 202],
    [0.2, 6, 182, 212],
    [0.4, 34, 197, 94],
    [0.6, 234, 179, 8],
    [0.8, 249, 115, 22],
    [1.0, 239, 68, 68],
  ]
  const clamped = Math.max(0, Math.min(1, t))
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]!
    const b = stops[i + 1]!
    if (clamped >= a[0] && clamped <= b[0]) {
      const f = (clamped - a[0]) / (b[0] - a[0])
      return [
        Math.round(a[1] + (b[1] - a[1]) * f),
        Math.round(a[2] + (b[2] - a[2]) * f),
        Math.round(a[3] + (b[3] - a[3]) * f),
      ]
    }
  }
  return [239, 68, 68]
}

function heatColorCSS(w: number) {
  const [r, g, b] = heatRGB(w)
  return `${r},${g},${b}`
}

watch(
  () => [props.clickDots, props.moveDots, props.mode, iframeLoaded.value, scale.value, pageH.value],
  () => nextTick(() => renderHeatmap()),
  { deep: true },
)

onMounted(() => {
  watch(iframeLoaded, (loaded) => {
    if (loaded) setTimeout(() => renderHeatmap(), 200)
  })
})

const activeDots = computed(() => props.mode === 'clicks' ? props.clickDots : props.moveDots)
</script>

<template>
  <div ref="wrap" class="relative w-full h-full bg-parchment overflow-hidden">
    <!-- Iframe: viewport-sized, user scrolls INSIDE it naturally -->
    <div
      class="absolute top-0 left-0 origin-top-left"
      style="z-index: 1"
      :style="{
        width: IFRAME_W + 'px',
        height: IFRAME_VIEWPORT_H + 'px',
        transform: `scale(${scale})`,
      }"
    >
      <iframe
        :src="src"
        class="w-full h-full border-0 block bg-paper"
        loading="lazy"
        @load="iframeLoaded = true"
      />
    </div>

    <!-- Heatmap canvas: full page height, translates with scroll -->
    <canvas
      v-if="mode !== 'scroll'"
      ref="heatCanvas"
      class="absolute top-0 left-0 pointer-events-none"
      style="z-index: 2"
      :width="viewW"
      :height="fullScaledH"
      :style="{
        width: viewW + 'px',
        height: fullScaledH + 'px',
        transform: `translateY(${canvasTranslateY}px)`,
      }"
    />

    <!-- Scroll bands -->
    <div
      v-if="mode === 'scroll'"
      class="absolute top-0 left-0 pointer-events-none"
      style="z-index: 2"
      :style="{
        width: viewW + 'px',
        height: fullScaledH + 'px',
        transform: `translateY(${canvasTranslateY}px)`,
      }"
    >
      <div
        v-for="(b, i) in scrollBands"
        :key="'s' + i"
        class="absolute left-0 right-0"
        :style="{
          top: b.y + '%',
          height: '4%',
          background: `linear-gradient(to bottom, rgba(${heatColorCSS(b.reached)},0) 0%, rgba(${heatColorCSS(b.reached)},${0.3 + b.reached * 0.4}) 50%, rgba(${heatColorCSS(b.reached)},0) 100%)`,
        }"
      />
    </div>

    <!-- Scroll depth labels -->
    <div
      v-if="mode === 'scroll'"
      class="absolute top-0 left-0 pointer-events-none"
      style="z-index: 3"
      :style="{
        width: viewW + 'px',
        height: fullScaledH + 'px',
        transform: `translateY(${canvasTranslateY}px)`,
      }"
    >
      <div
        v-for="(b, i) in scrollBands"
        :key="'sl' + i"
        class="absolute right-3 -translate-y-1/2"
        :style="{ top: b.y + '%' }"
      >
        <span class="font-mono text-[10px] bg-ink text-paper px-1.5 py-0.5 tabular">
          {{ Math.round(b.reached * 100) }}%
        </span>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="!iframeLoaded"
      class="absolute inset-0 flex items-center justify-center bg-parchment"
      style="z-index: 20"
    >
      <span class="label text-mute-2 animate-pulse">{{ t('dash.heatmap.loadingFrame') }}</span>
    </div>

    <!-- Bottom strip -->
    <div
      class="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-paper/90 border-t border-ink backdrop-blur"
      style="z-index: 20"
    >
      <div class="flex items-center gap-2 font-mono text-xs">
        <span class="w-1.5 h-1.5 rounded-full bg-ink" />
        <span>{{ label }}</span>
      </div>
      <div class="label text-mute-2">
        <template v-if="mode === 'clicks'">
          {{ t('dash.heatmap.clicksAgg', { n: activeDots.length.toLocaleString() }) }}
        </template>
        <template v-else-if="mode === 'move'">
          {{ t('dash.heatmap.samples', { n: activeDots.length.toLocaleString() }) }}
        </template>
        <template v-else>
          {{ t('dash.heatmap.depthBands', { n: scrollBands.length }) }}
        </template>
      </div>
    </div>
  </div>
</template>
