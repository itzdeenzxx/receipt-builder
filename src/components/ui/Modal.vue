<script setup>
import { defineProps, defineEmits } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md', // 'sm', 'md', 'lg', 'xl'
  }
})

const emit = defineEmits(['close'])

const closeModal = () => {
  emit('close')
}

const handleBackdropClick = (e) => {
  // Only close if clicking directly on backdrop, not on modal content
  if (e.target === e.currentTarget) {
    closeModal()
  }
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-full',
}
</script>

<template>
  <Teleport to="body">
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 flex items-center justify-center z-50 p-4" @click="handleBackdropClick">
        <div class="absolute inset-0 bg-black bg-opacity-50"></div>
        
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full z-10"
          :class="[sizeClasses[size]]"
        >
          <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ title }}
            </h3>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
          
          <div class="p-4">
            <slot></slot>
          </div>
          
          <div v-if="$slots.footer" class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
