import { createRouter, createWebHashHistory } from 'vue-router'
import Generation from '../views/Generation.vue'
import Templates from '../views/Templates.vue'
import Settings from '../views/Settings.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/generation'
    },
    {
      path: '/generation',
      name: 'Generation',
      component: Generation
    },
    {
      path: '/templates',
      name: 'Templates',
      component: Templates
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings
    }
  ]
})

export default router
