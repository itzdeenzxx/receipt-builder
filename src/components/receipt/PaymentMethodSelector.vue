<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  CreditCardIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  QrCodeIcon,
  QuestionMarkCircleIcon
} from '@heroicons/vue/24/outline';

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    default: 'cash'
  }
});

const emit = defineEmits(['update:modelValue']);

const paymentMethods = computed(() => [
  { 
    id: 'cash', 
    name: t('payment.cash'),
    icon: BanknotesIcon
  },
  { 
    id: 'card', 
    name: t('payment.card'),
    icon: CreditCardIcon
  },
  { 
    id: 'bank', 
    name: t('payment.bank'),
    icon: BuildingLibraryIcon
  },
  { 
    id: 'promptpay', 
    name: t('payment.promptpay'),
    icon: QrCodeIcon
  },
  { 
    id: 'other', 
    name: t('payment.other'),
    icon: QuestionMarkCircleIcon
  }
]);

const updatePaymentMethod = (method) => {
  emit('update:modelValue', method);
};
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ t('payment.method') }}
    </label>
    
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
      <button 
        v-for="method in paymentMethods" 
        :key="method.id"
        type="button"
        @click="updatePaymentMethod(method.id)"
        :class="[
          'flex flex-col items-center justify-center px-3 py-2 border rounded-lg transition-all', 
          modelValue === method.id 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
        ]"
      >
        <component 
          :is="method.icon" 
          :class="[
            'h-6 w-6 mb-1',
            modelValue === method.id 
              ? 'text-primary-500 dark:text-primary-400' 
              : 'text-gray-500 dark:text-gray-400'
          ]" 
        />
        <span class="text-sm font-medium">{{ method.name }}</span>
      </button>
    </div>
  </div>
</template>