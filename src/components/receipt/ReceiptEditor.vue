<template>
  <div>
    <!-- Theme Selection -->
    <div class="mt-6">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
        {{ t('themes.title') }}
      </h2>
      
      <div class="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
        <button
          v-for="theme in ['minimal', 'modern', 'thai', 'elegant', 'business']"
          :key="theme"
          @click="selectTheme(theme)"
          class="aspect-square border rounded-md p-2 transition-colors"
          :class="[receiptStore.receipt.theme === theme ? 
            'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 
            'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800']"
        >
          <ReceiptThemePreview :theme="theme" />
        </button>
      </div>
    </div>
    
    <!-- Payment Method Selection -->
    <div class="mt-6">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
        {{ t('payment.method') }}
      </h2>
      
      <PaymentMethodSelector
        v-model="receiptStore.receipt.paymentMethod"
      />
    </div>
    
    <!-- Discount and Tax -->
    <div class="mt-6">
      <DiscountInput v-model="receiptStore.receipt.discount" />
      <TaxInput v-model="receiptStore.receipt.tax" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useReceiptStore } from '@/stores/receipt'
import DiscountInput from './DiscountInput.vue'
import TaxInput from './TaxInput.vue'
import ReceiptThemePreview from './ReceiptThemePreview.vue'
import PaymentMethodSelector from './PaymentMethodSelector.vue'

export default defineComponent({
  components: {
    DiscountInput,
    TaxInput,
    ReceiptThemePreview,
    PaymentMethodSelector,
  },
  setup() {
    const receiptStore = useReceiptStore()
    const t = (key) => receiptStore.translate(key)

    const selectTheme = (theme) => {
      receiptStore.receipt.theme = theme
    }

    return {
      receiptStore,
      t,
      selectTheme,
    }
  },
})
</script>