
<script setup lang="ts">
import { 
  QuestionCircleOutlined, 
  FileTextOutlined, 
  ThunderboltOutlined, 
  SafetyCertificateOutlined,
  DatabaseOutlined
} from '@ant-design/icons-vue'
</script>

<template>
  <div class="space-y-6 pb-12">
    <div class="hero-section">
      <div class="hero-title">系统使用指南</div>
      <div class="hero-desc">欢迎使用 GJB 438B 智能文档编制平台。本指南将帮助您快速熟悉系统的核心功能与操作流程。</div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 快速入门 -->
      <a-card title="1. 快速入门：模板与文档流程" :bordered="false" class="shadow-sm">
        <template #extra><ThunderboltOutlined class="text-yellow-500" /></template>
        <a-steps direction="vertical" size="small" :current="5">
          <a-step title="定义模板" description="在‘模板管理’中创建新模板，上传您的 Word 原始文件进行解析。" />
          <a-step title="维护模板" description="进入模板工作台，确认解析出的章节结构，并配置各章节的编制基准。" />
          <a-step title="使用模板生成" description="选择成熟模板，点击‘使用模板 -> 基于此模板生成文档’，AI 将根据模板基准自动编制。" />
          <a-step title="使用模板审查" description="上传待审文档，点击‘使用模板 -> 基于此模板审查文档’，系统将根据模板基线进行合规性对比。" />
          <a-step title="导出与交付" description="确认内容无误后，将结果导出为标准的 .docx 文件。" />
        </a-steps>
      </a-card>

      <!-- 核心功能 -->
      <a-card title="2. 核心功能说明" :bordered="false" class="shadow-sm">
        <template #extra><FileTextOutlined class="text-blue-500" /></template>
        <div class="space-y-4">
          <div class="flex gap-3">
            <div class="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <DatabaseOutlined />
            </div>
            <div>
              <div class="font-bold">模板库管理</div>
              <div class="text-sm text-gray-500">不再是死板的列表，您可以上传任何 GJB 438B Word 模板，系统会自动提取标题并允许您配置每个章节的编写规则。</div>
            </div>
          </div>
          <div class="flex gap-3">
            <div class="w-10 h-10 rounded bg-green-50 flex items-center justify-center text-green-500 shrink-0">
              <SafetyCertificateOutlined />
            </div>
            <div>
              <div class="font-bold">智能解析引擎</div>
              <div class="text-sm text-gray-500">系统能够识别 Word 文档中的‘标题’样式，将其转化为可操作的树状结构，并支持通过代码逻辑进行规则匹配。</div>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 常见问题 -->
    <a-card title="常见问题 (FAQ)" :bordered="false" class="shadow-sm">
      <a-collapse ghost expand-icon-position="right">
        <a-collapse-panel key="1" header="如何配置自己的 AI 模型？">
          <p class="text-gray-600">
            前往“模型设置”页面，您可以配置 OpenAI、DeepSeek 或本地 Ollama 接口。
            填入对应的 API Key 和 Endpoint，并点击“连通性测试”确保配置生效。
          </p>
        </a-collapse-panel>
        <a-collapse-panel key="2" header="系统如何保证文档的保密性？">
          <p class="text-gray-600">
            本平台支持全本地化部署。通过配置 Ollama 本地模型接口，所有文档处理逻辑均在内网运行，数据不外流，满足军工涉密环境基本要求。
          </p>
        </a-collapse-panel>
        <a-collapse-panel key="3" header="上传的 Word 模板有什么要求？">
          <p class="text-gray-600">
            建议使用带有标准“标题1”、“标题2”样式的 Word 文档。系统会自动解析这些样式作为章节结构。
            如果模板格式不规范，您也可以在工作台中手动调整章节树。
          </p>
        </a-collapse-panel>
      </a-collapse>
    </a-card>

    <!-- 联系支持 -->
    <div class="bg-blue-600 rounded-xl p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
      <div>
        <div class="text-2xl font-bold mb-2">需要更多帮助？</div>
        <div class="opacity-80">如果您在安装、配置或使用过程中遇到任何问题，请联系技术保障团队。</div>
      </div>
      <a-button ghost size="large" class="border-white text-white">
        查看详细技术文档
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.hero-section {
  @apply bg-white p-8 rounded-xl border border-gray-100 shadow-sm mb-6;
}
.hero-title {
  @apply text-3xl font-bold text-gray-900 mb-2;
}
.hero-desc {
  @apply text-gray-500 text-lg;
}
</style>
