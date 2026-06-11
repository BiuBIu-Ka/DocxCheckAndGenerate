<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BookOutlined,
  FileSearchOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  RobotOutlined,
  ScissorOutlined,
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const items = [
  { key: '/', icon: () => h(HomeOutlined), label: '作战总览' },
  { key: '/generate', icon: () => h(BookOutlined), label: '文档生成' },
  { key: '/review', icon: () => h(FileSearchOutlined), label: '文档审查' },
  { key: '/knowledge', icon: () => h(FolderOpenOutlined), label: '知识底座' },
  { key: '/models', icon: () => h(RobotOutlined), label: '模型配置' },
  { key: '/manual', icon: () => h(ScissorOutlined), label: '手册编制' },
]

const selectedKeys = computed(() => [route.path])

function handleMenuClick({ key }: { key: string }) {
  router.push(key)
}
</script>

<template>
  <a-layout class="min-h-screen bg-transparent">
    <a-layout-sider :width="250" theme="dark" class="platform-sider">
      <div class="px-6 pb-6 pt-7">
        <div class="text-xs uppercase tracking-[0.28em] text-slate-400">GJB Rule Engine</div>
        <div class="mt-2 text-2xl font-semibold text-white">文档智能编制平台</div>
        <div class="mt-2 text-sm text-slate-400">涉密内网 · Electron 桌面端 · 生成即审查</div>
      </div>
      <a-menu
        :selected-keys="selectedKeys"
        theme="dark"
        mode="inline"
        :items="items"
        @click="handleMenuClick"
      />
      <div class="mx-4 mt-6 rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-4 text-sm text-slate-300">
        <div class="font-medium text-cyan-300">首版目标</div>
        <div class="mt-2 leading-6">完成文档生成、规则审查、整改闭环与截图手册编制的可演示最小闭环。</div>
      </div>
    </a-layout-sider>

    <a-layout class="bg-transparent px-6 py-5">
      <a-layout-header class="platform-header">
        <div>
          <div class="text-sm uppercase tracking-[0.3em] text-slate-500">Mission Status</div>
          <div class="mt-1 text-2xl font-semibold text-white">{{ route.meta.title || '平台总览' }}</div>
        </div>
        <div class="flex items-center gap-3">
          <a-tag color="processing">规则库在线</a-tag>
          <a-tag color="success">模型网关就绪</a-tag>
          <a-tag color="purple">本地部署模式</a-tag>
        </div>
      </a-layout-header>
      <a-layout-content class="pt-5">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
