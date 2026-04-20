<script setup lang="ts">
const { t } = useI18n()
defineProps<{ message?: string }>()
</script>

<template>
  <div class="border border-ink bg-paper p-20 flex flex-col items-center text-center">
    <div class="font-display text-5xl italic mb-4">{{ t('dash.common.noData') }}</div>
    <p class="text-mute-1 max-w-[44ch] leading-relaxed mb-6">
      {{ message ?? t('dash.common.emptyDefault') }}
    </p>
    <slot />
  </div>
</template>
