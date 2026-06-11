<script setup lang="ts">
import MetricCard from '@/components/MetricCard.vue'

const metrics = [
  {
    title: '规则命中效率',
    value: '92.4%',
    description: 'GJB 章节、编号、术语和图表规则统一归并后，可在一次任务中输出结构化问题清单。',
    accent: '#22d3ee',
  },
  {
    title: '文档初稿时间',
    value: '< 15 min',
    description: '基于模板、知识检索和本地主模型完成首稿生成，并自动进入审查流程。',
    accent: '#a78bfa',
  },
  {
    title: '整改闭环追踪',
    value: '100%',
    description: '问题状态、确认意见、整改建议和复核结论在同一任务中沉淀并可审计。',
    accent: '#34d399',
  },
]

const timelines = [
  '导入规范、模板、术语与历史文档，形成知识底座。',
  '按模板生成需求、设计、测试或手册文档草稿。',
  '规则引擎与模型协同审查，输出问题清单与修改建议。',
  '在桌面端完成截图采集、手册段落生成与结果导出。',
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

    <section class="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <a-card class="platform-card" title="首版能力闭环">
        <a-timeline>
          <a-timeline-item v-for="step in timelines" :key="step" color="cyan">{{ step }}</a-timeline-item>
        </a-timeline>
      </a-card>

      <a-card class="platform-card" title="部署形态">
        <div class="space-y-4 text-sm leading-7 text-slate-300">
          <div>客户端：Electron + Vue 3 + Ant Design Vue</div>
          <div>服务端：FastAPI + 配置化规则引擎 + 模型网关</div>
          <div>基础设施：PostgreSQL / 向量库 / 对象存储 / 本地模型</div>
          <div>安全边界：主进程持有截图和文件能力，渲染层仅调用受控 API</div>
        </div>
      </a-card>
    </section>
  </div>
</template>
