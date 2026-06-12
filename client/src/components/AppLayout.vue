
<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BookOutlined,
  FileSearchOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const items = [
  { key: '/', icon: () => h(HomeOutlined), label: '工作台' },
  { key: '/documents', icon: () => h(BookOutlined), label: '文档管理' },
  { key: '/knowledge', icon: () => h(FolderOpenOutlined), label: '知识库管理' },
  { key: '/models', icon: () => h(SettingOutlined), label: '模型设置' },
  { key: '/help', icon: () => h(QuestionCircleOutlined), label: '帮助中心' },
]

const selectedKeys = computed(() => [route.path])

function handleMenuClick({ key }: { key: string }) {
  router.push(key)
}
</script>

<template>
  <a-layout class="min-h-screen">
    <a-layout-sider :width="240" theme="dark">
      <div class="p-6">
        <div class="text-white font-bold text-xl flex items-center gap-2">
          <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">G</div>
          GJB智能文档平台
        </div>
      </div>
      <a-menu
        :selected-keys="selectedKeys"
        theme="dark"
        mode="inline"
        :items="items"
        @click="handleMenuClick"
      />
    </a-layout-sider>

    <a-layout>
      <a-layout-header>
        <div class="flex items-center gap-4">
          <a-breadcrumb>
            <a-breadcrumb-item>平台</a-breadcrumb-item>
            <a-breadcrumb-item>{{ route.meta.title }}</a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="flex items-center gap-4">
          <a-tag color="blue">生产就绪版</a-tag>
          <a-avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
        </div>
      </a-layout-header>
      <a-layout-content class="p-6">
        <div class="max-w-[1400px] mx-auto">
          <slot />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
