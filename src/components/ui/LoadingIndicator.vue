<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md' // 'sm', 'md', 'lg'
  },
  color: {
    type: String,
    default: 'primary' // 'primary', 'white', 'gray'
  },
  label: {
    type: String,
    default: 'Loading...'
  },
  showLabel: {
    type: Boolean,
    default: true
  }
})

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
}

const colorClasses = {
  primary: 'border-primary-500',
  white: 'border-white',
  gray: 'border-gray-300 dark:border-gray-600'
}
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <div 
      class="animate-spin rounded-full border-b-2" 
      :class="[sizeClasses[size], colorClasses[color]]"
    ></div>
    <p 
      v-if="showLabel" 
      class="mt-2 text-sm text-gray-600 dark:text-gray-300"
    >
      {{ label }}
    </p>
  </div>
</template>
