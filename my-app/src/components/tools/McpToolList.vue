<template>
  <div class="tool-list">
    <el-empty v-if="tools.length === 0" description="当前未加载工具" />
    <el-table v-else :data="tools" border size="small">
      <el-table-column prop="name" label="工具名称" width="180" />
      <el-table-column prop="description" label="描述" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tools: Array<{ name: string; description?: string }>
}>()
</script>

<style scoped>
.tool-list {
  margin-top: 10px;
}
</style>
