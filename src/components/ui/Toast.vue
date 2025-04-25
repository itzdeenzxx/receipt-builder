<script setup>
import { ref, watch, onMounted } from 'vue'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'success', // 'success', 'error', 'info'
    validator: (value) => ['success', 'error', 'info'].includes(value)
  },
  message: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 3000 // 3 seconds
  },
  position: {
    type: String,
    default: 'top-right', // 'top-right', 'top-center', 'top-left', 'bottom-right', 'bottom-center', 'bottom-left'
    validator: (value) => [
      'top-right', 'top-center', 'top-left',
      'bottom-right', 'bottom-center', 'bottom-left'
    ].includes(value)
  }
})

const emit = defineEmits(['close'])
const visible = ref(props.show)
let timeout = null

// Icons and colors based on type
const typeConfig = {
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-500 dark:text-green-400',
    borderColor: 'border-green-500 dark:border-green-500'
  },
  error: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-500 dark:text-red-400',
    borderColor: 'border-red-500 dark:border-red-500'
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-500 dark:text-blue-400',
    borderColor: 'border-blue-500 dark:border-blue-500'
  }
}

// Position classes
const positionClass = {
  'top-right': 'top-4 right-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  'bottom-left': 'bottom-4 left-4'
}

// Handle auto-close
const startTimer = () => {
  if (props.duration > 0) {
    timeout = setTimeout(() => {
      closeToast()
    }, props.duration)
  }
}

const clearTimer = () => {
  if (timeout) {
    clearTimeout(timeout)
  }
}

const closeToast = () => {
  visible.value = false
  emit('close')
}

// Watch for prop changes
watch(() => props.show, (newVal) => {
  visible.value = newVal
  if (newVal) {
    clearTimer()
    startTimer()
  }
})

// Clear timer when unmounting
onMounted(() => {
  if (props.show) {
    startTimer()
  }
})
</script>

<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="visible"
      :class="[
        'fixed z-50 pointer-events-auto flex w-full max-w-sm overflow-hidden rounded-lg border-l-4 shadow-lg',
        positionClass[position],
        typeConfig[type].bgColor,
        typeConfig[type].borderColor
      ]"
    >
      <div class="w-full p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <component :is="typeConfig[type].icon" :class="`h-5 w-5 ${typeConfig[type].textColor}`" />
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ message }}
            </p>
          </div>
          <div class="ml-4 flex flex-shrink-0">
            <button
              @click="closeToast"
              class="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
