import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/editor',
    name: 'ReceiptEditor',
    component: () => import('@/views/ReceiptEditor.vue')
  },
  {
    path: '/preview',
    name: 'ReceiptPreview',
    component: () => import('@/views/ReceiptPreview.vue')
  },
  {
    path: '/view/:id',
    name: 'ReceiptView',
    component: () => import('@/views/ReceiptView.vue')
  },
  {
    path: '/history',
    name: 'ReceiptHistory',
    component: () => import('@/views/ReceiptHistory.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
