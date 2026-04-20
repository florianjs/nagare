<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const others = computed(() =>
  (locales.value as Array<{ code: string; name: string }>).filter(l => l.code !== locale.value),
)

async function pick(code: string) {
  await setLocale(code as 'en' | 'fr')
}
</script>

<template>
  <div class="flex items-center gap-1 label text-mute-1">
    <span
      class="px-2 py-1 border border-ink bg-ink text-paper font-mono text-[10px]"
    >{{ locale.toUpperCase() }}</span>
    <button
      v-for="l in others"
      :key="l.code"
      class="px-2 py-1 border border-ink hover:bg-ink hover:text-paper transition-colors font-mono text-[10px]"
      @click="pick(l.code)"
    >
      {{ l.code.toUpperCase() }}
    </button>
  </div>
</template>
