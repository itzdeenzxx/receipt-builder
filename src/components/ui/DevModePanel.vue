<script setup>
import { ref, computed } from 'vue'
import { useReceiptStore } from '@/stores/receipt'
import { XMarkIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

const receiptStore = useReceiptStore()

const isOpen = ref(false)
const activeTab = ref('json') // 'json', 'raw'

const receiptJson = computed(() => {
  const receiptData = {
    ...receiptStore.receipt,
    calculated: {
      subtotal: receiptStore.subtotal,
      discountValue: receiptStore.discountValue,
      taxValue: receiptStore.taxValue,
      total: receiptStore.total
    }
  }
  return JSON.stringify(receiptData, null, 2)
})

const togglePanel = () => {
  isOpen.value = !isOpen.value
}

const refreshData = () => {
  // Force reactivity update by triggering Pinia state change
  receiptStore.$patch({})
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(receiptJson.value)
    .then(() => {
      alert('JSON copied to clipboard')
    })
    .catch(err => {
      console.error('Failed to copy text: ', err)
    })
}
</script>

<template>
  <div class="fixed right-0 bottom-0 z-40">
    <!-- Button to toggle dev panel -->
    <button 
      @click="togglePanel" 
      class="bg-gray-800 text-white p-2 rounded-tl-md shadow-lg"
    >
      { Dev }
    </button>
    
    <!-- Dev Panel -->
    <div 
      v-show="isOpen" 
      class="bg-gray-800 text-white shadow-lg w-96 max-w-full h-96 overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div class="p-2 border-b border-gray-700 flex justify-between items-center">
        <div class="flex space-x-2">
          <button 
            @click="activeTab = 'json'" 
            class="px-2 py-1 text-xs rounded" 
            :class="activeTab === 'json' ? 'bg-blue-600' : 'hover:bg-gray-700'"
          >
            JSON
          </button>
          <button 
            @click="activeTab = 'raw'" 
            class="px-2 py-1 text-xs rounded" 
            :class="activeTab === 'raw' ? 'bg-blue-600' : 'hover:bg-gray-700'"
          >
            Raw View
          </button>
        </div>
        
        <div class="flex space-x-2">
          <button 
            @click="refreshData" 
            class="text-gray-400 hover:text-white"
            title="Refresh data"
          >
            <ArrowPathIcon class="h-4 w-4" />
          </button>
          
          <button 
            @click="copyToClipboard" 
            class="text-gray-400 hover:text-white"
            title="Copy to clipboard"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
            </svg>
          </button>
          
          <button 
            @click="togglePanel" 
            class="text-gray-400 hover:text-white"
            title="Close"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <!-- Content -->
      <div class="flex-1 overflow-auto">
        <!-- JSON Tab -->
        <div v-show="activeTab === 'json'" class="p-2">
          <pre class="text-xs font-mono whitespace-pre-wrap text-green-400">{{ receiptJson }}</pre>
        </div>
        
        <!-- Raw View Tab -->
        <div v-show="activeTab === 'raw'" class="p-2">
          <div class="p-2 mb-2 bg-gray-700 rounded">
            <h3 class="text-xs font-bold mb-1">Subtotal</h3>
            <p class="text-xs">{{ receiptStore.subtotal }}</p>
          </div>
          
          <div class="p-2 mb-2 bg-gray-700 rounded">
            <h3 class="text-xs font-bold mb-1">Discount</h3>
            <p class="text-xs">{{ receiptStore.discountValue }}</p>
          </div>
          
          <div class="p-2 mb-2 bg-gray-700 rounded">
            <h3 class="text-xs font-bold mb-1">Tax</h3>
            <p class="text-xs">{{ receiptStore.taxValue }}</p>
          </div>
          
          <div class="p-2 mb-2 bg-gray-700 rounded">
            <h3 class="text-xs font-bold mb-1">Total</h3>
            <p class="text-xs">{{ receiptStore.total }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
