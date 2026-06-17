<template>
  <div class="tool-preview-card">
    <div class="tool-name">{{ title }}</div>
    <div class="tool-summary">{{ summary }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  summary: string
}>()
</script>

<style scoped>
.tool-preview-card {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.03);
}

.tool-name {
  color: var(--text-primary);
  font-weight: 600;
}

.tool-summary {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
