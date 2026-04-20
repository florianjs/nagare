<script setup lang="ts">
type Mode = 'clicks' | 'scroll' | 'move'

const open = defineModel<boolean>({ default: false })

defineProps<{
  src: string
  label?: string
}>()

const { t } = useI18n()
const mode = ref<Mode>('clicks')

function close() { open.value = false }
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }

watch(open, (v) => {
  if (v) {
    window.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
  } else {
    window.removeEventListener('keydown', onKey)
    document.documentElement.style.overflow = ''
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.documentElement.style.overflow = ''
})

const modes = computed<{ id: Mode; label: string }[]>(() => [
  { id: 'clicks', label: t('dash.heatmap.modes.clicks') },
  { id: 'scroll', label: t('dash.heatmap.modes.scroll') },
  { id: 'move', label: t('dash.heatmap.modes.move') },
])
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[1000] bg-ink/60 backdrop-blur-sm flex items-stretch p-4 md:p-8"
        @click.self="close"
      >
        <div class="flex-1 bg-paper border border-ink flex flex-col max-h-full overflow-hidden">
          <header class="flex items-center justify-between px-6 py-4 border-b border-ink shrink-0 gap-4">
            <div>
              <div class="label text-mute-1">{{ t('dash.heatmap.title') }}</div>
              <div class="font-display text-2xl italic leading-none mt-1">acme.com {{ label }}</div>
            </div>
            <div class="flex items-center gap-4">
              <HeatmapLegend class="hidden lg:flex" />
              <div class="flex items-center border border-ink">
                <button
                  v-for="m in modes"
                  :key="m.id"
                  class="px-3 py-1.5 font-mono text-xs transition-colors"
                  :class="mode === m.id ? 'bg-ink text-paper' : 'hover:bg-mute-6'"
                  @click="mode = m.id"
                >
                  {{ m.label }}
                </button>
              </div>
              <button
                class="w-9 h-9 border border-ink flex items-center justify-center font-mono text-sm hover:bg-ink hover:text-paper transition-colors"
                aria-label="Close"
                @click="close"
              >
                ✕
              </button>
            </div>
          </header>
          <div class="flex-1 min-h-0 relative">
            <HeatmapViewer :src="src" :label="label" :mode="mode" />
          </div>
          <footer class="flex items-center justify-between px-6 py-3 border-t border-ink label text-mute-1 shrink-0">
            <span>{{ t('dash.heatmap.escClose') }}</span>
            <HeatmapLegend class="lg:hidden" />
            <span class="font-mono hidden md:inline">{{ t('dash.heatmap.lastUpdated') }}</span>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 180ms cubic-bezier(0.2, 0.8, 0.2, 1); }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
