<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useReceiptStore } from '@/stores/receipt'

const { t } = useI18n()
const router = useRouter()
const receiptStore = useReceiptStore()

const createNewReceipt = () => {
  receiptStore.reset() // Make sure we're using the correct method name
  router.push('/editor')
}

// Define feature items using i18n translations
const featureItems = [
  {
    icon: '📄',
    title: t('home.features.invoices.title'),
    description: t('home.features.invoices.description')
  },
  {
    icon: '🖨️',
    title: t('home.features.share.title'),
    description: t('home.features.share.description')
  },
  {
    icon: '📱',
    title: t('home.features.mobile.title'),
    description: t('home.features.mobile.description')
  }
]

// Define reasons for using the app using i18n translations
const reasons = [
  t('home.why.reasons.branding'),
  t('home.why.reasons.themes'),
  t('home.why.reasons.qr'),
  t('home.why.reasons.languages'),
  t('home.why.reasons.offline')
]
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-10">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white">{{ t('app.title') }}</h1>
        <p class="mt-3 text-xl text-gray-600 dark:text-gray-300">{{ t('app.description') }}</p>
        
        <div class="mt-8">
          <button @click="createNewReceipt" class="btn text-lg px-6 py-3">
            {{ t('actions.create') }}
          </button>
        </div>
      </div>
      
      <div class="grid md:grid-cols-3 gap-6 mt-16">
        <div v-for="(feature, idx) in featureItems" :key="idx" class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <div class="text-3xl mb-3">{{ feature.icon }}</div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ feature.title }}</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">{{ feature.description }}</p>
        </div>
      </div>
      
      <div class="mt-16 bg-primary-50 dark:bg-gray-800 rounded-xl p-8">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ t('home.why.title') }}</h2>
        <ul class="space-y-3 text-gray-600 dark:text-gray-300">
          <li v-for="(reason, idx) in reasons" :key="idx" class="flex items-start">
            <svg class="h-5 w-5 text-primary-500 mr-2 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span>{{ reason }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
