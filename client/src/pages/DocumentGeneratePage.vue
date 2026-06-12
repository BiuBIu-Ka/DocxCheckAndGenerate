
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { UploadOutlined, RocketOutlined, FileWordOutlined } from '@ant-design/icons-vue'
import axios from 'axios'

const loading = ref(false)
const templateFile = ref<File | null>(null)
const parsedStructure = ref<Array<{ title: string }>>([])
const generatedContent = ref<Record<string, string>>({})

const formState = reactive({
  projectName: '',
  docType: 'SRS',
  prompt: ''
})

async function handleUpload(info: any) {
  const formData = new FormData()
  formData.append('file', info.file)
  
  try {
    const { data } = await axios.post('/api/documents/parse-template', formData)
    parsedStructure.value = data.structure
    message.success('模板解析成功')
  } catch (e) {
    message.error('模板解析失败')
  }
}

function handleTemplateChange(info: any) {
  templateFile.value = info.file as File
}

async function handleGenerate() {
  if (!parsedStructure.value.length) {
    message.warning('请先上传文档模板')
    return
  }
  
  loading.value = true
  try {
    const { data } = await axios.post('/api/documents/generate', {
      ...formState,
      structure: parsedStructure.value
    })
    generatedContent.value = data.sections
    message.success('文档生成完成')
  } catch (e) {
    message.error('生成失败，请检查模型配置和网络')
  } finally {
    loading.value = false
  }
}

async function handleDownload() {
  // Mock download for now, in real production we would call a backend route to generate a .docx
  message.info('正在导出为 Word 文档...')
}
</script>

<template>
  <div class="space-y-6">
    <div class="hero-section">
      <div class="hero-title">智能文档编制</div>
      <div class="hero-desc">上传 GJB 438B 模板，AI 将基于规范要求自动填充结构化内容。</div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 space-y-6">
        <a-card title="1. 准备模板" class="shadow-sm">
          <a-upload-dragger
            name="file"
            :multiple="false"
            :customRequest="handleUpload"
            @change="handleTemplateChange"
          >
            <p class="ant-upload-drag-icon"><UploadOutlined /></p>
            <p class="ant-upload-text">点击或拖拽 Word 模板上传</p>
            <p class="ant-upload-hint">支持 .docx 格式，系统将自动分析章节结构</p>
          </a-upload-dragger>
          
          <div v-if="parsedStructure.length" class="mt-4 p-4 bg-blue-50 rounded border border-blue-100">
            <div class="text-sm font-bold text-blue-800 mb-2">已识别章节:</div>
            <div class="max-h-40 overflow-y-auto space-y-1">
              <div v-for="s in parsedStructure" :key="s.title" class="text-xs text-blue-600 flex items-center gap-1">
                 <FileWordOutlined /> {{ s.title }}
              </div>
            </div>
          </div>
        </a-card>

        <a-card title="2. 编制参数" class="shadow-sm">
          <a-form layout="vertical">
            <a-form-item label="项目名称">
              <a-input v-model:value="formState.projectName" placeholder="请输入受控项目全称" />
            </a-form-item>
            <a-form-item label="文档类型">
              <a-select v-model:value="formState.docType">
                <a-select-option value="SRS">软件需求规格说明 (SRS)</a-select-option>
                <a-select-option value="SDD">软件设计说明 (SDD)</a-select-option>
                <a-select-option value="STP">软件测试计划 (STP)</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="补充说明">
              <a-textarea v-model:value="formState.prompt" :rows="4" placeholder="补充特定的业务逻辑或约束条件..." />
            </a-form-item>
            <a-button type="primary" block size="large" :loading="loading" @click="handleGenerate">
              <template #icon><RocketOutlined /></template>
              开始 AI 编制
            </a-button>
          </a-form>
        </a-card>
      </div>

      <div class="lg:col-span-2">
        <a-card class="shadow-sm min-h-[600px]">
          <template #title>
            <div class="flex justify-between items-center w-full">
              <span>编制预览</span>
              <a-button v-if="Object.keys(generatedContent).length" type="link" @click="handleDownload">导出 Word</a-button>
            </div>
          </template>
          
          <div v-if="Object.keys(generatedContent).length" class="space-y-8">
            <div v-for="(body, title) in generatedContent" :key="title">
              <h3 class="text-lg font-bold border-l-4 border-blue-500 pl-3 mb-3">{{ title }}</h3>
              <div class="bg-gray-50 p-6 rounded-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                {{ body }}
              </div>
            </div>
          </div>
          
          <a-empty v-else description="完成左侧步骤后，生成的文档内容将在此实时展示" class="mt-40" />
        </a-card>
      </div>
    </div>
  </div>
</template>
