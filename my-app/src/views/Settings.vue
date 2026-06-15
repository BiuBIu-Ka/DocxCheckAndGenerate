<template>
  <div class="settings-container">
    <h2>模型配置</h2>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>AI API 设置</span>
        </div>
      </template>
      <el-form :model="form" label-width="120px">
        <el-form-item label="API URL">
          <el-input v-model="form.apiUrl" placeholder="例如：https://api.openai.com/v1" />
          <div class="tip">填写兼容 OpenAI 格式的 API 基础地址</div>
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="form.apiKey" type="password" show-password placeholder="输入您的 API Key" />
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input v-model="form.modelName" placeholder="例如：gpt-4o, deepseek-chat" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSettings" :loading="saving">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettings, saveSettings as saveAppSettings } from '../utils/bridge'

const form = ref({
  apiUrl: '',
  apiKey: '',
  modelName: ''
})
const saving = ref(false)

onMounted(async () => {
  try {
    const settings = await getSettings()
    if (settings) {
      form.value.apiUrl = settings.apiUrl || ''
      form.value.apiKey = settings.apiKey || ''
      form.value.modelName = settings.modelName || ''
    }
  } catch (error) {
    console.error('Failed to load settings', error)
  }
})

const saveSettings = async () => {
  saving.value = true
  try {
    await saveAppSettings({
      apiUrl: form.value.apiUrl,
      apiKey: form.value.apiKey,
      modelName: form.value.modelName
    })
    ElMessage.success('配置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
}
h2 {
  margin-bottom: 20px;
}
.tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.2;
}
</style>
