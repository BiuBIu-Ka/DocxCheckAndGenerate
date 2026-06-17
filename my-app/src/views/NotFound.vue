<template>
  <div class="not-found">
    <div class="code">404</div>
    <h2>页面不存在</h2>
    <p>当前地址没有对应页面，你可以回到生成中台继续工作。</p>
    <el-button type="primary" @click="router.push('/generation')">返回生成中台</el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
.not-found {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}

.code {
  font-size: 72px;
  font-weight: 800;
  color: var(--accent-primary);
}

h2 {
  margin: 0;
  color: var(--text-primary);
}

p {
  max-width: 420px;
  margin: 0 0 10px;
  color: var(--text-secondary);
}
</style>
