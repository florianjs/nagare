<script setup lang="ts">
const { range, setRange } = useActiveSite()
</script>

<template>
  <div class="flex border border-ink">
    <button
      v-for="r in RANGES"
      :key="r"
      class="px-3 py-1.5 font-mono text-xs transition-colors"
      :class="range === r ? 'bg-ink text-paper' : 'hover:bg-mute-6'"
      @click="setRange(r)"
    >
      {{ r }}
    </button>
  </div>
</template>
