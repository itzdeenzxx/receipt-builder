<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useReceiptStore } from '@/stores/receipt'
import { useSettingsStore } from '@/stores/settings'
import { useHistoryStore } from '@/stores/history'
import html2pdf from 'html2pdf.js'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode.vue'
import Barcode from '@/components/ui/Barcode.vue'
import Toast from '@/components/ui/Toast.vue'
import {
  ArrowDownTrayIcon,
  QrCodeIcon,
  ShareIcon,
  DocumentIcon,
  PencilIcon,
  XMarkIcon,
  ClockIcon,
  LockClosedIcon,
  PrinterIcon,
  PhotoIcon
} from '@heroicons/vue/24/outline'
import BarcodeIcon from '@/components/icons/BarcodeIcon.vue'

const { t } = useI18n()
const router = useRouter()
const receiptStore = useReceiptStore()
const settingsStore = useSettingsStore()
const historyStore = useHistoryStore()

const isExporting = ref(false)
const isGeneratingQR = ref(false)
const showQrModal = ref(false)
const showShareModal = ref(false)
const showBarcodeModal = ref(false)
const qrValue = ref('')
const qrPassword = ref('')
const isQrProtected = ref(false)
const barcodeValue = ref('')
const barcodeFormat = ref('CODE128')

const activeActionCategory = ref('download')

const toastMessage = ref('')
const toastType = ref('success')
const showToast = ref(false)

const receiptDateFormatted = computed(() => {
  return new Date(receiptStore.receipt.receiptDetails.date).toLocaleDateString(
    settingsStore.language === 'th' ? 'th-TH' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )
})

const receiptDueDateFormatted = computed(() => {
  if (!receiptStore.receipt.receiptDetails.dueDate) return ''
  return new Date(receiptStore.receipt.receiptDetails.dueDate).toLocaleDateString(
    settingsStore.language === 'th' ? 'th-TH' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat(settingsStore.language === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: settingsStore.currency
  }).format(value)
}

const handleToastClose = () => {
  showToast.value = false
}

const saveToHistory = () => {
  historyStore.saveReceiptToHistory({
    ...receiptStore.receipt,
    total: receiptStore.total,
    subtotal: receiptStore.subtotal,
    taxValue: receiptStore.taxValue,
    discountValue: receiptStore.discountValue
  })
  toastMessage.value = 'Receipt saved to history successfully!'
  toastType.value = 'success'
  showToast.value = true
}

const exportToPDF = async () => {
  isExporting.value = true
  const element = document.getElementById('receipt-to-export')

  const options = {
    margin: 10,
    filename: `receipt-${receiptStore.receipt.receiptDetails.number}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }

  try {
    await html2pdf().set(options).from(element).save()
    saveToHistory()
    toastMessage.value = 'PDF exported successfully!'
    toastType.value = 'success'
    showToast.value = true
  } catch (error) {
    console.error('Failed to export PDF:', error)
    toastMessage.value = 'Failed to export PDF. Please try again.'
    toastType.value = 'error'
    showToast.value = true
  } finally {
    isExporting.value = false
  }
}

const exportToPNG = async () => {
  isExporting.value = true
  const isDarkMode = document.documentElement.classList.contains('dark')
  const element = document.getElementById('receipt-to-export')
  const originalPadding = element.style.padding

  try {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
    }

    element.style.backgroundColor = 'white'
    element.style.color = 'black'
    element.style.padding = '20px'

    await new Promise(resolve => setTimeout(resolve, 100))

    const canvas = await html2canvas(element, { 
      scale: 2,
      backgroundColor: 'white',
      useCORS: true,
      logging: false,
      removeContainer: true
    })

    const link = document.createElement('a')
    link.download = `receipt-${receiptStore.receipt.receiptDetails.number}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    saveToHistory()
    toastMessage.value = 'Image exported successfully!'
    toastType.value = 'success'
    showToast.value = true
  } catch (error) {
    console.error('Failed to export PNG:', error)
    toastMessage.value = 'Failed to export image. Please try again.'
    toastType.value = 'error'
    showToast.value = true
  } finally {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    }
    element.style.padding = originalPadding
    isExporting.value = false
  }
}

const printReceipt = () => {
  const originalBackground = document.body.style.backgroundColor
  const originalTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'

  try {
    document.documentElement.classList.remove('dark')
    document.body.style.backgroundColor = 'white'

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

    window.print()
    toastMessage.value = 'Print job sent successfully!'
    toastType.value = 'info' 
    showToast.value = true
  } finally {
    if (originalTheme === 'dark') {
      document.documentElement.classList.add('dark')
    }
    document.body.style.backgroundColor = originalBackground

    const printStyle = document.getElementById('print-style')
    if (printStyle) {
      printStyle.remove()
    }
  }
}

const generateBarcode = () => {
  barcodeValue.value = receiptStore.receipt.receiptDetails.number || 'INV-0000'
  barcodeFormat.value = 'CODE128'
  showBarcodeModal.value = true
}

const createNumericBarcodeValue = () => {
  const numericValue = receiptStore.receipt.receiptDetails.number
    .replace(/\D/g, '')
    .padStart(12, '0')
    .slice(0, 12)
  return numericValue
}

const generateQR = () => {
  isGeneratingQR.value = true
  const uuid = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2)
  const baseUrl = window.location.origin
  const baseQrValue = `${baseUrl}/view/${uuid}`

  if (isQrProtected.value && qrPassword.value) {
    qrValue.value = `${baseQrValue}?pwd=${encodeURIComponent(qrPassword.value)}`
    const savedReceipts = JSON.parse(localStorage.getItem('savedReceipts') || '{}')
    savedReceipts[uuid] = {
      ...receiptStore.receipt,
      subtotal: receiptStore.subtotal,
      discountValue: receiptStore.discountValue,
      taxValue: receiptStore.taxValue,
      total: receiptStore.total,
      passwordProtected: true,
      password: qrPassword.value
    }
    localStorage.setItem('savedReceipts', JSON.stringify(savedReceipts))
  } else {
    qrValue.value = baseQrValue
    const savedReceipts = JSON.parse(localStorage.getItem('savedReceipts') || '{}')
    savedReceipts[uuid] = {
      ...receiptStore.receipt,
      subtotal: receiptStore.subtotal,
      discountValue: receiptStore.discountValue,
      taxValue: receiptStore.taxValue,
      total: receiptStore.total,
      passwordProtected: false
    }
    localStorage.setItem('savedReceipts', JSON.stringify(savedReceipts))
  }

  isGeneratingQR.value = false
  showQrModal.value = true
}

const shareReceipt = () => {
  showShareModal.value = true
}

const shareVia = (platform) => {
  if (!qrValue.value) {
    generateQR()
  }

  let shareUrl = ''
  switch (platform) {
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${encodeURIComponent(`${t('receipt.receipt.title')}: ${qrValue.value}`)}`
      break
    case 'line':
      shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(qrValue.value)}`
      break
    case 'email':
      shareUrl = `mailto:?subject=${encodeURIComponent(t('receipt.receipt.title'))}&body=${encodeURIComponent(`${t('receipt.receipt.title')}: ${qrValue.value}`)}`
      break
  }

  if (shareUrl) {
    window.open(shareUrl, '_blank')
  }

  showShareModal.value = false
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(qrValue.value)
    alert('Link copied to clipboard')
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}

const editReceipt = () => {
  router.push('/editor')
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-5xl mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div class="flex items-center">
          <button @click="editReceipt" class="btn-secondary mr-4">
            <PencilIcon class="h-5 w-5 mr-2" />
            {{ t('actions.back') }}
          </button>
          
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('actions.preview') }}
          </h1>
        </div>
        
        <button @click="saveToHistory" class="btn-secondary">
          <ClockIcon class="h-5 w-5 mr-2" />
          Save to History
        </button>
      </div>
      
      <div class="flex flex-col lg:flex-row gap-6">
        <div class="lg:w-3/5 xl:w-2/3">
          <div class="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
            <div id="receipt-to-export" class="p-6 sm:p-8">
              <!-- Premium Border Design -->
              <div class="hidden md:block absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 print:hidden"></div>
              
              <!-- Receipt Header -->
              <div :class="{
                'border-b border-gray-200 dark:border-gray-700 pb-6 mb-6': true,
                'text-center': receiptStore.receipt.theme === 'minimal',
                'bg-blue-50 dark:bg-blue-900/20 -m-6 sm:-m-8 p-6 sm:p-8 mb-6': receiptStore.receipt.theme === 'modern',
                'bg-gray-50 dark:bg-gray-700/20 -m-6 sm:-m-8 p-6 sm:p-8 mb-6 text-center border-b-0 border-b-dashed': receiptStore.receipt.theme === 'elegant',
                'bg-slate-800 dark:bg-slate-700 -m-6 sm:-m-8 p-6 sm:p-8 mb-6 text-white': receiptStore.receipt.theme === 'business'
              }">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div :class="{
                    'mb-4 sm:mb-0': true,
                    'sm:text-left': receiptStore.receipt.theme === 'minimal',
                    'mx-auto': receiptStore.receipt.theme === 'elegant'
                  }">
                    <div v-if="receiptStore.receipt.shop.logo" class="mb-4 max-w-[200px]">
                      <img :src="receiptStore.receipt.shop.logo" alt="Shop logo" class="h-16 w-auto object-contain">
                    </div>
                    <h2 :class="{
                      'text-2xl font-bold': true,
                      'text-gray-900 dark:text-white': receiptStore.receipt.theme !== 'business',
                      'text-white': receiptStore.receipt.theme === 'business',
                      'font-serif italic': receiptStore.receipt.theme === 'elegant'
                    }">{{ receiptStore.receipt.shop.name || t('receipt.shop.name') }}</h2>
                    <p v-if="receiptStore.receipt.shop.address" :class="{
                      'text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                      'text-gray-300 mt-1 whitespace-pre-line': receiptStore.receipt.theme === 'business',
                      'text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line text-sm italic': receiptStore.receipt.theme === 'elegant'
                    }">{{ receiptStore.receipt.shop.address }}</p>
                    <div v-if="receiptStore.receipt.shop.phone || receiptStore.receipt.shop.email" :class="{
                      'mt-2 text-gray-600 dark:text-gray-300': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                      'mt-2 text-gray-300': receiptStore.receipt.theme === 'business',
                      'mt-2 text-gray-600 dark:text-gray-300 text-sm italic': receiptStore.receipt.theme === 'elegant'
                    }">
                      <p v-if="receiptStore.receipt.shop.phone">{{ receiptStore.receipt.shop.phone }}</p>
                      <p v-if="receiptStore.receipt.shop.email">{{ receiptStore.receipt.shop.email }}</p>
                      <p v-if="receiptStore.receipt.shop.website">{{ receiptStore.receipt.shop.website }}</p>
                    </div>
                  </div>
                  
                  <div :class="{
                    'text-right': receiptStore.receipt.theme !== 'minimal' && receiptStore.receipt.theme !== 'elegant',
                    'text-center mt-4': receiptStore.receipt.theme === 'minimal',
                    'text-center mx-auto mt-4': receiptStore.receipt.theme === 'elegant',
                    'bg-slate-700 p-3 rounded': receiptStore.receipt.theme === 'business'
                  }">
                    <h2 :class="{
                      'text-2xl font-bold': true,
                      'text-primary-600 dark:text-primary-400': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                      'text-slate-200': receiptStore.receipt.theme === 'business',
                      'font-serif italic text-gray-800 dark:text-gray-200': receiptStore.receipt.theme === 'elegant'
                    }">{{ t('receipt.title') }}</h2>
                    <p :class="{
                      'text-gray-600 dark:text-gray-300': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                      'text-gray-300': receiptStore.receipt.theme === 'business',
                      'text-sm italic text-gray-600 dark:text-gray-300': receiptStore.receipt.theme === 'elegant'
                    }"># {{ receiptStore.receipt.receiptDetails.number }}</p>
                    <p :class="{
                      'text-gray-600 dark:text-gray-300': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                      'text-gray-300': receiptStore.receipt.theme === 'business',
                      'text-sm italic text-gray-600 dark:text-gray-300': receiptStore.receipt.theme === 'elegant'
                    }">{{ t('receipt.date') }}: {{ receiptDateFormatted }}</p>
                    <p v-if="receiptStore.receipt.receiptDetails.dueDate" :class="{
                      'text-gray-600 dark:text-gray-300': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                      'text-gray-300': receiptStore.receipt.theme === 'business',
                      'text-sm italic text-gray-600 dark:text-gray-300': receiptStore.receipt.theme === 'elegant'
                    }">{{ t('receipt.due') }}: {{ receiptDueDateFormatted }}</p>
                  </div>
                </div>
              </div>
              
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <!-- Customer Information -->
                <div v-if="receiptStore.receipt.customer.name || receiptStore.receipt.customer.address" class="lg:col-span-2">
                  <h3 :class="{
                    'text-lg font-medium text-gray-900 dark:text-white mb-2': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                    'text-slate-700 dark:text-slate-300 uppercase text-sm tracking-wider mb-2': receiptStore.receipt.theme === 'business',
                    'font-serif italic text-center border-b border-dashed border-gray-200 dark:border-gray-700 pb-2 mb-2': receiptStore.receipt.theme === 'elegant'
                  }">{{ t('receipt.customer.name') }}</h3>
                  <div :class="{
                    'bg-gray-50 dark:bg-gray-700/50 rounded p-4': receiptStore.receipt.theme !== 'elegant' && receiptStore.receipt.theme !== 'business',
                    'p-4 border-l-4 border-gray-200 dark:border-gray-600': receiptStore.receipt.theme === 'elegant',
                    'bg-slate-100 dark:bg-slate-800 p-4 border-l-2 border-slate-800 dark:border-slate-300': receiptStore.receipt.theme === 'business'
                  }">
                    <p :class="{
                      'font-medium text-gray-900 dark:text-white': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                      'font-medium text-slate-700 dark:text-slate-200': receiptStore.receipt.theme === 'business',
                      'font-medium font-serif text-lg text-gray-900 dark:text-white': receiptStore.receipt.theme === 'elegant'
                    }">{{ receiptStore.receipt.customer.name }}</p>
                    <p v-if="receiptStore.receipt.customer.address" :class="{
                      'text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                      'text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-line': receiptStore.receipt.theme === 'business',
                      'text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line italic': receiptStore.receipt.theme === 'elegant'
                    }">{{ receiptStore.receipt.customer.address }}</p>
                    <div v-if="receiptStore.receipt.customer.phone || receiptStore.receipt.customer.email" :class="{
                      'mt-2 text-gray-600 dark:text-gray-300': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                      'mt-2 text-slate-600 dark:text-slate-400': receiptStore.receipt.theme === 'business',
                      'mt-2 text-gray-600 dark:text-gray-300 italic text-sm': receiptStore.receipt.theme === 'elegant'
                    }">
                      <p v-if="receiptStore.receipt.customer.phone">{{ receiptStore.receipt.customer.phone }}</p>
                      <p v-if="receiptStore.receipt.customer.email">{{ receiptStore.receipt.customer.email }}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Payment Summary Box -->
                <div class="lg:col-span-1">
                  <h3 :class="{
                    'text-lg font-medium text-gray-900 dark:text-white mb-2': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                    'text-slate-700 dark:text-slate-300 uppercase text-sm tracking-wider mb-2': receiptStore.receipt.theme === 'business',
                    'font-serif italic text-center border-b border-dashed border-gray-200 dark:border-gray-700 pb-2 mb-2': receiptStore.receipt.theme === 'elegant'
                  }">{{ t('payment.title') }}</h3>
                  <div :class="{
                    'bg-gray-50 dark:bg-gray-700/50 rounded p-4': receiptStore.receipt.theme !== 'elegant' && receiptStore.receipt.theme !== 'business',
                    'p-4 border-r-4 border-gray-200 dark:border-gray-600': receiptStore.receipt.theme === 'elegant',
                    'bg-slate-100 dark:bg-slate-800 p-4 border-l-2 border-slate-800 dark:border-slate-300': receiptStore.receipt.theme === 'business'
                  }">
                    <div class="flex justify-between py-1">
                      <span class="text-gray-600 dark:text-gray-300">{{ t('payment.status') }}:</span>
                      <span class="font-medium text-green-600 dark:text-green-400">{{ t('payment.paid') }}</span>
                    </div>
                    <div class="flex justify-between py-1">
                      <span class="text-gray-600 dark:text-gray-300">{{ t('payment.method') }}:</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ t(`payment.${receiptStore.receipt.paymentMethod || 'cash'}`) }}</span>
                    </div>
                    <div class="flex justify-between py-1">
                      <span class="text-gray-600 dark:text-gray-300">{{ t('receipt.date') }}:</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ receiptDateFormatted }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mb-6">
                <h3 :class="{
                  'text-lg font-medium text-gray-900 dark:text-white mb-3': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                  'text-slate-700 dark:text-slate-300 uppercase text-sm tracking-wider mb-3': receiptStore.receipt.theme === 'business',
                  'font-serif italic text-center border-b border-dashed border-gray-200 dark:border-gray-700 pb-2 mb-3': receiptStore.receipt.theme === 'elegant'
                }">{{ t('receipt.items.title') }}</h3>
                
                <div class="overflow-x-auto bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                  <table :class="{ 
                    'w-full border-collapse': true,
                    'border border-gray-200 dark:border-gray-700': receiptStore.receipt.theme === 'business'
                  }">
                    <thead>
                      <tr :class="{
                        'bg-gray-50 dark:bg-gray-700/50 text-left': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                        'border-t border-b border-dashed border-gray-200 dark:border-gray-700 text-left': receiptStore.receipt.theme === 'elegant',
                        'bg-slate-200 dark:bg-slate-700 uppercase text-xs tracking-wider text-left': receiptStore.receipt.theme === 'business'
                      }">
                        <th class="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">#</th>
                        <th class="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{{ t('receipt.items.name') }}</th>
                        <th class="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium text-right">{{ t('receipt.items.quantity') }}</th>
                        <th class="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium text-right">{{ t('receipt.items.price') }}</th>
                        <th class="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium text-right">{{ t('receipt.items.amount') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in receiptStore.receipt.items" :key="index" :class="{
                        'border-b': true,
                        'border-gray-200 dark:border-gray-700': receiptStore.receipt.theme !== 'elegant',
                        'border-dashed': receiptStore.receipt.theme === 'elegant',
                        'hover:bg-gray-50 dark:hover:bg-gray-750': true
                      }">
                        <td class="px-4 py-4 text-gray-900 dark:text-white">{{ index + 1 }}</td>
                        <td class="px-4 py-4 text-gray-900 dark:text-white">
                          <div class="flex items-center">
                            <div v-if="item.image" class="flex-shrink-0 mr-3">
                              <img :src="item.image" :alt="item.name" class="h-10 w-10 object-cover rounded-md border border-gray-200 dark:border-gray-700">
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
              <div class="flex flex-col md:flex-row md:justify-end mb-6">
                <div class="md:w-1/2 lg:w-2/5">
                  <div :class="{
                    'bg-gray-50 dark:bg-gray-700/50 rounded p-5': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                    'p-5 border border-dashed border-gray-200 dark:border-gray-700': receiptStore.receipt.theme === 'elegant',
                    'bg-slate-100 dark:bg-slate-800 p-5': receiptStore.receipt.theme === 'business'
                  }">
                    <div class="flex justify-between py-2">
                      <span :class="{
                        'text-gray-600 dark:text-gray-300': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                        'text-slate-600 dark:text-slate-400': receiptStore.receipt.theme === 'business',
                        'text-gray-600 dark:text-gray-300 font-serif italic': receiptStore.receipt.theme === 'elegant'
                      }">{{ t('receipt.summary.subtotal') }}</span>
                      <span :class="{
                        'text-gray-900 dark:text-white': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                        'text-slate-700 dark:text-slate-200': receiptStore.receipt.theme === 'business',
                        'text-gray-900 dark:text-white font-serif': receiptStore.receipt.theme === 'elegant'
                      }">{{ formatCurrency(receiptStore.subtotal) }}</span>
                    </div>
                    <div v-if="receiptStore.discountValue > 0" class="flex justify-between py-2">
                      <span :class="{
                        'text-gray-600 dark:text-gray-300': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                        'text-slate-600 dark:text-slate-400': receiptStore.receipt.theme === 'business',
                        'text-gray-600 dark:text-gray-300 font-serif italic': receiptStore.receipt.theme === 'elegant'
                      }">
                        {{ t('receipt.summary.discount') }}
                        <span v-if="receiptStore.receipt.discountType === 'percentage'">
                          ({{ receiptStore.receipt.discount }}%)
                        </span>
                      </span>
                      <span :class="{
                        'text-gray-900 dark:text-white': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                        'text-slate-700 dark:text-slate-200': receiptStore.receipt.theme === 'business',
                        'text-gray-900 dark:text-white font-serif': receiptStore.receipt.theme === 'elegant'
                      }">- {{ formatCurrency(receiptStore.discountValue) }}</span>
                    </div>
                    <div v-if="receiptStore.receipt.taxRate > 0" class="flex justify-between py-2">
                      <span :class="{
                        'text-gray-600 dark:text-gray-300': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                        'text-slate-600 dark:text-slate-400': receiptStore.receipt.theme === 'business',
                        'text-gray-600 dark:text-gray-300 font-serif italic': receiptStore.receipt.theme === 'elegant'
                      }">{{ t('receipt.summary.tax') }} ({{ receiptStore.receipt.taxRate }}%)</span>
                      <span :class="{
                        'text-gray-900 dark:text-white': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                        'text-slate-700 dark:text-slate-200': receiptStore.receipt.theme === 'business',
                        'text-gray-900 dark:text-white font-serif': receiptStore.receipt.theme === 'elegant'
                      }">{{ formatCurrency(receiptStore.taxValue) }}</span>
                    </div>
                    <div :class="{
                      'flex justify-between pt-2 mt-2 border-t border-gray-200 dark:border-gray-600': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                      'flex justify-between pt-2 mt-2 border-t border-dashed border-gray-200 dark:border-gray-700': receiptStore.receipt.theme === 'elegant',
                      'flex justify-between pt-2 mt-2 border-t-2 border-slate-300 dark:border-slate-600': receiptStore.receipt.theme === 'business'
                    }">
                      <span :class="{
                        'text-lg font-medium text-gray-900 dark:text-white': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                        'text-lg font-bold text-slate-800 dark:text-slate-200': receiptStore.receipt.theme === 'business',
                        'text-lg font-serif italic font-medium text-gray-900 dark:text-white': receiptStore.receipt.theme === 'elegant'
                      }">{{ t('receipt.summary.total') }}</span>
                      <span :class="{
                        'text-lg font-medium text-primary-600 dark:text-primary-400': receiptStore.receipt.theme !== 'business' && receiptStore.receipt.theme !== 'elegant',
                        'text-lg font-bold text-slate-800 dark:text-slate-200': receiptStore.receipt.theme === 'business',
                        'text-lg font-serif font-medium text-primary-600 dark:text-primary-400': receiptStore.receipt.theme === 'elegant'
                      }">{{ formatCurrency(receiptStore.total) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="receiptStore.receipt.notes" class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div class="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                  {{ receiptStore.receipt.notes }}
                </div>
              </div>
              
              <div v-if="receiptStore.receipt.theme === 'thai'" class="border-t border-gray-200 dark:border-gray-700 pt-6">
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
              
              <div :class="{
                'mt-8 text-center text-sm': true,
                'border-t border-gray-200 dark:border-gray-700 pt-6': receiptStore.receipt.theme !== 'thai'
              }">
                <p v-if="receiptStore.receipt.footer.thankyouMessage" class="text-gray-600 dark:text-gray-400 mb-2">
                  Thank you for your business!
                </p>
                <p v-if="receiptStore.receipt.footer.text" class="text-gray-600 dark:text-gray-400 mb-2 whitespace-pre-line">
                  {{ receiptStore.receipt.footer.text }}
                </p>
                <p v-if="receiptStore.receipt.footer.showPoweredBy" class="text-gray-500 dark:text-gray-400 text-xs">
                  {{ t('app.title') }}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="lg:w-2/5 xl:w-1/3">
          <div class="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden sticky top-4">
            <div class="flex border-b border-gray-200 dark:border-gray-700">
              <button 
                @click="activeActionCategory = 'download'" 
                class="flex-1 py-4 px-2 text-sm font-medium text-center transition-colors"
                :class="activeActionCategory === 'download' ? 
                  'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500' : 
                  'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
              >
                Download
              </button>
              <button 
                @click="activeActionCategory = 'share'" 
                class="flex-1 py-4 px-2 text-sm font-medium text-center transition-colors"
                :class="activeActionCategory === 'share' ? 
                  'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500' : 
                  'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
              >
                Share
              </button>
              <button 
                @click="activeActionCategory = 'tools'" 
                class="flex-1 py-4 px-2 text-sm font-medium text-center transition-colors"
                :class="activeActionCategory === 'tools' ? 
                  'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500' : 
                  'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
              >
                Tools
              </button>
            </div>
            
            <div v-show="activeActionCategory === 'download'" class="p-5 space-y-4">
              <button 
                @click="exportToPDF" 
                class="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                :disabled="isExporting"
              >
                <div class="flex items-center">
                  <div class="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg mr-3">
                    <DocumentIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div class="text-left">
                    <p class="font-medium text-gray-900 dark:text-white">{{ t('actions.download.pdf') }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Save as a PDF document</p>
                  </div>
                </div>
                <ArrowDownTrayIcon class="h-5 w-5 text-gray-400" />
              </button>
              
              <button 
                @click="exportToPNG" 
                class="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                :disabled="isExporting"
              >
                <div class="flex items-center">
                  <div class="bg-green-100 dark:bg-green-900 p-2 rounded-lg mr-3">
                    <PhotoIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div class="text-left">
                    <p class="font-medium text-gray-900 dark:text-white">{{ t('actions.download.png') }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Save as an image file</p>
                  </div>
                </div>
                <ArrowDownTrayIcon class="h-5 w-5 text-gray-400" />
              </button>
              
              <button 
                @click="printReceipt" 
                class="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div class="flex items-center">
                  <div class="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-3">
                    <PrinterIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div class="text-left">
                    <p class="font-medium text-gray-900 dark:text-white">{{ t('actions.print') }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Print physical copy</p>
                  </div>
                </div>
                <ArrowDownTrayIcon class="h-5 w-5 text-gray-400" />
              </button>
              
              <div v-if="isExporting" class="flex items-center justify-center py-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Processing...</span>
              </div>
            </div>
            
            <div v-show="activeActionCategory === 'share'" class="p-5 space-y-4">
              <button 
                @click="generateQR" 
                class="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div class="flex items-center">
                  <div class="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg mr-3">
                    <QrCodeIcon class="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div class="text-left">
                    <p class="font-medium text-gray-900 dark:text-white">{{ t('actions.share.qr') }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Generate a scannable QR code</p>
                  </div>
                </div>
                <ShareIcon class="h-5 w-5 text-gray-400" />
              </button>
              
              <button 
                @click="shareReceipt" 
                class="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div class="flex items-center">
                  <div class="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-3">
                    <ShareIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div class="text-left">
                    <p class="font-medium text-gray-900 dark:text-white">{{ t('actions.share.title') }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Share via platforms</p>
                  </div>
                </div>
                <ShareIcon class="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div v-show="activeActionCategory === 'tools'" class="p-5 space-y-4">
              <button 
                @click="generateBarcode" 
                class="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div class="flex items-center">
                  <div class="bg-amber-100 dark:bg-amber-900 p-2 rounded-lg mr-3">
                    <BarcodeIcon class="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div class="text-left">
                    <p class="font-medium text-gray-900 dark:text-white">Barcode</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Generate a barcode</p>
                  </div>
                </div>
                <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div class="mb-3">
                  <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Receipt Details</h3>
                </div>
                
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Receipt #:</span>
                    <span class="text-gray-900 dark:text-white">{{ receiptStore.receipt.receiptDetails.number }}</span>
                  </div>
                  
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Date:</span>
                    <span class="text-gray-900 dark:text-white">{{ receiptDateFormatted }}</span>
                  </div>
                  
                  <div v-if="receiptStore.receipt.receiptDetails.dueDate" class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Due Date:</span>
                    <span class="text-gray-900 dark:text-white">{{ receiptDueDateFormatted }}</span>
                  </div>
                  
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Total:</span>
                    <span class="font-medium text-primary-600 dark:text-primary-400">{{ formatCurrency(receiptStore.total) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showQrModal" class="fixed inset-0 flex items-center justify-center z-50 p-4">
    <div class="absolute inset-0 bg-black bg-opacity-70" @click="showQrModal = false"></div>
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 z-10 transform transition-all">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <QrCodeIcon class="h-6 w-6 mr-2 text-purple-600 dark:text-purple-400" />
          {{ t('actions.share.qr') }}
        </h3>
        <button @click="showQrModal = false" class="text-gray-400 hover:text-gray-500 bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
      
      <div v-if="!qrValue">
        <div class="mb-6">
          <div class="flex items-center mb-5">
            <input 
              id="password-protect" 
              v-model="isQrProtected" 
              type="checkbox"
              class="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            >
            <label for="password-protect" class="ml-3 block text-base text-gray-700 dark:text-gray-300">
              Password protect this receipt
            </label>
          </div>
          
          <div v-if="isQrProtected" class="mb-5">
            <label for="qr-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input 
              id="qr-password" 
              v-model="qrPassword" 
              type="password"
              class="form-input mt-1 w-full"
              placeholder="Enter a password"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This password will be required to view the receipt
            </p>
          </div>
          
          <button @click="generateQR" class="btn w-full py-3">
            Generate QR Code
          </button>
        </div>
      </div>
      
      <div v-else>
        <div class="flex justify-center mb-6 bg-white p-6 rounded-lg shadow-inner mx-auto max-w-[240px]">
          <QRCode :value="qrValue" :size="200" level="M" class="dark:opacity-90" />
        </div>
        
        <div class="text-center mb-6">
          <p v-if="isQrProtected" class="text-sm flex items-center justify-center text-primary-600 dark:text-primary-400 mb-2">
            <LockClosedIcon class="h-4 w-4 inline mr-1" />
            This QR code is password protected
          </p>
          
          <p class="text-gray-600 dark:text-gray-300 text-sm mb-2">Scan or share this QR code to view the receipt</p>
          
          <div class="relative mt-3">
            <input 
              type="text" 
              :value="qrValue" 
              readonly
              class="form-input w-full pr-20 text-gray-500 bg-gray-50 dark:bg-gray-700"
            />
            <button 
              @click="copyToClipboard" 
              class="absolute right-0 top-0 bottom-0 px-4 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 border-l border-gray-300 dark:border-gray-500"
            >
              Copy
            </button>
          </div>
        </div>
        
        <div class="flex space-x-3">
          <button @click="showQrModal = false" class="btn-secondary flex-1">
            Close
          </button>
          <button @click="shareReceipt" class="btn flex-1">
            <ShareIcon class="h-4 w-4 mr-2" />
            Share
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <div v-if="showBarcodeModal" class="fixed inset-0 flex items-center justify-center z-50 p-4">
    <div class="absolute inset-0 bg-black bg-opacity-70" @click="showBarcodeModal = false"></div>
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 z-10">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <BarcodeIcon class="h-6 w-6 mr-2 text-amber-600 dark:text-amber-400" />
          Barcode Generator
        </h3>
        <button @click="showBarcodeModal = false" class="text-gray-400 hover:text-gray-500 bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
      
      <div class="flex justify-center mb-6 bg-white p-4 rounded-lg shadow-inner">
        <Barcode :value="barcodeValue" :format="barcodeFormat" />
      </div>
      
      <div class="space-y-4">
        <div>
          <label for="barcode-format" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
          <div class="mt-1">
            <select 
              id="barcode-format" 
              v-model="barcodeFormat" 
              class="form-input mt-1 w-full"
            >
              <option value="CODE128">Code 128 (works with any text)</option>
              <option value="CODE39">Code 39 (alphanumeric only)</option>
              <option value="EAN13">EAN-13 (12-13 digits only)</option>
              <option value="UPC">UPC (11-12 digits only)</option>
              <option value="EAN8">EAN-8 (7-8 digits only)</option>
              <option value="ITF14">ITF-14 (14 digits only)</option>
            </select>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Note: Only CODE128 format can handle any text. Other formats have specific requirements.
            </p>
          </div>
        </div>
        
        <div v-if="barcodeFormat !== 'CODE128'" class="mt-4">
          <label for="barcode-value-numeric" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom {{ barcodeFormat }} Value
          </label>
          <div class="mt-1">
            <input 
              id="barcode-value-numeric" 
              v-model="barcodeValue" 
              type="text" 
              class="form-input w-full"
              :placeholder="barcodeFormat === 'EAN13' ? '590123412345' : 
                        barcodeFormat === 'EAN8' ? '9638527' : 
                        barcodeFormat === 'UPC' ? '123456789012' :
                        barcodeFormat === 'ITF14' ? '12345678901234' : 'BARCODE'"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div v-if="showShareModal" class="fixed inset-0 flex items-center justify-center z-50 p-4">
    <div class="absolute inset-0 bg-black bg-opacity-70" @click="showShareModal = false"></div>
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 z-10">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <ShareIcon class="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
          {{ t('actions.share.title') }}
        </h3>
        <button @click="showShareModal = false" class="text-gray-400 hover:text-gray-500 bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
      
      <div class="grid grid-cols-2 gap-4 mb-6">
        <button @click="shareVia('whatsapp')" class="flex flex-col items-center justify-center p-4 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors">
          <svg class="h-8 w-8 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span class="text-sm font-medium">WhatsApp</span>
        </button>
        
        <button @click="shareVia('line')" class="flex flex-col items-center justify-center p-4 rounded-lg bg-green-400 hover:bg-green-500 text-white transition-colors">
          <svg class="h-8 w-8 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.819 4.262 8.856 10.005 9.608 1.396.301.842 3.301.842 3.301 0 .3.259.501.456.353.298-.151 7.238-4.156 10.205-6.859 1.527-1.454 2.492-3.308 2.492-6.403zm-17.114 1.294c-.3 0-.538-.243-.538-.544v-3.543c0-.3.239-.543.538-.543s.538.243.538.543v3.543c0 .3-.239.544-.538.544zm4.655-3.543c0-.3-.239-.543-.538-.543s-.538.243-.538.543v2.148l-2.072-2.595c-.104-.13-.259-.196-.415-.196-.156 0-.311.066-.415.196-.104.131-.156.263-.156.396v3.543c0 .3.239.544.538.544s.538-.244.538-.544v-2.148l2.072 2.595c.104.13.259.196.415.196.156 0 .311-.066.415-.196.104-.131.156-.263.156-.396v-3.543zm1.845-.001c0-.3-.239-.543-.538-.543h-1.076c-.3 0-.538.243-.538.543v3.544c0 .3.239.544.538.544h1.076c.3 0 .538-.244.538-.544v-3.544zm3.922-.214h-1.076v.757h1.076v-.757zm0 1.758h-1.076v1.999c0 .3-.239.544-.538.544s-.538-.244-.538-.544v-1.999h-1.076c-.3 0-.538-.243-.538-.543 0-.3.239-.544.538-.544h2.152c.3 0 .538.244.538.544 0 .3-.239.543-.538.543z" />
          </svg>
          <span class="text-sm font-medium">LINE</span>
        </button>
        
        <button @click="shareVia('email')" class="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors">
          <svg class="h-8 w-8 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 .02c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6.99 6.98l-6.99 5.666-6.991-5.666h13.981zm.01 10h-14v-8.505l7 5.673 7-5.672v8.504z"/>
          </svg>
          <span class="text-sm font-medium">Email</span>
        </button>
        
        <button @click="generateQR" class="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors">
          <QrCodeIcon class="h-8 w-8 mb-2" />
          <span class="text-sm font-medium">QR Code</span>
        </button>
      </div>
      
      <div class="mt-4">
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">Copy receipt link</p>
        <div class="relative">
          <input 
            type="text" 
            :value="qrValue || 'Generate a QR code first'" 
            readonly
            class="form-input w-full pr-20 text-gray-500 bg-gray-50 dark:bg-gray-700"
            :disabled="!qrValue"
          />
          <button 
            @click="copyToClipboard" 
            class="absolute right-0 top-0 bottom-0 px-4 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 border-l border-gray-300 dark:border-gray-500"
            :disabled="!qrValue"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <Toast
    :show="showToast"
    :message="toastMessage"
    :type="toastType"
    position="bottom-right"
    :duration="3000"
    @close="handleToastClose"
  />
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
  
  #receipt-to-export h1, 
  #receipt-to-export h2, 
  #receipt-to-export h3, 
  #receipt-to-export h4,
  #receipt-to-export p,
  #receipt-to-export span,
  #receipt-to-export div {
    color: black !important;
  }
  
  .bg-gray-50, .dark\:bg-gray-700\/50 {
    background-color: #f9fafb !important;
  }
  
  .border, .border-b, .border-t {
    border-color: #e5e7eb !important;
  }
}

.btn, .btn-secondary {
  transition: all 0.2s ease-in-out;
}

.action-item {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>

