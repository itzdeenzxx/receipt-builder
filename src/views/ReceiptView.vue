<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import html2pdf from 'html2pdf.js'
import html2canvas from 'html2canvas'
import {
  ArrowDownTrayIcon,
  DocumentIcon,
  HomeIcon,
  LockClosedIcon,
  PrinterIcon,
  PhotoIcon,
  CheckCircleIcon,
  ReceiptPercentIcon,
  UserIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()

const isExporting = ref(false)
const receipt = ref(null)
const notFound = ref(false)
const isPasswordProtected = ref(false)
const password = ref('')
const isPasswordError = ref(false)
const correctPassword = ref('')

onMounted(() => {
  const id = route.params.id
  
  if (!id) {
    notFound.value = true
    return
  }
  
  // Fetch receipt data from localStorage (in a real app, this would be from the backend)
  const savedReceipts = JSON.parse(localStorage.getItem('savedReceipts') || '{}')
  
  if (savedReceipts[id]) {
    // Check if receipt is password protected
    if (savedReceipts[id].passwordProtected) {
      isPasswordProtected.value = true
      correctPassword.value = savedReceipts[id].password
      
      // If URL has password parameter, try to verify
      const urlParams = new URLSearchParams(window.location.search)
      const urlPassword = urlParams.get('pwd')
      
      if (urlPassword && urlPassword === correctPassword.value) {
        // Password from URL is correct, show receipt
        receipt.value = savedReceipts[id]
        isPasswordProtected.value = false
      }
    } else {
      // Not password protected, show receipt
      receipt.value = savedReceipts[id]
    }
  } else {
    notFound.value = true
  }
})

const verifyPassword = () => {
  if (password.value === correctPassword.value) {
    // Get receipt data
    const id = route.params.id
    const savedReceipts = JSON.parse(localStorage.getItem('savedReceipts') || '{}')
    receipt.value = savedReceipts[id]
    isPasswordProtected.value = false
    isPasswordError.value = false
  } else {
    isPasswordError.value = true
  }
}

const receiptDateFormatted = computed(() => {
  if (!receipt.value) return ''
  
  return new Date(receipt.value.receiptDetails.date).toLocaleDateString(
    settingsStore.language === 'th' ? 'th-TH' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )
})

const receiptDueDateFormatted = computed(() => {
  if (!receipt.value || !receipt.value.receiptDetails.dueDate) return ''
  
  return new Date(receipt.value.receiptDetails.dueDate).toLocaleDateString(
    settingsStore.language === 'th' ? 'th-TH' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )
})

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat(settingsStore.language === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: settingsStore.currency
  }).format(value)
}

// Generate PDF
const exportToPDF = async () => {
  isExporting.value = true
  const element = document.getElementById('receipt-to-export')
  
  const options = {
    margin: 10,
    filename: `receipt-${receipt.value.receiptDetails.number}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }
  
  try {
    await html2pdf().set(options).from(element).save()
  } catch (error) {
    console.error('Failed to export PDF:', error)
  } finally {
    isExporting.value = false
  }
}

// Print receipt
const printReceipt = () => {
  const originalBackground = document.body.style.backgroundColor
  const originalTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  
  try {
    // Force light theme for printing
    document.documentElement.classList.remove('dark')
    document.body.style.backgroundColor = 'white'
    
    // Create print-specific stylesheet
    const style = document.createElement('style')
    style.id = 'print-style'
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #receipt-to-export, #receipt-to-export * {
          visibility: visible;
        }
        #receipt-to-export {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background-color: white;
          color: black;
        }
        @page {
          size: auto;
          margin: 10mm;
        }
      }
    `
    document.head.appendChild(style)
    
    // Print
    window.print()
  } finally {
    // Restore theme settings after printing
    if (originalTheme === 'dark') {
      document.documentElement.classList.add('dark')
    }
    document.body.style.backgroundColor = originalBackground
    
    // Remove print stylesheet
    const printStyle = document.getElementById('print-style')
    if (printStyle) {
      printStyle.remove()
    }
  }
}

// Export to PNG with consistent light theme
const exportToPNG = async () => {
  isExporting.value = true
  
  // Store original theme state
  const isDarkMode = document.documentElement.classList.contains('dark')
  const element = document.getElementById('receipt-to-export')
  const originalPadding = element.style.padding
  
  try {
    // Temporarily switch to light theme for export
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
    }
    
    // Apply light theme styles directly to the element
    element.style.backgroundColor = 'white'
    element.style.color = 'black'
    element.style.padding = '20px'
    
    // Give time for theme change to render
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Create canvas with proper scale
    const canvas = await html2canvas(element, { 
      scale: 2,
      backgroundColor: 'white',
      useCORS: true,
      logging: false,
      removeContainer: true
    })
    
    // Create link and download
    const link = document.createElement('a')
    link.download = `receipt-${receipt.value.receiptDetails.number}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (error) {
    console.error('Failed to export PNG:', error)
  } finally {
    // Restore theme
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    }
    
    // Restore original styles
    element.style.padding = originalPadding
    isExporting.value = false
  }
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Not Found State -->
      <div v-if="notFound" class="text-center py-12">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Receipt Not Found</h1>
        <p class="text-gray-600 dark:text-gray-300 mb-6">The receipt you're looking for doesn't exist or has expired.</p>
        <button @click="goHome" class="btn inline-flex items-center">
          <HomeIcon class="h-5 w-5 mr-2" />
          Go Home
        </button>
      </div>
      
      <!-- Password Protected State -->
      <div v-else-if="isPasswordProtected" class="text-center py-12">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <LockClosedIcon class="h-12 w-12 text-primary-500 mx-auto mb-4" />
          <h2 class="text-xl font-medium text-gray-900 dark:text-white mb-4">Protected Receipt</h2>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            This receipt is password protected. Please enter the password to view it.
          </p>
          
          <div class="mb-4">
            <input 
              v-model="password" 
              type="password"
              class="form-input w-full"
              placeholder="Enter password"
              @keyup.enter="verifyPassword"
            />
            <p v-if="isPasswordError" class="text-red-500 text-sm mt-1">
              Incorrect password. Please try again.
            </p>
          </div>
          
          <div class="flex justify-between">
            <button @click="goHome" class="btn-secondary">
              Go Back
            </button>
            <button @click="verifyPassword" class="btn">
              View Receipt
            </button>
          </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-else-if="!receipt" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p class="text-gray-600 dark:text-gray-300 mt-4">Loading receipt...</p>
      </div>
      
      <!-- Receipt Found -->
      <div v-else>
        <!-- Actions Bar -->
        <div class="mb-6 flex flex-wrap justify-between items-center">
          <button @click="goHome" class="btn-secondary mb-2 sm:mb-0">
            <HomeIcon class="h-5 w-5 mr-2" />
            {{ t('nav.home') }}
          </button>
          
          <div class="flex flex-wrap gap-2">
            <button @click="exportToPDF" class="btn" :disabled="isExporting">
              <DocumentIcon class="h-5 w-5 mr-2" />
              {{ t('actions.download.pdf') }}
            </button>
            
            <button @click="exportToPNG" class="btn-secondary" :disabled="isExporting">
              <PhotoIcon class="h-5 w-5 mr-2" />
              {{ t('actions.download.png') }}
            </button>
            
            <button @click="printReceipt" class="btn-secondary">
              <PrinterIcon class="h-5 w-5 mr-2" />
              Print
            </button>
          </div>
        </div>
        
        <!-- Receipt Preview -->
        <div class="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden mb-8 print:shadow-none">
          <div id="receipt-to-export" class="p-8 sm:p-10 print:p-0 relative">
            <!-- Premium Border Design (not shown in print) -->
            <div class="hidden md:block absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 print:hidden"></div>
            
            <!-- Receipt Header -->
            <div :class="{
              'border-b border-gray-200 dark:border-gray-700 pb-8 mb-8': true,
              'text-center': receipt.theme === 'minimal',
              'bg-blue-50 dark:bg-blue-900/20 -m-8 sm:-m-10 p-8 sm:p-10 mb-8': receipt.theme === 'modern',
              'bg-gray-50 dark:bg-gray-700/20 -m-8 sm:-m-10 p-8 sm:p-10 mb-8 text-center border-b-0': receipt.theme === 'elegant',
              'bg-slate-800 dark:bg-slate-700 -m-8 sm:-m-10 p-8 sm:p-10 mb-8 text-white': receipt.theme === 'business'
            }">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <!-- Business Information -->
                <div :class="{
                  'mb-6 sm:mb-0': true,
                  'sm:text-left': receipt.theme === 'minimal',
                  'mx-auto': receipt.theme === 'elegant'
                }">
                  <div v-if="receipt.shop.logo" class="mb-5 max-w-[200px] mx-auto sm:mx-0">
                    <img :src="receipt.shop.logo" alt="Shop logo" class="h-16 w-auto object-contain">
                  </div>
                  <h2 :class="{
                    'text-2xl font-bold tracking-tight': true,
                    'text-gray-900 dark:text-white': receipt.theme !== 'business',
                    'text-white': receipt.theme === 'business',
                    'font-serif italic': receipt.theme === 'elegant'
                  }">{{ receipt.shop.name || t('receipt.shop.name') }}</h2>
                  
                  <div class="mt-2 flex items-start">
                    <BuildingOfficeIcon class="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p v-if="receipt.shop.address" :class="{
                      'whitespace-pre-line': true, 
                      'text-gray-600 dark:text-gray-300': receipt.theme !== 'business',
                      'text-gray-300': receipt.theme === 'business',
                      'text-sm italic': receipt.theme === 'elegant'
                    }">{{ receipt.shop.address }}</p>
                  </div>
                  
                  <div v-if="receipt.shop.phone || receipt.shop.email" class="mt-3 space-y-1">
                    <p v-if="receipt.shop.phone" class="flex items-center text-gray-600 dark:text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {{ receipt.shop.phone }}
                    </p>
                    <p v-if="receipt.shop.email" class="flex items-center text-gray-600 dark:text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {{ receipt.shop.email }}
                    </p>
                    <p v-if="receipt.shop.website" class="flex items-center text-gray-600 dark:text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9-3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      {{ receipt.shop.website }}
                    </p>
                  </div>
                </div>
                
                <!-- Receipt Details -->
                <div :class="{
                  'text-right p-4 sm:p-5 bg-gray-50 dark:bg-gray-700/40 rounded-lg': receipt.theme !== 'minimal' && receipt.theme !== 'elegant' && receipt.theme !== 'business',
                  'text-center mt-4 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg': receipt.theme === 'minimal',
                  'text-center mx-auto mt-4 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg': receipt.theme === 'elegant',
                  'bg-slate-700 p-5 rounded-lg': receipt.theme === 'business'
                }">
                  <h2 :class="{
                    'text-2xl font-bold mb-2': true,
                    'text-primary-600 dark:text-primary-400': receipt.theme !== 'business' && receipt.theme !== 'elegant',
                    'text-slate-200': receipt.theme === 'business',
                    'font-serif italic text-gray-800 dark:text-gray-200': receipt.theme === 'elegant'
                  }">{{ t('receipt.title') }}</h2>
                  
                  <div class="flex items-center justify-end mt-3">
                    <ReceiptPercentIcon class="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                    <p :class="{
                      'text-gray-600 dark:text-gray-300': receipt.theme !== 'business',
                      'text-gray-300': receipt.theme === 'business',
                      'italic': receipt.theme === 'elegant'
                    }"><span class="font-medium text-gray-900 dark:text-white"># {{ receipt.receiptDetails.number }}</span></p>
                  </div>
                  
                  <div class="flex items-center justify-end mt-1">
                    <CalendarIcon class="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                    <p :class="{
                      'text-gray-600 dark:text-gray-300': receipt.theme !== 'business',
                      'text-gray-300': receipt.theme === 'business',
                      'italic': receipt.theme === 'elegant'
                    }">{{ receiptDateFormatted }}</p>
                  </div>
                  
                  <div v-if="receipt.receiptDetails.dueDate" class="flex items-center justify-end mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p :class="{
                      'text-gray-600 dark:text-gray-300': receipt.theme !== 'business',
                      'text-gray-300': receipt.theme === 'business',
                      'italic': receipt.theme === 'elegant'
                    }">{{ t('receipt.due') }}: {{ receiptDueDateFormatted }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <!-- Customer Information -->
              <div v-if="receipt.customer.name || receipt.customer.address" class="lg:col-span-2">
                <h3 :class="{
                  'text-lg font-medium mb-3 flex items-center': true,
                  'text-gray-900 dark:text-white': receipt.theme !== 'business',
                  'text-slate-700 dark:text-slate-300 uppercase text-sm tracking-wider': receipt.theme === 'business',
                  'font-serif italic text-center border-b border-dashed border-gray-200 dark:border-gray-700 pb-2': receipt.theme === 'elegant'
                }">
                  <UserIcon class="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                  {{ t('receipt.customer.name') }}
                </h3>
                <div :class="{
                  'bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5': receipt.theme !== 'elegant' && receipt.theme !== 'business',
                  'p-5 border-l-4 border-gray-200 dark:border-gray-600 rounded-r-lg bg-gray-50/50 dark:bg-gray-700/30': receipt.theme === 'elegant',
                  'bg-slate-100 dark:bg-slate-800 p-5 border-l-2 border-slate-800 dark:border-slate-300 rounded-lg': receipt.theme === 'business'
                }">
                  <p :class="{
                    'font-medium text-lg': true,
                    'text-gray-900 dark:text-white': receipt.theme !== 'business',
                    'text-slate-700 dark:text-slate-200': receipt.theme === 'business',
                    'font-serif text-lg': receipt.theme === 'elegant'
                  }">{{ receipt.customer.name }}</p>
                  
                  <div v-if="receipt.customer.address" class="mt-2 flex">
                    <BuildingOfficeIcon class="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p :class="{
                      'whitespace-pre-line': true,
                      'text-gray-600 dark:text-gray-300': receipt.theme !== 'business',
                      'text-slate-600 dark:text-slate-400': receipt.theme === 'business',
                      'italic': receipt.theme === 'elegant'
                    }">{{ receipt.customer.address }}</p>
                  </div>
                  
                  <div v-if="receipt.customer.phone || receipt.customer.email" class="mt-3 space-y-1">
                    <p v-if="receipt.customer.phone" class="flex items-center text-gray-600 dark:text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {{ receipt.customer.phone }}
                    </p>
                    <p v-if="receipt.customer.email" class="flex items-center text-gray-600 dark:text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {{ receipt.customer.email }}
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Payment Summary Box -->
              <div class="lg:col-span-1">
                <h3 :class="{
                  'text-lg font-medium mb-3 flex items-center': true,
                  'text-gray-900 dark:text-white': receipt.theme !== 'business',
                  'text-slate-700 dark:text-slate-300 uppercase text-sm tracking-wider': receipt.theme === 'business',
                  'font-serif italic text-center border-b border-dashed border-gray-200 dark:border-gray-700 pb-2': receipt.theme === 'elegant'
                }">
                  <CreditCardIcon class="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                  {{ t('payment.title') }}
                </h3>
                <div :class="{
                  'bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5': receipt.theme !== 'elegant' && receipt.theme !== 'business',
                  'p-5 border-r-4 border-gray-200 dark:border-gray-600 rounded-l-lg bg-gray-50/50 dark:bg-gray-700/30': receipt.theme === 'elegant',
                  'bg-slate-100 dark:bg-slate-800 p-5 border-l-2 border-slate-800 dark:border-slate-300 rounded-lg': receipt.theme === 'business'
                }">
                  <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                    <span class="text-gray-600 dark:text-gray-300">{{ t('payment.status') }}</span>
                    <span class="font-medium flex items-center text-green-600 dark:text-green-400">
                      <CheckCircleIcon class="h-4 w-4 mr-1" />
                      {{ t('payment.paid') }}
                    </span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                    <span class="text-gray-600 dark:text-gray-300">{{ t('payment.method') }}</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ t(`payment.${receipt.paymentMethod || 'cash'}`) }}</span>
                  </div>
                  <div class="flex justify-between py-2">
                    <span class="text-gray-600 dark:text-gray-300">{{ t('receipt.date') }}</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ receiptDateFormatted }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Items Table -->
            <div class="mb-8">
              <h3 :class="{
                'text-lg font-medium mb-4 flex items-center': true,
                'text-gray-900 dark:text-white': receipt.theme !== 'business',
                'text-slate-700 dark:text-slate-300 uppercase text-sm tracking-wider': receipt.theme === 'business',
                'font-serif italic text-center border-b border-dashed border-gray-200 dark:border-gray-700 pb-2': receipt.theme === 'elegant'
              }">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {{ t('receipt.items.title') }}
              </h3>
              
              <div class="overflow-x-auto bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
                <table class="w-full border-collapse">
                  <thead>
                    <tr :class="{
                      'text-left': true,
                      'bg-gray-100 dark:bg-gray-700': receipt.theme !== 'business' && receipt.theme !== 'elegant',
                      'border-b border-dashed border-gray-200 dark:border-gray-700': receipt.theme === 'elegant',
                      'bg-slate-200 dark:bg-slate-700 uppercase text-xs tracking-wider': receipt.theme === 'business'
                    }">
                      <th class="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium text-center w-10">#</th>
                      <th class="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{{ t('receipt.items.name') }}</th>
                      <th class="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium text-right">{{ t('receipt.items.quantity') }}</th>
                      <th class="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium text-right">{{ t('receipt.items.price') }}</th>
                      <th class="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium text-right">{{ t('receipt.items.amount') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in receipt.items" :key="index" :class="{
                      'border-b': true,
                      'border-gray-200 dark:border-gray-700': receipt.theme !== 'elegant',
                      'border-dashed': receipt.theme === 'elegant',
                      'hover:bg-gray-50 dark:hover:bg-gray-750': true,
                      'bg-gray-50/50 dark:bg-gray-700/20': index % 2 === 1
                    }">
                      <td class="px-4 py-4 text-gray-900 dark:text-white text-center">{{ index + 1 }}</td>
                      <td class="px-4 py-4 text-gray-900 dark:text-white">
                        <div class="flex items-center">
                          <div v-if="item.image" class="flex-shrink-0 mr-3">
                            <img :src="item.image" :alt="item.name" class="h-12 w-12 object-cover rounded-md border border-gray-200 dark:border-gray-700">
                          </div>
                          <div>
                            <div class="font-medium">{{ item.name }}</div>
                            <div v-if="item.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ item.description }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-4 text-gray-900 dark:text-white text-right">{{ item.quantity }}</td>
                      <td class="px-4 py-4 text-gray-900 dark:text-white text-right">{{ formatCurrency(item.price) }}</td>
                      <td class="px-4 py-4 text-gray-900 dark:text-white text-right font-medium">{{ formatCurrency(item.quantity * item.price) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Totals -->
            <div class="flex flex-col md:flex-row md:justify-end mb-8">
              <div class="md:w-1/2 lg:w-2/5">
                <div :class="{
                  'bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5': receipt.theme !== 'business' && receipt.theme !== 'elegant',
                  'p-5 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg': receipt.theme === 'elegant',
                  'bg-slate-100 dark:bg-slate-800 p-5 rounded-lg': receipt.theme === 'business'
                }">
                  <div class="flex justify-between py-2 border-b border-gray-200/70 dark:border-gray-600/70">
                    <span :class="{
                      'text-gray-600 dark:text-gray-300': receipt.theme !== 'business',
                      'text-slate-600 dark:text-slate-400': receipt.theme === 'business',
                      'font-serif italic': receipt.theme === 'elegant'
                    }">{{ t('receipt.summary.subtotal') }}</span>
                    <span :class="{
                      'text-gray-900 dark:text-white': receipt.theme !== 'business',
                      'text-slate-700 dark:text-slate-200': receipt.theme === 'business',
                      'font-serif': receipt.theme === 'elegant'
                    }">{{ formatCurrency(receipt.subtotal) }}</span>
                  </div>
                  
                  <div v-if="receipt.discountValue > 0" class="flex justify-between py-2 border-b border-gray-200/70 dark:border-gray-600/70">
                    <span :class="{
                      'text-gray-600 dark:text-gray-300 flex items-center': receipt.theme !== 'business',
                      'text-slate-600 dark:text-slate-400 flex items-center': receipt.theme === 'business',
                      'font-serif italic flex items-center': receipt.theme === 'elegant'
                    }">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ t('receipt.summary.discount') }}
                      <span v-if="receipt.discountType === 'percentage'" class="ml-1 text-sm">
                        ({{ receipt.discount }}%)
                      </span>
                    </span>
                    <span class="text-green-600 dark:text-green-400">- {{ formatCurrency(receipt.discountValue) }}</span>
                  </div>
                  
                  <div v-if="receipt.taxRate > 0" class="flex justify-between py-2 border-b border-gray-200/70 dark:border-gray-600/70">
                    <span :class="{
                      'text-gray-600 dark:text-gray-300 flex items-center': receipt.theme !== 'business',
                      'text-slate-600 dark:text-slate-400 flex items-center': receipt.theme === 'business',
                      'font-serif italic flex items-center': receipt.theme === 'elegant'
                    }">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {{ t('receipt.summary.tax') }} 
                      <span class="ml-1 text-sm">({{ receipt.taxRate }}%)</span>
                    </span>
                    <span :class="{
                      'text-gray-900 dark:text-white': receipt.theme !== 'business',
                      'text-slate-700 dark:text-slate-200': receipt.theme === 'business',
                      'font-serif': receipt.theme === 'elegant'
                    }">{{ formatCurrency(receipt.taxValue) }}</span>
                  </div>
                  
                  <div class="flex justify-between pt-3 mt-1">
                    <span :class="{
                      'text-lg font-medium text-gray-900 dark:text-white': receipt.theme !== 'business' && receipt.theme !== 'elegant',
                      'text-lg font-bold text-slate-800 dark:text-slate-200': receipt.theme === 'business',
                      'text-lg font-serif italic font-medium text-gray-900 dark:text-white': receipt.theme === 'elegant'
                    }">{{ t('receipt.summary.total') }}</span>
                    <span :class="{
                      'text-lg font-medium text-primary-600 dark:text-primary-400': receipt.theme !== 'business' && receipt.theme !== 'elegant',
                      'text-lg font-bold text-slate-800 dark:text-slate-200': receipt.theme === 'business',
                      'text-lg font-serif font-medium text-primary-600 dark:text-primary-400': receipt.theme === 'elegant'
                    }">{{ formatCurrency(receipt.total) }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Notes Section -->
            <div v-if="receipt.notes" class="mb-8 p-5 bg-gray-50 dark:bg-gray-700/30 rounded-lg border-l-4 border-primary-500 dark:border-primary-600">
              <h4 class="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {{ t('receipt.notes.title') }}
              </h4>
              <p class="text-gray-600 dark:text-gray-300 whitespace-pre-line">{{ receipt.notes }}</p>
            </div>
            
            <!-- Thai Style Elements -->
            <div v-if="receipt.theme === 'thai'" class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div class="flex flex-col md:flex-row justify-between">
                <div class="mb-4 md:mb-0 md:w-1/3 text-center">
                  <p class="text-gray-600 dark:text-gray-300 mb-1">ลายเซ็นผู้รับเงิน</p>
                  <div class="h-16 border-b border-dashed border-gray-400 dark:border-gray-600"></div>
                  <p class="text-gray-600 dark:text-gray-300 mt-1">ผู้รับเงิน / Collector</p>
                </div>
                
                <div class="mb-4 md:mb-0 md:w-1/3 text-center">
                  <p class="text-gray-600 dark:text-gray-300 mb-1">ลายเซ็นผู้จ่ายเงิน</p>
                  <div class="h-16 border-b border-dashed border-gray-400 dark:border-gray-600"></div>
                  <p class="text-gray-600 dark:text-gray-300 mt-1">ผู้จ่ายเงิน / Payer</p>
                </div>
                
                <div class="md:w-1/3 text-center">
                  <p class="text-gray-600 dark:text-gray-300 mb-1">ลายเซ็นผู้อนุมัติ</p>
                  <div class="h-16 border-b border-dashed border-gray-400 dark:border-gray-600"></div>
                  <p class="text-gray-600 dark:text-gray-300 mt-1">ผู้อนุมัติ / Authorized</p>
                </div>
              </div>
            </div>
            
            <!-- Signature Area (for themes other than Thai) -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div>
                <div class="h-20 flex items-end justify-center border-b border-gray-300 dark:border-gray-700">
                  <svg v-if="receipt.theme === 'business'" xmlns="http://www.w3.org/2000/svg" class="h-16 w-32 opacity-50" viewBox="0 0 100 30">
                  <path d="M10,20 C15,10 25,15 30,20 C40,10 50,15 60,12 C70,15 80,18 90,15" stroke="currentColor" fill="none" stroke-width="2" /></svg>
                </div>
                <div class="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">{{ t('receipt.signature.authorized') }}</div>
              </div>
              
              <div>
                <div class="h-20 flex items-end justify-center border-b border-gray-300 dark:border-gray-700"></div>
                <div class="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">{{ t('receipt.signature.customer') }}</div>
              </div>
            </div>
            
            <!-- Premium Design Elements -->
            <div v-if="!['thai', 'minimal'].includes(receipt.theme)" class="relative">
              <div class="hidden md:block absolute bottom-full right-0 w-36 h-36 opacity-5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-full h-full">
                  <path fill-rule="evenodd" d="M12 1.5a.75.75 0 01.75.75V4.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM5.636 4.136a.75.75 0 011.06 0l1.592 1.591a.75.75 0 01-1.061 1.06l-1.591-1.59a.75.75 0 010-1.061zm12.728 0a.75.75 0 010 1.06l-1.591 1.592a.75.75 0 01-1.06-1.061l1.59-1.591a.75.75 0 011.061 0zm-6.364 5.864a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm4.5 4.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm-9 0a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm3.75 3.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm4.5 0a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm-9 0a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            
            <!-- Footer -->
            <div :class="{
              'mt-10 text-center text-gray-500 dark:text-gray-400 text-sm': true,
              'border-t border-gray-200 dark:border-gray-700 pt-8': receipt.theme !== 'thai'
            }">
              <div v-if="receipt.footer.thankyouMessage" 
                :class="{
                  'mb-4 text-lg font-medium text-gray-800 dark:text-gray-200': receipt.theme !== 'elegant',
                  'mb-4 text-lg font-medium text-gray-800 dark:text-gray-200 font-serif italic': receipt.theme === 'elegant'
                }">
                {{ t('receipt.footer.thankyou_message') }}
              </div>
              <p v-if="receipt.footer.text" class="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-line">
                {{ receipt.footer.text }}
              </p>
              <p v-if="receipt.footer.showPoweredBy" class="text-xs text-gray-500 dark:text-gray-400 mt-4">
                {{ t('app.title') }}
              </p>
              
              <!-- QR Code (for business purposes) -->
              <div v-if="receipt.theme === 'business'" class="mt-6 flex flex-col items-center">
                <div class="bg-white p-4 rounded-lg mb-2 shadow-sm">
                  <!-- Placeholder for QR code - in a real app you would generate this -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                    <rect x="0" y="0" width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="10" height="10" fill="black" />
                    <rect x="30" y="10" width="10" height="10" fill="black" />
                    <rect x="50" y="10" width="10" height="10" fill="black" />
                    <rect x="70" y="10" width="10" height="10" fill="black" />
                    <rect x="10" y="30" width="10" height="10" fill="black" />
                    <rect x="70" y="30" width="10" height="10" fill="black" />
                    <rect x="30" y="30" width="10" height="10" fill="black" />
                    <rect x="50" y="30" width="10" height="10" fill="black" />
                    <rect x="10" y="50" width="10" height="10" fill="black" />
                    <rect x="30" y="50" width="10" height="10" fill="black" />
                    <rect x="50" y="50" width="10" height="10" fill="black" />
                    <rect x="70" y="50" width="10" height="10" fill="black" />
                    <rect x="10" y="70" width="10" height="10" fill="black" />
                    <rect x="30" y="70" width="10" height="10" fill="black" />
                    <rect x="50" y="70" width="10" height="10" fill="black" />
                    <rect x="70" y="70" width="10" height="10" fill="black" />
                  </svg>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('receipt.scan_to_verify') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  body {
    margin: 0;
    padding: 0;
    background-color: white !important;
  }
  
  #receipt-to-export {
    padding: 20px;
    background-color: white !important;
    color: black !important;
  }
  
  /* Ensure text colors are visible on white background when printing */
  #receipt-to-export h1, 
  #receipt-to-export h2, 
  #receipt-to-export h3, 
  #receipt-to-export h4,
  #receipt-to-export p,
  #receipt-to-export span,
  #receipt-to-export div {
    color: black !important;
  }
  
  /* Make the gray backgrounds visible in print */
  .bg-gray-50, .dark\:bg-gray-700\/50 {
    background-color: #f9fafb !important;
  }
  
  /* Make borders visible */
  .border, .border-b, .border-t {
    border-color: #e5e7eb !important;
  }
  
  /* Fix table display in print */
  table {
    width: 100% !important;
    border-collapse: collapse !important;
  }
  
  table th {
    background-color: #f3f4f6 !important;
    color: #111827 !important;
    font-weight: 600 !important;
  }
  
  table tr:nth-child(even) {
    background-color: #f9fafb !important;
  }
  
  table td, table th {
    border-bottom: 1px solid #e5e7eb !important;
    padding: 8px !important;
  }
}
</style>
