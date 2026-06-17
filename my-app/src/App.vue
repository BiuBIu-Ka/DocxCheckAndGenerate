<template>
  <el-container class="app-shell">
    <el-aside width="260px" class="app-sidebar">
      <div class="brand-card">
        <div class="brand-eyebrow">AI Workbench</div>
        <div class="brand-title">文档生成中台</div>
        <div class="brand-subtitle">模板、知识库、工具、生成链路和导出全流程在一个壳层下统一管理。</div>
      </div>

      <el-menu :default-active="route.path" router class="nav-menu">
        <div class="menu-group-title">工作流</div>
        <el-menu-item index="/generation">
          <el-icon><MagicStick /></el-icon>
          <span>生成中台</span>
        </el-menu-item>
        <el-menu-item index="/runs">
          <el-icon><Tickets /></el-icon>
          <span>任务记录</span>
        </el-menu-item>

        <div class="menu-group-title">资产中心</div>
        <el-menu-item index="/templates">
          <el-icon><Files /></el-icon>
          <span>模板中心</span>
        </el-menu-item>
        <el-menu-item index="/knowledge">
          <el-icon><Collection /></el-icon>
          <span>知识库</span>
        </el-menu-item>
        <el-menu-item index="/tools">
          <el-icon><Connection /></el-icon>
          <span>工具与 MCP</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>模型配置</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <div class="footer-label">当前环境</div>
        <el-tag effect="dark" type="info">{{ appConfig.environmentLabel }}</el-tag>
      </div>
    </el-aside>

    <el-container class="app-main">
      <el-header class="app-topbar">
        <div class="topbar-left">
          <div>
            <div class="topbar-title">{{ pageTitle }}</div>
            <div class="topbar-subtitle">默认开放完整 AI 调用、工具执行和结构化预览细节。</div>
          </div>
        </div>

        <div class="topbar-right">
          <div class="topbar-metrics">
            <el-tag effect="dark" :type="appConfig.hasModelConfig ? 'success' : 'danger'">
              {{ appConfig.hasModelConfig ? '模型已配置' : '模型未配置' }}
            </el-tag>
            <el-tag effect="plain">模板 {{ appConfig.templateCount }}</el-tag>
            <el-tag effect="plain">知识库 {{ appConfig.knowledgeCount }}</el-tag>
            <el-tag effect="plain">工具 {{ appConfig.toolCount }}</el-tag>
            <el-tag effect="plain">
              最近任务 {{ lastRunLabel }}
            </el-tag>
          </div>
          <div class="topbar-actions">
            <el-button type="primary" @click="router.push('/generation')">新建生成</el-button>
            <el-button @click="router.push('/runs')">查看任务</el-button>
            <el-button @click="router.push('/templates')">管理模板</el-button>
          </div>
        </div>
      </el-header>

      <el-main class="app-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppConfigStore } from './stores/appConfig'
import { useGenerationWorkbenchStore } from './stores/generationWorkbench'

const route = useRoute()
const router = useRouter()
const appConfig = useAppConfigStore()
const workbench = useGenerationWorkbenchStore()

const titleMap: Record<string, string> = {
  '/generation': '生成中台',
  '/runs': '任务记录',
  '/templates': '模板中心',
  '/knowledge': '知识库',
  '/tools': '工具与 MCP',
  '/settings': '模型配置',
}

const pageTitle = computed(() => titleMap[route.path] || '系统页面')
const lastRunLabel = computed(() => {
  const latest = workbench.recentRuns[0]
  if (!latest) return '暂无记录'
  return latest.status === 'success' ? '成功' : latest.status === 'error' ? '失败' : '运行中'
})

onMounted(async () => {
  await Promise.all([appConfig.load(), workbench.loadRecentRuns()])
})
</script>

<style scoped>
.app-shell {
  height: 100vh;
  width: 100vw;
  background: var(--app-bg);
}

.app-sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px 16px;
  border-right: 1px solid var(--panel-border);
  background:
    radial-gradient(circle at top, rgba(95, 168, 255, 0.16), transparent 32%),
    linear-gradient(180deg, rgba(12, 18, 29, 0.98), rgba(12, 18, 29, 0.92));
}

.brand-card,
.sidebar-footer {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
}

.brand-eyebrow,
.footer-label,
.menu-group-title {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.brand-title {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.brand-subtitle {
  margin-top: 8px;
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 13px;
}

.nav-menu {
  flex: 1;
  border: 0;
  background: transparent;
}

.nav-menu :deep(.el-menu-item) {
  margin-bottom: 6px;
  border-radius: 12px;
  color: var(--text-secondary);
}

.nav-menu :deep(.el-menu-item.is-active) {
  background: rgba(95, 168, 255, 0.14);
  color: var(--text-primary);
}

.menu-group-title {
  margin: 18px 10px 10px;
}

.app-main {
  min-width: 0;
}

.app-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: auto;
  padding: 18px 24px 10px;
  border-bottom: 1px solid var(--panel-border);
  background: rgba(11, 17, 27, 0.9);
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.topbar-right {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.topbar-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.topbar-subtitle {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 13px;
}

.topbar-metrics,
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.app-content {
  padding: 20px 24px 24px;
  overflow-y: auto;
}

@media (max-width: 1200px) {
  .app-topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .topbar-right {
    justify-content: flex-start;
  }
}
</style>
