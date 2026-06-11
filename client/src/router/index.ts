import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import DocumentGeneratePage from '@/pages/DocumentGeneratePage.vue'
import DocumentReviewPage from '@/pages/DocumentReviewPage.vue'
import KnowledgeBasePage from '@/pages/KnowledgeBasePage.vue'
import AdminModelConfigPage from '@/pages/AdminModelConfigPage.vue'
import ManualCapturePage from '@/pages/ManualCapturePage.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage, meta: { title: '作战总览' } },
  { path: '/generate', name: 'generate', component: DocumentGeneratePage, meta: { title: '文档生成' } },
  { path: '/review', name: 'review', component: DocumentReviewPage, meta: { title: '文档审查' } },
  { path: '/knowledge', name: 'knowledge', component: KnowledgeBasePage, meta: { title: '知识底座' } },
  { path: '/models', name: 'models', component: AdminModelConfigPage, meta: { title: '模型配置' } },
  { path: '/manual', name: 'manual', component: ManualCapturePage, meta: { title: '手册编制' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
