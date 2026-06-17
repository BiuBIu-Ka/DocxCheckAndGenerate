<template>
  <div class="page-shell">
    <div class="page-header">
      <div>
        <div class="page-eyebrow">Model</div>
        <h2>模型配置</h2>
        <p>在不覆盖模板、知识库和工具配置的前提下，独立维护模型参数与调试偏好。</p>
      </div>
    </div>

    <ModelSettingsForm
      :model="model"
      :saving="saving"
      :testing="testing"
      @update:model="model = $event"
      @save="saveSettings"
      @test="testConnection"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ModelSettingsForm from '../components/settings/ModelSettingsForm.vue'
import type { ModelConfig } from '../types/app'
import { getModelConfig, saveModelConfig, testModelConfig } from '../services/modelConfigService'
import { useAppConfigStore } from '../stores/appConfig'

const appConfig = useAppConfigStore()
const saving = ref(false)
const testing = ref(false)
const model = ref<ModelConfig>({
  apiUrl: '',
  apiKey: '',
  modelName: '',
  temperature: 0.7,
  maxRounds: 40,
  debugEnabled: true,
})

async function loadModel() {
  model.value = await getModelConfig()
}

async function saveSettings() {
  saving.value = true
  try {
    await saveModelConfig(model.value)
    await appConfig.load()
    ElMessage.success('模型配置已保存')
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message}`)
  } finally {
    saving.value = false
  }
}

async function testConnection() {
  testing.value = true
  try {
    const result = await testModelConfig(model.value)
    ElMessage.success(result.message)
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    testing.value = false
  }
}

onMounted(async () => {
  await loadModel()
})
</script>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-eyebrow,
.page-header p {
  color: var(--text-secondary);
  margin: 0;
}

.page-header h2 {
  margin: 6px 0;
  color: var(--text-primary);
}
</style>
