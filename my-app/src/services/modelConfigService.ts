import type { ModelConfig } from '../types/app'
import { loadAppSettings, updateModelConfig } from './settingsService'

export async function getModelConfig(): Promise<ModelConfig> {
  const settings = await loadAppSettings()
  return {
    apiUrl: settings.apiUrl,
    apiKey: settings.apiKey,
    modelName: settings.modelName,
    temperature: settings.temperature,
    maxRounds: settings.maxRounds,
    debugEnabled: settings.debugEnabled,
  }
}

export async function saveModelConfig(partial: Partial<ModelConfig>) {
  return updateModelConfig(partial)
}

export async function testModelConfig(config?: Partial<ModelConfig>) {
  const current = await getModelConfig()
  const next = {
    ...current,
    ...config,
  }

  const hasRequiredFields = Boolean(next.apiUrl && next.apiKey && next.modelName)
  if (!hasRequiredFields) {
    throw new Error('请先完整填写 API URL、API Key 和模型名称')
  }

  return {
    ok: true,
    message: '配置格式通过基础校验，可用于发起生成',
  }
}
