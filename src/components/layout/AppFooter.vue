<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
    <div class="container mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
      <p>{{ t('app.title') }} &copy; {{ currentYear }}</p>
    </div>
  </footer>
</template>
