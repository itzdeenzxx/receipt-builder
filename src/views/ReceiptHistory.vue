<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHistoryStore } from '@/stores/history'
import { useSettingsStore } from '@/stores/settings'
import { 
  TrashIcon, 
  ArrowPathIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import Modal from '@/components/ui/Modal.vue'

const { t } = useI18n()
const router = useRouter()
const historyStore = useHistoryStore()
const settingsStore = useSettingsStore()

const showConfirmModal = ref(false)
const selectedReceiptId = ref(null)
const modalAction = ref('') // 'delete' or 'clear'

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(
    settingsStore.language === 'th' ? 'th-TH' : 'en-US',
    { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  )
}

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat(settingsStore.language === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: settingsStore.currency
  }).format(value)
}

// Load receipt from history
const loadReceipt = (id) => {
  historyStore.loadReceiptFromHistory(id)
  router.push('/preview')
}

// Open delete confirmation dialog
const confirmDelete = (id) => {
  selectedReceiptId.value = id
  modalAction.value = 'delete'
  showConfirmModal.value = true
}

// Open clear all history confirmation dialog
const confirmClearAll = () => {
  modalAction.value = 'clear'
  showConfirmModal.value = true
}

// Delete receipt from history
const deleteReceipt = () => {
  if (modalAction.value === 'delete' && selectedReceiptId.value) {
    historyStore.deleteReceiptFromHistory(selectedReceiptId.value)
    selectedReceiptId.value = null
  } else if (modalAction.value === 'clear') {
    historyStore.clearHistory()
  }
  
  showConfirmModal.value = false
}

// Go back to home
const goHome = () => {
  router.push('/')
}

// Receipts with empty state message
const hasReceipts = computed(() => historyStore.receiptHistory.length > 0)
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Receipt History
        </h1>
        
        <div class="flex items-center space-x-2">
          <button 
            v-if="hasReceipts"
            @click="confirmClearAll" 
            class="btn-secondary text-sm"
          >
            Clear All
          </button>
          
          <button @click="goHome" class="btn text-sm">
            Create New
          </button>
        </div>
      </div>
      
      <!-- No History State -->
      <div v-if="!hasReceipts" class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <div class="flex justify-center mb-4">
          <ClockIcon class="h-12 w-12 text-gray-400" />
        </div>
        <h2 class="text-xl font-medium text-gray-900 dark:text-white mb-2">No Receipt History</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          Your previously created receipts will appear here.
        </p>
        <button @click="goHome" class="btn">
          Create Your First Receipt
        </button>
      </div>
      
      <!-- Receipt History List -->
      <div v-else class="space-y-4">
        <div 
          v-for="receipt in historyStore.receiptHistory" 
          :key="receipt.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
        >
          <div class="p-4 sm:p-5">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <!-- Receipt Details -->
              <div class="mb-4 sm:mb-0">
                <h3 class="font-medium text-gray-900 dark:text-white text-lg">
                  {{ receipt.preview.shopName }}
                </h3>
                
                <div class="mt-1 flex flex-wrap text-sm text-gray-500 dark:text-gray-400 gap-x-4">
                  <div class="flex items-center">
                    <DocumentTextIcon class="h-4 w-4 mr-1" />
                    <span>{{ formatCurrency(receipt.preview.total) }}</span>
                  </div>
                  
                  <div class="flex items-center">
                    <UserIcon class="h-4 w-4 mr-1" />
                    <span>{{ receipt.preview.customer }}</span>
                  </div>
                  
                  <div class="flex items-center">
                    <ClockIcon class="h-4 w-4 mr-1" />
                    <span>{{ formatDate(receipt.timestamp) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Actions -->
              <div class="flex items-center space-x-2">
                <button 
                  @click="confirmDelete(receipt.id)" 
                  class="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Delete"
                >
                  <TrashIcon class="h-5 w-5" />
                </button>
                
                <button 
                  @click="loadReceipt(receipt.id)"
                  class="btn-secondary text-sm"
                >
                  <ArrowPathIcon class="h-4 w-4 mr-1" />
                  Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Confirm Modal -->
  <Modal 
    :show="showConfirmModal"
    :title="modalAction === 'delete' ? 'Delete Receipt' : 'Clear History'"
    @close="showConfirmModal = false"
  >
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <ExclamationTriangleIcon class="h-6 w-6 text-yellow-400" />
      </div>
      <div class="ml-3">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ modalAction === 'delete' 
            ? 'Are you sure you want to delete this receipt from history? This action cannot be undone.'
            : 'Are you sure you want to clear all receipt history? This action cannot be undone.'
          }}
        </p>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-end space-x-3">
        <button 
          @click="showConfirmModal = false" 
          class="btn-secondary"
        >
          Cancel
        </button>
        <button 
          @click="deleteReceipt"
          class="btn bg-red-600 hover:bg-red-700"
        >
          {{ modalAction === 'delete' ? 'Delete Receipt' : 'Clear All' }}
        </button>
      </div>
    </template>
  </Modal>
</template>
