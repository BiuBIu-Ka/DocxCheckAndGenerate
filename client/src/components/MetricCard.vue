<script setup lang="ts">
defineProps<{
  title: string
  value: string
  description: string
  accent?: string
}>()
</script>

<template>
  <div class="metric-card" :style="accent ? ({ '--accent': accent } as Record<string, string>) : undefined">
    <div class="text-sm text-slate-400">{{ title }}</div>
    <div class="mt-3 text-3xl font-semibold text-white">{{ value }}</div>
    <div class="mt-3 text-sm leading-6 text-slate-300">{{ description }}</div>
  </div>
</template>
