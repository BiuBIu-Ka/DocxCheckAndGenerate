<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useDesktopBridge } from '@/composables/useDesktopBridge'
import { buildManualDraft } from '@/services/api'
import type { ScreenshotResult } from '@/types/platform'

const bridge = useDesktopBridge()
const loading = ref(false)
const screenshots = ref<ScreenshotResult[]>([])
const draft = ref<string[]>([])
const formState = reactive({
  targetAudience: '装备操作员',
  targetModule: '任务规划与告警中心',
})

const canCapture = computed(() => bridge.available)

async function handleCapture() {
  if (!bridge.captureScreen) {
    message.warning('当前运行环境不是 Electron 桌面端，无法直接调用截图。')
    return
  }

  try {
    const result = await bridge.captureScreen(`manual-${screenshots.value.length + 1}`)
    if (result) {
      screenshots.value.unshift(result)
      message.success('截图已采集。')
    }
  } catch (error) {
    console.error(error)
    message.error('截图失败，请确认桌面权限和 Electron 主进程状态。')
  }
}

async function handleBuildDraft() {
  if (!screenshots.value.length) {
    message.warning('请先采集或导入截图。')
    return
  }

  loading.value = true
  try {
    const result = await buildManualDraft({
      screenshots: screenshots.value.map((item) => item.filePath),
      targetAudience: formState.targetAudience,
      targetModule: formState.targetModule,
    })
    draft.value = result.paragraphs
    message.success('手册说明草稿已生成。')
  } catch (error) {
    console.error(error)
    message.error('草稿生成失败，请检查后端服务。')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-6 2xl:grid-cols-[420px_1fr]">
    <a-card class="platform-card" title="截图任务">
      <div class="space-y-4">
        <a-alert
          :type="canCapture ? 'success' : 'warning'"
          show-icon
          :message="canCapture ? '已检测到桌面桥接，可直接调用 Electron 截图。' : '当前只支持浏览器预览，截图能力需在 Electron 客户端中使用。'"
        />
        <a-form layout="vertical">
          <a-form-item label="使用对象">
            <a-input v-model:value="formState.targetAudience" />
          </a-form-item>
          <a-form-item label="目标模块">
            <a-input v-model:value="formState.targetModule" />
          </a-form-item>
        </a-form>
        <div class="flex gap-3">
          <a-button type="primary" @click="handleCapture">采集截图</a-button>
          <a-button :disabled="!screenshots.length" :loading="loading" @click="handleBuildDraft">生成说明草稿</a-button>
        </div>
      </div>
    </a-card>

    <div class="space-y-6">
      <a-card class="platform-card" title="截图序列">
        <a-empty v-if="!screenshots.length" description="完成截图后，将在此显示截图元数据。" />
        <div v-else class="space-y-4">
          <div v-for="shot in screenshots" :key="shot.filePath" class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div class="text-sm text-slate-200">{{ shot.filePath }}</div>
            <div class="mt-2 text-xs text-slate-500">{{ shot.width }} × {{ shot.height }} · {{ shot.capturedAt }}</div>
          </div>
        </div>
      </a-card>

      <a-card class="platform-card" title="手册段落建议">
        <a-empty v-if="!draft.length" description="截图完成后，可基于后端手册生成器生成步骤说明。" />
        <a-timeline v-else>
          <a-timeline-item v-for="paragraph in draft" :key="paragraph" color="cyan">{{ paragraph }}</a-timeline-item>
        </a-timeline>
      </a-card>
    </div>
  </div>
</template>
