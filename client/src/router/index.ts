
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import DocumentListPage from '@/pages/DocumentListPage.vue'
import DocumentWorkspacePage from '@/pages/DocumentWorkspacePage.vue'
import KnowledgeBasePage from '@/pages/KnowledgeBasePage.vue'
import AdminModelConfigPage from '@/pages/AdminModelConfigPage.vue'
import HelpPage from '@/pages/HelpPage.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage, meta: { title: '平台总览' } },
  { path: '/documents', name: 'documents', component: DocumentListPage, meta: { title: '文档管理' } },
  { path: '/documents/:id', name: 'workspace', component: DocumentWorkspacePage, meta: { title: '编制工作台' } },
  { path: '/knowledge', name: 'knowledge', component: KnowledgeBasePage, meta: { title: '知识维护' } },
  { path: '/models', name: 'models', component: AdminModelConfigPage, meta: { title: '模型配置' } },
  { path: '/help', name: 'help', component: HelpPage, meta: { title: '帮助中心' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
