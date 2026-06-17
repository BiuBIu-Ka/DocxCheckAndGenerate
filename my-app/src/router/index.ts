import { createRouter, createWebHashHistory } from 'vue-router'
import Generation from '../views/Generation.vue'
import Templates from '../views/Templates.vue'
import Settings from '../views/Settings.vue'
import Knowledge from '../views/Knowledge.vue'
import Tools from '../views/Tools.vue'

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
      path: '/knowledge',
      name: 'Knowledge',
      component: Knowledge
    },
    {
      path: '/templates',
      name: 'Templates',
      component: Templates
    },
    {
      path: '/tools',
      name: 'Tools',
      component: Tools
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings
    }
  ]
})

export default router
