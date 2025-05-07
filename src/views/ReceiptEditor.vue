<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useReceiptStore } from '@/stores/receipt'
import { useSettingsStore } from '@/stores/settings'
import CurrencySwitcher from '@/components/ui/CurrencySwitcher.vue'
import CsvImporter from '@/components/ui/CsvImporter.vue'
import Modal from '@/components/ui/Modal.vue'
import ReceiptThemeSelector from '@/components/receipt/ReceiptThemeSelector.vue'
import PaymentMethodSelector from '@/components/receipt/PaymentMethodSelector.vue'
import CSVImport from '@/components/receipt/CSVImport.vue'
import { 
  PlusCircleIcon, 
  TrashIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  TableCellsIcon,
  ExclamationCircleIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const receiptStore = useReceiptStore()
const settingsStore = useSettingsStore()
const activeTab = ref('business') // business, customer, items, summary, footer
const showCsvModal = ref(false)
const errors = ref({})
const numericErrors = ref({})

// URL validation
const validateUrl = (url) => {
  if (!url) return true // Allow empty URL
  try {
    // Check if it has protocol, if not add http:// for validation purposes
    const urlToCheck = url.match(/^https?:\/\//) ? url : `http://${url}`
    new URL(urlToCheck)
    return true
  } catch (e) {
    return false
  }
}

// Validation helper for numeric fields
const validateNumericField = (value, fieldName, index = null) => {
  // Check if the input contains non-numeric characters (allows for decimal point)
  if (value === '' || value === null || typeof value === 'undefined') {
    return null // Empty values are handled by required field validation
  }
  
  // If it's a string, try to check if it's numeric
  if (typeof value === 'string') {
    if (!/^-?\d*\.?\d*$/.test(value)) {
      return t('validation.numbersOnly', { field: fieldName })
    }
  }
  
  return null
}

// Handle numeric validation
const handleNumericInput = (value, field, index = null) => {
  const path = index !== null ? `${field}_${index}` : field
  
  if (index !== null) {
    // For item fields (price, quantity)
    const errorMessage = validateNumericField(value, t(`receipt.items.${field}`))
    if (errorMessage) {
      if (!numericErrors.value[index]) {
        numericErrors.value[index] = {}
      }
      numericErrors.value[index][field] = errorMessage
    } else {
      if (numericErrors.value[index]) {
        delete numericErrors.value[index][field]
        if (Object.keys(numericErrors.value[index]).length === 0) {
          delete numericErrors.value[index]
        }
      }
    }
  } else {
    // For other fields (tax rate, discount)
    const errorMessage = validateNumericField(value, field)
    if (errorMessage) {
      numericErrors.value[field] = errorMessage
    } else {
      delete numericErrors.value[field]
    }
  }
}

// Basic email validation
const validateEmail = (email) => {
  if (!email) return true // Allow empty email
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(String(email).toLowerCase())
}

// Phone number validation (basic)
const validatePhone = (phone) => {
  if (!phone) return true // Allow empty phone
  // Allow digits, spaces, parentheses, dashes, plus sign
  const re = /^[0-9\s\(\)\-\+]+$/
  return re.test(phone)
}

// Real-time validation handlers
const handleEmailInput = (value, field) => {
  const errorKey = field === 'shop' ? 'shopEmail' : 'customerEmail'
  
  if (!value) {
    delete errors.value[errorKey]
    return
  }
  
  if (!validateEmail(value)) {
    errors.value[errorKey] = t('validation.email')
  } else {
    delete errors.value[errorKey]
  }
}

const handlePhoneInput = (value, field) => {
  const errorKey = field === 'shop' ? 'shopPhone' : 'customerPhone'
  
  if (!value) {
    delete errors.value[errorKey]
    return
  }
  
  if (!validatePhone(value)) {
    errors.value[errorKey] = t('validation.phone')
  } else {
    delete errors.value[errorKey]
  }
}

const handleUrlInput = (value) => {
  if (!value) {
    delete errors.value.shopWebsite
    return
  }
  
  if (!validateUrl(value)) {
    errors.value.shopWebsite = t('validation.url')
  } else {
    delete errors.value.shopWebsite
  }
}

const handleRequiredInput = (value, fieldKey, fieldName) => {
  if (!value || !value.trim()) {
    errors.value[fieldKey] = t('validation.required', { field: fieldName })
  } else {
    delete errors.value[fieldKey]
  }
}

// Validation for required fields
const validateForm = () => {
  const newErrors = {}
  
  // Business validation
  if (!receiptStore.receipt.shop.name.trim()) {
    newErrors.shopName = t('validation.required', { field: t('receipt.shop.name') })
  }
  
  // Customer validation
  if (!receiptStore.receipt.customer.name.trim()) {
    newErrors.customerName = t('validation.required', { field: t('receipt.customer.name') })
  }
  
  // Email validation
  if (receiptStore.receipt.shop.email && !validateEmail(receiptStore.receipt.shop.email)) {
    newErrors.shopEmail = t('validation.email')
  }
  
  // Phone validation
  if (receiptStore.receipt.shop.phone && !validatePhone(receiptStore.receipt.shop.phone)) {
    newErrors.shopPhone = t('validation.phone')
  }
  
  // Website validation
  if (receiptStore.receipt.shop.website && !validateUrl(receiptStore.receipt.shop.website)) {
    newErrors.shopWebsite = t('validation.url')
  }
  
  // Customer email validation
  if (receiptStore.receipt.customer.email && !validateEmail(receiptStore.receipt.customer.email)) {
    newErrors.customerEmail = t('validation.email')
  }
  
  // Customer phone validation
  if (receiptStore.receipt.customer.phone && !validatePhone(receiptStore.receipt.customer.phone)) {
    newErrors.customerPhone = t('validation.phone')
  }
  
  // Items validation
  if (receiptStore.receipt.items.length === 0) {
    newErrors.items = t('validation.noItems')
  } else {
    const itemErrors = []
    
    receiptStore.receipt.items.forEach((item, index) => {
      const itemError = {}
      
      if (!item.name.trim()) {
        itemError.name = t('validation.required', { field: t('receipt.items.name') })
      }
      
      if (isNaN(item.quantity) || item.quantity <= 0) {
        itemError.quantity = t('validation.positiveNumber', { field: t('receipt.items.quantity') })
      }
      
      if (isNaN(item.price) || item.price < 0) {
        itemError.price = t('validation.nonNegativeNumber', { field: t('receipt.items.price') })
      }
      
      if (Object.keys(itemError).length > 0) {
        itemErrors[index] = itemError
      }
    })
    
    if (itemErrors.length > 0) {
      newErrors.itemErrors = itemErrors
    }
  }
  
  // Validate tax and discount
  if (isNaN(receiptStore.receipt.taxRate) || receiptStore.receipt.taxRate < 0 || receiptStore.receipt.taxRate > 100) {
    newErrors.taxRate = t('validation.range', { field: 'Tax Rate', min: 0, max: 100 })
  }
  
  if (isNaN(receiptStore.receipt.discount) || receiptStore.receipt.discount < 0) {
    newErrors.discount = t('validation.nonNegativeNumber', { field: 'Discount' })
  }
  
  if (receiptStore.receipt.discountType === 'percentage' && receiptStore.receipt.discount > 100) {
    newErrors.discount = t('validation.range', { field: 'Discount Percentage', min: 0, max: 100 })
  }
  
  // Check for numeric errors
  if (Object.keys(numericErrors.value).length > 0) {
    newErrors.numericErrors = true
  }
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handlePreview = () => {
  if (validateForm()) {
    receiptStore.saveToLocalStorage()
    router.push('/preview')
  } else {
    // If there are errors, navigate to the tab with errors
    if (errors.value.shopName) {
      activeTab.value = 'business'
    } else if (errors.value.customerName) {
      activeTab.value = 'customer'
    } else if (errors.value.items || errors.value.itemErrors) {
      activeTab.value = 'items'
    } else if (errors.value.taxRate || errors.value.discount) {
      activeTab.value = 'summary'
    }
    
    // Scroll to first error
    setTimeout(() => {
      const firstErrorElement = document.querySelector('.error-border')
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }
}

// Check if item has errors
const hasItemError = (index, field) => {
  return (errors.value.itemErrors && 
         errors.value.itemErrors[index] && 
         errors.value.itemErrors[index][field]) || 
         (numericErrors.value[index] && numericErrors.value[index][field])
}

// Get item error message
const getItemErrorMessage = (index, field) => {
  if (numericErrors.value[index] && numericErrors.value[index][field]) {
    return numericErrors.value[index][field]
  }
  
  if (hasItemError(index, field)) {
    return errors.value.itemErrors[index][field]
  }
  
  return null
}

// Check if numeric field has error
const hasNumericError = (field) => {
  return !!numericErrors.value[field]
}

// Get numeric error message
const getNumericErrorMessage = (field) => {
  return numericErrors.value[field]
}

const handleLogoUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      receiptStore.receipt.shop.logo = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const handleItemImageUpload = (event, index) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      receiptStore.receipt.items[index].image = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const addNewItem = () => {
  receiptStore.addItem()
}

const removeItem = (index) => {
  receiptStore.removeItem(index)
}

// Format currency 
const formatCurrency = (value) => {
  return new Intl.NumberFormat(settingsStore.language === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: settingsStore.currency
  }).format(value)
}

const importItemsFromCsv = (items) => {
  if (!items || !items.length) return;
  
  // Clear existing items
  receiptStore.receipt.items = [];
  
  // Add imported items
  items.forEach(item => {
    receiptStore.addItem({
      name: item.name || 'Unnamed Item',
      description: item.description || '',
      quantity: parseFloat(item.quantity) || 1,
      price: parseFloat(item.price) || 0,
      image: null
    });
  });
  
  // Show success message
  // Close modal
  showCsvModal.value = false;
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('actions.create') }}</h1>
        
        <!-- Currency Switcher -->
        <CurrencySwitcher />
      </div>
      
      <!-- Tab Navigation -->
      <div class="mb-6 flex flex-wrap border-b border-gray-200 dark:border-gray-700">
        <button 
          v-for="tab in [
            { id: 'business', name: t('receipt.shop.name'), error: !!errors.shopName },
            { id: 'customer', name: t('receipt.customer.name'), error: !!errors.customerName },
            { id: 'items', name: t('receipt.items.title'), error: !!errors.items || !!errors.itemErrors },
            { id: 'summary', name: t('receipt.summary.subtotal'), error: !!errors.taxRate || !!errors.discount },
            { id: 'footer', name: t('receipt.footer.title') }
          ]"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-2 text-sm font-medium relative"
          :class="activeTab === tab.id ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
        >
          {{ tab.name }}
          <span 
            v-if="tab.error" 
            class="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 flex h-3 w-3"
          >
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </button>
      </div>
      
      <!-- Business Information Tab -->
      <div v-show="activeTab === 'business'" class="space-y-6">
        <div>
          <label for="shop-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ t('receipt.shop.name') }} <span class="text-red-500">*</span>
          </label>
          <input 
            id="shop-name" 
            v-model="receiptStore.receipt.shop.name" 
            @input="handleRequiredInput(receiptStore.receipt.shop.name, 'shopName', t('receipt.shop.name'))"
            type="text" 
            class="form-input mt-1"
            :class="{'error-border border-red-500 focus:ring-red-500 focus:border-red-500': errors.shopName}"
          >
          <p v-if="errors.shopName" class="mt-1 text-sm text-red-600">{{ errors.shopName }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.shop.logo') }}</label>
          <div class="mt-1 flex items-center">
            <div v-if="receiptStore.receipt.shop.logo" class="mr-4">
              <img :src="receiptStore.receipt.shop.logo" alt="Shop logo" class="h-16 w-auto object-contain">
            </div>
            <label class="btn-secondary cursor-pointer">
              <span>{{ receiptStore.receipt.shop.logo ? 'Change Logo' : 'Upload Logo' }}</span>
              <input type="file" class="sr-only" @change="handleLogoUpload" accept="image/*">
            </label>
          </div>
        </div>
        
        <div>
          <label for="shop-address" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.shop.address') }}</label>
          <textarea 
            id="shop-address" 
            v-model="receiptStore.receipt.shop.address" 
            rows="3" 
            class="form-input mt-1"
          ></textarea>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="shop-phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.shop.phone') }}</label>
            <input 
              id="shop-phone" 
              v-model="receiptStore.receipt.shop.phone" 
              @input="handlePhoneInput(receiptStore.receipt.shop.phone, 'shop')"
              type="tel" 
              class="form-input mt-1"
              :class="{'error-border border-red-500 focus:ring-red-500 focus:border-red-500': errors.shopPhone}"
              placeholder="e.g., +66 89 123 4567"
            >
            <p v-if="errors.shopPhone" class="mt-1 text-sm text-red-600">{{ errors.shopPhone }}</p>
          </div>
          
          <div>
            <label for="shop-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.shop.email') }}</label>
            <input 
              id="shop-email" 
              v-model="receiptStore.receipt.shop.email" 
              @input="handleEmailInput(receiptStore.receipt.shop.email, 'shop')"
              type="email" 
              class="form-input mt-1"
              :class="{'error-border border-red-500 focus:ring-red-500 focus:border-red-500': errors.shopEmail}"
              placeholder="e.g., shop@example.com"
            >
            <p v-if="errors.shopEmail" class="mt-1 text-sm text-red-600">{{ errors.shopEmail }}</p>
          </div>
        </div>
        
        <div>
          <label for="shop-website" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.shop.website') }}</label>
          <input 
            id="shop-website" 
            v-model="receiptStore.receipt.shop.website" 
            @input="handleUrlInput(receiptStore.receipt.shop.website)"
            type="text" 
            class="form-input mt-1"
            :class="{'error-border border-red-500 focus:ring-red-500 focus:border-red-500': errors.shopWebsite}"
            placeholder="e.g., https://www.example.com"
          >
          <p v-if="errors.shopWebsite" class="mt-1 text-sm text-red-600">{{ t('validation.url') }}</p>
        </div>
      </div>
      
      <!-- Customer Information Tab -->
      <div v-show="activeTab === 'customer'" class="space-y-6">
        <div>
          <label for="receipt-number" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.number') }}</label>
          <input 
            id="receipt-number" 
            v-model="receiptStore.receipt.receiptDetails.number" 
            type="text" 
            class="form-input mt-1"
            placeholder="e.g., INV-2023-001"
          >
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="receipt-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.date') }}</label>
            <input 
              id="receipt-date" 
              v-model="receiptStore.receipt.receiptDetails.date" 
              type="date" 
              class="form-input mt-1"
            >
          </div>
          
          <div>
            <label for="receipt-due-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.due') }}</label>
            <input 
              id="receipt-due-date" 
              v-model="receiptStore.receipt.receiptDetails.dueDate" 
              type="date" 
              class="form-input mt-1"
            >
          </div>
        </div>
        
        <div>
          <label for="customer-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ t('receipt.customer.name') }} <span class="text-red-500">*</span>
          </label>
          <input 
            id="customer-name" 
            v-model="receiptStore.receipt.customer.name" 
            @input="handleRequiredInput(receiptStore.receipt.customer.name, 'customerName', t('receipt.customer.name'))"
            type="text" 
            class="form-input mt-1"
            :class="{'error-border border-red-500 focus:ring-red-500 focus:border-red-500': errors.customerName}"
          >
          <p v-if="errors.customerName" class="mt-1 text-sm text-red-600">{{ errors.customerName }}</p>
        </div>
        
        <div>
          <label for="customer-address" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.customer.address') }}</label>
          <textarea 
            id="customer-address" 
            v-model="receiptStore.receipt.customer.address" 
            rows="3" 
            class="form-input mt-1"
          ></textarea>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="customer-phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.customer.phone') }}</label>
            <input 
              id="customer-phone" 
              v-model="receiptStore.receipt.customer.phone" 
              @input="handlePhoneInput(receiptStore.receipt.customer.phone, 'customer')"
              type="tel" 
              class="form-input mt-1"
              :class="{'error-border border-red-500 focus:ring-red-500 focus:border-red-500': errors.customerPhone}"
              placeholder="e.g., +66 81 234 5678"
            >
            <p v-if="errors.customerPhone" class="mt-1 text-sm text-red-600">{{ errors.customerPhone }}</p>
          </div>
          
          <div>
            <label for="customer-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.customer.email') }}</label>
            <input 
              id="customer-email" 
              v-model="receiptStore.receipt.customer.email"
              @input="handleEmailInput(receiptStore.receipt.customer.email, 'customer')"
              type="email" 
              class="form-input mt-1"
              :class="{'error-border border-red-500 focus:ring-red-500 focus:border-red-500': errors.customerEmail}"
              placeholder="e.g., customer@example.com"
            >
            <p v-if="errors.customerEmail" class="mt-1 text-sm text-red-600">{{ errors.customerEmail }}</p>
          </div>
        </div>
      </div>
      
      <!-- Items Tab -->
      <div v-show="activeTab === 'items'" class="space-y-6">
        <div class="mb-4 flex flex-wrap gap-2">
          <button @click="addNewItem" type="button" class="btn inline-flex items-center">
            <PlusCircleIcon class="h-5 w-5 mr-2" />
            {{ t('receipt.items.add') }}
          </button>
          
          <button @click="showCsvModal = true" type="button" class="btn-secondary inline-flex items-center">
            <TableCellsIcon class="h-5 w-5 mr-2" />
            Import from CSV
          </button>
        </div>
        
        <div v-if="errors.items" class="bg-red-50 dark:bg-red-900/20 border border-red-400 rounded-md p-3 mb-4">
          <div class="flex">
            <ExclamationCircleIcon class="h-5 w-5 text-red-400 mr-2" />
            <span class="text-sm text-red-600 dark:text-red-400">{{ errors.items }}</span>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ t('receipt.items.title') }}</h3>
            <div class="flex space-x-2">
              <CSVImport ref="csvImportRef" />
              <button
                @click="receiptStore.addItem"
                class="group flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <PlusIcon class="h-5 w-5 mr-1 text-gray-500 group-hover:text-primary-500" />
                {{ t('receipt.items.add') }}
              </button>
            </div>
          </div>
          <div 
            v-for="(item, index) in receiptStore.receipt.items" 
            :key="index"
            class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            :class="{'error-border border-red-500': hasItemError(index, 'name') || hasItemError(index, 'quantity') || hasItemError(index, 'price')}"
          >
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ t('receipt.items.title') }} #{{ index + 1 }}</h3>
              <button @click="removeItem(index)" type="button" class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                <TrashIcon class="h-5 w-5" />
              </button>
            </div>
            
            <div class="space-y-4">
              <div>
                <label :for="`item-name-${index}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('receipt.items.name') }} <span class="text-red-500">*</span>
                </label>
                <input 
                  :id="`item-name-${index}`" 
                  v-model="item.name" 
                  @input="handleRequiredInput(item.name, `itemName_${index}`, t('receipt.items.name'))"
                  type="text" 
                  class="form-input mt-1"
                  :class="{'border-red-500 focus:ring-red-500 focus:border-red-500': hasItemError(index, 'name')}"
                >
                <p v-if="hasItemError(index, 'name')" class="mt-1 text-sm text-red-600">{{ getItemErrorMessage(index, 'name') }}</p>
              </div>
              
              <div>
                <label :for="`item-description-${index}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.items.description') }}</label>
                <textarea 
                  :id="`item-description-${index}`" 
                  v-model="item.description" 
                  rows="2" 
                  class="form-input mt-1"
                ></textarea>
              </div>
              
              <!-- Product Image Upload -->
              <div>
                <label :for="`item-image-${index}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Image</label>
                <div class="mt-1 flex items-center">
                  <div v-if="item.image" class="mr-4">
                    <img :src="item.image" alt="Product image" class="h-16 w-16 object-cover rounded border border-gray-200 dark:border-gray-700">
                  </div>
                  <label class="btn-secondary cursor-pointer text-sm">
                    <span>{{ item.image ? 'Change Image' : 'Add Image' }}</span>
                    <input 
                      :id="`item-image-${index}`" 
                      type="file" 
                      class="sr-only" 
                      @change="(e) => handleItemImageUpload(e, index)" 
                      accept="image/*"
                    >
                  </label>
                  <button 
                    v-if="item.image"
                    @click="item.image = null" 
                    type="button" 
                    class="ml-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon class="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label :for="`item-quantity-${index}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ t('receipt.items.quantity') }} <span class="text-red-500">*</span>
                  </label>
                  <input 
                    :id="`item-quantity-${index}`" 
                    v-model="item.quantity" 
                    type="text"
                    inputmode="numeric"
                    @input="handleNumericInput(item.quantity, 'quantity', index)"
                    class="form-input mt-1"
                    :class="{'border-red-500 focus:ring-red-500 focus:border-red-500': hasItemError(index, 'quantity')}"
                  >
                  <p v-if="hasItemError(index, 'quantity')" class="mt-1 text-sm text-red-600">{{ getItemErrorMessage(index, 'quantity') }}</p>
                </div>
                
                <div>
                  <label :for="`item-price-${index}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ t('receipt.items.price') }} <span class="text-red-500">*</span>
                  </label>
                  <div class="mt-1 relative rounded-md shadow-sm">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span class="text-gray-500 sm:text-sm">{{ settingsStore.currencySymbol }}</span>
                    </div>
                    <input 
                      :id="`item-price-${index}`" 
                      v-model="item.price" 
                      type="text"
                      inputmode="decimal"
                      @input="handleNumericInput(item.price, 'price', index)"
                      class="form-input pl-7"
                      :class="{'border-red-500 focus:ring-red-500 focus:border-red-500': hasItemError(index, 'price')}"
                    >
                  </div>
                  <p v-if="hasItemError(index, 'price')" class="mt-1 text-sm text-red-600">{{ getItemErrorMessage(index, 'price') }}</p>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between text-sm font-medium">
                  <span class="text-gray-700 dark:text-gray-300">{{ t('receipt.items.amount') }}</span>
                  <span class="text-gray-900 dark:text-white">{{ formatCurrency(item.quantity * item.price) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Summary Tab -->
      <div v-show="activeTab === 'summary'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="tax-rate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tax Rate (%)</label>
            <input 
              id="tax-rate" 
              v-model="receiptStore.receipt.taxRate" 
              type="text"
              inputmode="decimal"
              @input="handleNumericInput(receiptStore.receipt.taxRate, 'taxRate')" 
              class="form-input mt-1"
              :class="{'border-red-500 focus:ring-red-500 focus:border-red-500': errors.taxRate || hasNumericError('taxRate')}"
            >
            <p v-if="hasNumericError('taxRate')" class="mt-1 text-sm text-red-600">{{ getNumericErrorMessage('taxRate') }}</p>
            <p v-else-if="errors.taxRate" class="mt-1 text-sm text-red-600">{{ errors.taxRate }}</p>
          </div>
          
          <div>
            <label for="discount-type" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Type</label>
            <select 
              id="discount-type" 
              v-model="receiptStore.receipt.discountType" 
              class="form-input mt-1"
            >
              <option value="amount">Amount</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>
        </div>
        
        <div>
          <label for="discount" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Discount {{ receiptStore.receipt.discountType === 'percentage' ? '(%)' : '' }}
          </label>
          <div class="mt-1 relative rounded-md shadow-sm">
            <div v-if="receiptStore.receipt.discountType === 'amount'" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-500 sm:text-sm">{{ settingsStore.currencySymbol }}</span>
            </div>
            <input 
              id="discount" 
              v-model="receiptStore.receipt.discount"
              type="text"
              inputmode="decimal"
              @input="handleNumericInput(receiptStore.receipt.discount, 'discount')"
              class="form-input"
              :class="{ 
                'pl-7': receiptStore.receipt.discountType === 'amount',
                'border-red-500 focus:ring-red-500 focus:border-red-500': errors.discount || hasNumericError('discount') 
              }"
            >
          </div>
          <p v-if="hasNumericError('discount')" class="mt-1 text-sm text-red-600">{{ getNumericErrorMessage('discount') }}</p>
          <p v-else-if="errors.discount" class="mt-1 text-sm text-red-600">{{ errors.discount }}</p>
        </div>
        
        <div class="grid grid-cols-1 gap-6 mt-6">
          <!-- Receipt Theme -->
          <ReceiptThemeSelector v-model="receiptStore.receipt.theme" />
          
          <!-- Payment Method -->
          <PaymentMethodSelector v-model="receiptStore.receipt.paymentMethod" />

          <!-- Footer Settings -->
          <div>
            <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">{{ t('receipt.summary.total') }}</h3>
              
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('receipt.summary.subtotal') }}</span>
                  <span class="text-gray-900 dark:text-white">{{ formatCurrency(receiptStore.subtotal) }}</span>
                </div>
                
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('receipt.summary.discount') }}</span>
                  <span class="text-gray-900 dark:text-white">- {{ formatCurrency(receiptStore.discountValue) }}</span>
                </div>
                
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('receipt.summary.tax') }} ({{ receiptStore.receipt.taxRate }}%)</span>
                  <span class="text-gray-900 dark:text-white">{{ formatCurrency(receiptStore.taxValue) }}</span>
                </div>
                
                <div class="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <div class="flex justify-between font-medium">
                    <span class="text-gray-900 dark:text-white">{{ t('receipt.summary.total') }}</span>
                    <span class="text-primary-600 dark:text-primary-400 text-lg">{{ formatCurrency(receiptStore.total) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer & Notes Tab -->
      <div v-show="activeTab === 'footer'" class="space-y-6">
        <div>
          <label for="footer-text" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.footer.text') }}</label>
          <textarea 
            id="footer-text" 
            v-model="receiptStore.receipt.footer.text" 
            rows="2" 
            class="form-input mt-1"
            :placeholder="t('receipt.footer.text')"
          ></textarea>
        </div>
        
        <div class="flex items-center">
          <input 
            id="thank-you" 
            v-model="receiptStore.receipt.footer.thankyouMessage" 
            type="checkbox"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          >
          <label for="thank-you" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {{ t('receipt.footer.thankyou') }}
          </label>
        </div>
        
        <div class="flex items-center">
          <input 
            id="powered-by" 
            v-model="receiptStore.receipt.footer.showPoweredBy" 
            type="checkbox"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          >
          <label for="powered-by" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {{ t('receipt.footer.poweredBy') }}
          </label>
        </div>
        
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <label for="receipt-notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('receipt.notes.title') }}</label>
          <textarea 
            id="receipt-notes" 
            v-model="receiptStore.receipt.notes" 
            rows="4" 
            class="form-input mt-1"
            :placeholder="t('receipt.notes.placeholder')"
          ></textarea>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="mt-8 flex justify-between">
        <button
          type="button"
          class="btn-secondary"
          @click="activeTab = ['business', 'customer', 'items', 'summary', 'footer'][Math.max(0, ['business', 'customer', 'items', 'summary', 'footer'].indexOf(activeTab) - 1)]"
          :disabled="activeTab === 'business'"
        >
          {{ t('actions.back') }}
        </button>
        
        <div>
          <button
            v-if="activeTab === 'footer'"
            type="button"
            class="btn"
            @click="handlePreview"
          >
            {{ t('actions.preview') }}
          </button>
          
          <button
            v-else
            type="button"
            class="btn"
            @click="activeTab = ['business', 'customer', 'items', 'summary', 'footer'][Math.min(4, ['business', 'customer', 'items', 'summary', 'footer'].indexOf(activeTab) + 1)]"
          >
            {{ t('actions.next') }}
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- CSV Import Modal -->
  <Modal 
    :show="showCsvModal"
    title="Import Items from CSV"
    size="md"
    @close="showCsvModal = false"
  >
    <p class="text-gray-600 dark:text-gray-300 mb-4">
      Upload a CSV file to import items. The file should contain columns for item name, price, and quantity.
    </p>
    
    <CsvImporter @items-imported="importItemsFromCsv" />
    
    <template #footer>
      <div class="flex justify-end">
        <button @click="showCsvModal = false" class="btn-secondary">
          Cancel
        </button>
      </div>
    </template>
  </Modal>
</template>
