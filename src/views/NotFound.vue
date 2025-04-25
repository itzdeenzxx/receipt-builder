<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="container mx-auto px-4 py-16">
    <div class="max-w-md mx-auto text-center">
      <h1 class="text-9xl font-extrabold text-primary-600 dark:text-primary-400">404</h1>
      <p class="text-2xl font-medium text-gray-900 dark:text-white mb-6">Page Not Found</p>
      <p class="text-gray-600 dark:text-gray-300 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button @click="goHome" class="btn">
        {{ t('nav.home') }}
      </button>
    </div>
  </div>
</template>
