
<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BookOutlined,
  FileSearchOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  SettingOutlined,
  AppstoreOutlined,
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const items = [
  { key: '/', icon: () => h(HomeOutlined), label: '工作台' },
  { key: '/generate', icon: () => h(BookOutlined), label: '文档编制' },
  { key: '/review', icon: () => h(FileSearchOutlined), label: '智能审查' },
  { key: '/knowledge', icon: () => h(FolderOpenOutlined), label: 'GJB知识库' },
  { key: '/manual', icon: () => h(AppstoreOutlined), label: '手册生成' },
  { key: '/models', icon: () => h(SettingOutlined), label: '系统设置' },
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
