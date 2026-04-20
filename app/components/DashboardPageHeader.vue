<script setup lang="ts">
defineProps<{
  section: string;
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <div
    class="flex items-end justify-between pb-8 mb-8 border-b border-ink gap-6 flex-wrap"
  >
    <div>
      <div class="label text-mute-1 mb-3">§ {{ section }} - acme.com</div>
      <h1 class="font-display text-5xl md:text-6xl italic leading-none">
        {{ title }}
      </h1>
      <div v-if="subtitle" class="mt-3 font-mono text-sm text-mute-1">
        {{ subtitle }}
      </div>
    </div>
    <slot />
  </div>
</template>
