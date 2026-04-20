<script setup lang="ts">
const props = defineProps<{ rows: { label: string; value: number }[] }>()
const max = Math.max(...props.rows.map(r => r.value))
</script>

<template>
  <ul class="space-y-1">
    <li v-for="r in rows" :key="r.label" class="relative group">
      <div
        class="absolute inset-y-1 left-0 bg-mute-6 group-hover:bg-mute-5 transition-colors"
        :style="{ width: (r.value / max * 100) + '%' }"
      />
      <div class="relative flex items-center justify-between px-3 py-2 font-mono text-sm">
        <span class="truncate pr-4">{{ r.label }}</span>
        <span class="tabular text-mute-1">{{ r.value.toLocaleString() }}</span>
      </div>
    </li>
  </ul>
</template>
