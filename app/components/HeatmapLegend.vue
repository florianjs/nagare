<script setup lang="ts">
const { t } = useI18n()
defineProps<{ lowLabel?: string; highLabel?: string }>()
</script>

<template>
  <div class="flex items-center gap-3">
    <span class="label text-mute-1 tabular">{{ lowLabel ?? t('dash.heatmap.legendLow') }}</span>
    <div
      class="h-2 w-48 border border-ink"
      style="background: linear-gradient(to right, rgb(37,99,235), rgb(34,211,238), rgb(132,204,22), rgb(245,158,11), rgb(239,68,68));"
    />
    <span class="label text-mute-1 tabular">{{ highLabel ?? t('dash.heatmap.legendHigh') }}</span>
  </div>
</template>
