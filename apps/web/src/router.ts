import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'board',
      component: () => import('./pages/Board.vue'),
    },
    {
      path: '/playground',
      name: 'playground',
      component: () => import('./pages/Playground.vue'),
    },
  ],
})

export default router
