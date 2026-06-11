
<script setup lang="ts">
import {
  FileProtectOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  SettingOutlined
} from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="space-y-8">
    <div class="hero-section">
      <div class="flex justify-between items-center">
        <div class="max-w-2xl">
          <div class="hero-title">GJB 智能文档作业平台</div>
          <div class="hero-desc">基于大模型与国军标规则引擎，实现军工软件研制文档的自动化编制、规范化审查与知识化沉淀。</div>
          <div class="mt-8 flex gap-4">
            <a-button type="primary" size="large" @click="router.push('/generate')">开始编制</a-button>
            <a-button size="large" @click="router.push('/review')">文档审查</a-button>
          </div>
        </div>
        <div class="hidden lg:block">
           <div class="w-64 h-64 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
              <FileProtectOutlined style="font-size: 120px; color: white; opacity: 0.8" />
           </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <a-card class="hover:border-blue-500 cursor-pointer transition-colors" @click="router.push('/generate')">
        <template #cover>
          <div class="h-2 w-full bg-blue-500"></div>
        </template>
        <div class="py-4">
          <ThunderboltOutlined class="text-3xl text-blue-500 mb-4" />
          <div class="font-bold text-lg mb-2">快速编制</div>
          <div class="text-gray-500 text-sm">上传 Word 模板，AI 自动根据 GJB 438B 要求生成章节草稿。</div>
        </div>
      </a-card>

      <a-card class="hover:border-green-500 cursor-pointer transition-colors" @click="router.push('/review')">
        <template #cover>
          <div class="h-2 w-full bg-green-500"></div>
        </template>
        <div class="py-4">
          <SafetyCertificateOutlined class="text-3xl text-green-500 mb-4" />
          <div class="font-bold text-lg mb-2">规范审查</div>
          <div class="text-gray-500 text-sm">自动校验章节完整性、术语合规性及图表规范，输出整改清单。</div>
        </div>
      </a-card>

      <a-card class="hover:border-purple-500 cursor-pointer transition-colors" @click="router.push('/knowledge')">
        <template #cover>
          <div class="h-2 w-full bg-purple-500"></div>
        </template>
        <div class="py-4">
          <FileProtectOutlined class="text-3xl text-purple-500 mb-4" />
          <div class="font-bold text-lg mb-2">知识底座</div>
          <div class="text-gray-500 text-sm">沉淀 GJB 标准库与历史项目资产，为生成提供高质量上下文。</div>
        </div>
      </a-card>

      <a-card class="hover:border-orange-500 cursor-pointer transition-colors" @click="router.push('/models')">
        <template #cover>
          <div class="h-2 w-full bg-orange-500"></div>
        </template>
        <div class="py-4">
          <SettingOutlined class="text-3xl text-orange-500 mb-4" />
          <div class="font-bold text-lg mb-2">模型管理</div>
          <div class="text-gray-500 text-sm">灵活配置 DeepSeek、OpenAI 或本地 Ollama 模型，测试连接状态。</div>
        </div>
      </a-card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <a-card title="最近作业" class="lg:col-span-2">
         <a-empty description="暂无历史记录" />
      </a-card>
      <a-card title="系统状态">
         <div class="space-y-4">
            <div class="flex justify-between items-center">
               <span class="text-gray-500">服务状态:</span>
               <a-badge status="success" text="运行中" />
            </div>
            <div class="flex justify-between items-center">
               <span class="text-gray-500">默认模型:</span>
               <a-tag color="blue">未配置</a-tag>
            </div>
            <div class="flex justify-between items-center">
               <span class="text-gray-500">存储引擎:</span>
               <span class="text-sm font-mono">SQLite 3.x</span>
            </div>
         </div>
      </a-card>
    </div>
  </div>
</template>
