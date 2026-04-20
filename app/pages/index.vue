<script setup lang="ts">
definePageMeta({ layout: false })

const { loggedIn } = useUserSession()
await navigateTo(loggedIn.value ? '/u/dashboard' : '/login', { replace: true })
</script>

<template>
  <div />
</template>
