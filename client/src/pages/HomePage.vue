<script setup lang="ts">
import MetricCard from '@/components/MetricCard.vue'

const metrics = [
  {
    title: '当前阶段',
    value: 'MVP 演示版',
    description: '已完成生成、审查、知识底座与手册草稿的最小闭环，当前页面指标为演示桩数据。',
    accent: '#22d3ee',
  },
  {
    title: '模型接入方式',
    value: '可配置兼容',
    description: '支持本地模型、Ollama、DeepSeek 或 OpenAI 兼容接口，但当前列表仅为示例配置展示。',
    accent: '#a78bfa',
  },
  {
    title: '当前界面重点',
    value: '清晰可演示',
    description: '优先突出任务入口、状态概览和操作链路，避免把真实接入能力与示例数据混淆。',
    accent: '#34d399',
  },
]

const timelines = [
  '导入规范、模板、术语与历史文档，形成知识底座。',
  '按模板生成需求、设计、测试或手册文档草稿。',
  '规则引擎与模型协同审查，输出问题清单与修改建议。',
  '在桌面端完成截图采集、手册段落生成与结果导出。',
]

const facts = [
  { label: '数据来源', value: '当前为前后端演示桩数据，不代表真实项目库内容。' },
  { label: '模型状态', value: '模型页展示的是可接入形态示例，不表示本机已成功连接 Ollama。' },
  { label: '适用场景', value: '面向军工软件文档编制、GJB 审查和电子手册编制的一体化桌面平台。' },
]
</script>

<template>
  <div class="space-y-6">
    <section class="hero-panel">
      <div>
        <div class="badge-line">军工软件 · 文档工程 · 智能审查</div>
        <h1 class="hero-title">让 GJB 约束从人工经验，变成可执行、可追踪、可复核的数字规则。</h1>
        <p class="hero-copy">
          平台以 Electron 桌面端为作业入口，统一承载文档生成、规则审查、知识底座、截图手册和模型配置能力。
        </p>
        <div class="mt-6 max-w-3xl">
          <a-alert
            type="warning"
            show-icon
            message="当前首页指标、知识数量、模型供应商状态均为演示数据，用于说明平台能力结构，不代表已连通真实模型或真实项目资产。"
          />
        </div>
      </div>
      <div class="hero-grid">
        <div class="hero-chip">需求规格说明书</div>
        <div class="hero-chip">设计说明书</div>
        <div class="hero-chip">测试说明书</div>
        <div class="hero-chip">电子交互手册</div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <MetricCard v-for="item in metrics" :key="item.title" v-bind="item" />
    </section>

    <section class="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <a-card class="platform-card" title="首版能力闭环">
        <a-timeline>
          <a-timeline-item v-for="step in timelines" :key="step" color="cyan">{{ step }}</a-timeline-item>
        </a-timeline>
      </a-card>

      <a-card class="platform-card" title="当前说明">
        <div class="space-y-4">
          <div v-for="item in facts" :key="item.label" class="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div class="text-sm text-slate-400">{{ item.label }}</div>
            <div class="mt-2 text-sm leading-7 text-slate-200">{{ item.value }}</div>
          </div>
        </div>
      </a-card>
    </section>
  </div>
</template>
