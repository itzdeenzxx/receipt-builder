<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  theme: {
    type: String,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

// Sample receipt data for theme preview
const dummyData = {
  shop: {
    name: 'Sample Shop',
  },
  items: [
    { name: 'Item 1', quantity: 1, price: 100 },
    { name: 'Item 2', quantity: 2, price: 50 }
  ]
}
</script>

<template>
  <div 
    class="border rounded-lg overflow-hidden cursor-pointer transition-all duration-200"
    :class="{ 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-900': selected, 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600': !selected }"
  >
    <div class="p-3 bg-white dark:bg-gray-800">
      <div class="text-xs uppercase font-medium text-gray-500 dark:text-gray-400 mb-2">
        {{ props.theme }}
      </div>
      
      <!-- Minimal Theme Preview -->
      <div v-if="props.theme === 'minimal'" class="border rounded bg-white dark:bg-gray-800 p-2">
        <div class="text-center mb-2">
          <div class="font-bold text-xs">{{ dummyData.shop.name }}</div>
          <div class="text-xs text-gray-600 dark:text-gray-400">Receipt</div>
        </div>
        
        <div class="border-t border-b border-gray-200 dark:border-gray-700 py-1 mt-2">
          <div class="flex justify-between text-xs">
            <span>Item</span>
            <span>Total</span>
          </div>
        </div>
        
        <div class="text-center mt-2">
          <div class="text-xs font-medium">Thank You!</div>
        </div>
      </div>
      
      <!-- Modern Theme Preview -->
      <div v-else-if="props.theme === 'modern'" class="border rounded overflow-hidden">
        <div class="bg-blue-50 dark:bg-blue-900/20 p-2">
          <div class="flex justify-between items-center">
            <div class="font-bold text-xs">{{ dummyData.shop.name }}</div>
            <div class="text-xs text-primary-600 dark:text-primary-400">Receipt</div>
          </div>
        </div>
        
        <div class="p-2 bg-white dark:bg-gray-800">
          <div class="text-xs mb-1 font-medium">Items:</div>
          <div class="text-xs">2 items</div>
          
          <div class="flex justify-between text-xs mt-2 pt-1 border-t border-gray-200 dark:border-gray-700">
            <span>Total:</span>
            <span class="font-medium">$200.00</span>
          </div>
        </div>
      </div>
      
      <!-- Elegant Theme Preview -->
      <div v-else-if="props.theme === 'elegant'" class="border rounded overflow-hidden">
        <div class="bg-gray-50 dark:bg-gray-700/50 p-2 border-b border-gray-200 dark:border-gray-700">
          <div class="text-center">
            <div class="font-serif font-bold text-xs italic">{{ dummyData.shop.name }}</div>
            <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">~ Receipt ~</div>
          </div>
        </div>
        
        <div class="p-2 bg-white dark:bg-gray-800">
          <div class="border-b border-dashed border-gray-200 dark:border-gray-700 pb-1 mb-1">
            <div class="text-xs text-center font-medium">Items</div>
          </div>
          
          <div class="flex justify-between text-xs mt-2 pt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
            <span class="font-serif italic">Total:</span>
            <span class="font-medium">$200.00</span>
          </div>
        </div>
      </div>
      
      <!-- Business Theme Preview -->
      <div v-else-if="props.theme === 'business'" class="border rounded overflow-hidden">
        <div class="bg-slate-800 dark:bg-slate-700 p-2">
          <div class="flex justify-between items-center">
            <div class="font-bold text-xs text-white">{{ dummyData.shop.name }}</div>
            <div class="text-xs text-slate-300">RECEIPT</div>
          </div>
        </div>
        
        <div class="p-2 bg-white dark:bg-gray-800">
          <div class="bg-slate-100 dark:bg-slate-800 p-1 mb-1 text-xs font-medium">
            ITEMS
          </div>
          
          <div class="flex justify-between text-xs mt-2 pt-1 border-t border-slate-200 dark:border-slate-700">
            <span class="font-medium">TOTAL:</span>
            <span class="font-medium">$200.00</span>
          </div>
        </div>
      </div>
      
      <!-- Thai Theme Preview -->
      <div v-else class="border rounded bg-white dark:bg-gray-800 p-2">
        <div class="flex justify-between mb-2">
          <div class="font-bold text-xs">{{ dummyData.shop.name }}</div>
          <div class="text-xs text-primary-600 dark:text-primary-400">ใบเสร็จรับเงิน</div>
        </div>
        
        <div class="border-t border-b border-gray-200 dark:border-gray-700 py-1">
          <div class="text-xs">รายการ / Items</div>
        </div>
        
        <div class="mt-2 border-t border-dashed border-gray-200 dark:border-gray-700 pt-1">
          <div class="flex justify-between text-xs">
            <span>รวม / Total:</span>
            <span class="font-medium">฿200.00</span>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>
