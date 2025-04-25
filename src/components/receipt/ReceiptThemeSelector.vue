<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    default: 'modern'
  }
});

const emit = defineEmits(['update:modelValue']);

const themes = computed(() => [
  { 
    id: 'minimal', 
    name: t('themes.minimal'),
    preview: 'minimal-preview.png'
  },
  { 
    id: 'modern', 
    name: t('themes.modern'),
    preview: 'modern-preview.png'
  },
  { 
    id: 'thai', 
    name: t('themes.thai'),
    preview: 'thai-preview.png'
  },
  { 
    id: 'elegant', 
    name: t('themes.elegant'),
    preview: 'elegant-preview.png'
  },
  { 
    id: 'business', 
    name: t('themes.business'),
    preview: 'business-preview.png'
  }
]);

const updateTheme = (themeId) => {
  emit('update:modelValue', themeId);
};
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ t('themes.title') }}
    </label>
    
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
      <button 
        v-for="theme in themes" 
        :key="theme.id"
        type="button"
        @click="updateTheme(theme.id)"
        :class="[
          'flex flex-col items-center justify-center p-3 border rounded-lg transition-all',
          modelValue === theme.id 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
        ]"
      >
        <div 
          class="w-full h-12 mb-2 rounded border"
          :class="[
            modelValue === theme.id 
              ? 'border-primary-500 dark:border-primary-400' 
              : 'border-gray-300 dark:border-gray-600',
            {
              'bg-gradient-to-br from-white to-gray-200 dark:from-gray-700 dark:to-gray-900': theme.id === 'minimal',
              'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30': theme.id === 'modern',
              'bg-gradient-to-br from-yellow-50 to-red-100 dark:from-yellow-900/30 dark:to-red-800/30': theme.id === 'thai',
              'bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/30 dark:to-purple-800/30': theme.id === 'elegant',
              'bg-gradient-to-br from-green-50 to-teal-100 dark:from-green-900/30 dark:to-teal-800/30': theme.id === 'business',
            }
          ]"
        >
          <div class="w-full h-2 bg-gray-400 dark:bg-gray-500 opacity-30 mt-2 mx-auto rounded"></div>
          <div class="w-3/4 h-1 bg-gray-400 dark:bg-gray-500 opacity-20 mt-1 mx-auto rounded"></div>
          <div class="w-1/2 h-1 bg-gray-400 dark:bg-gray-500 opacity-20 mt-1 mx-auto rounded"></div>
          <div class="w-2/3 h-1 bg-gray-400 dark:bg-gray-500 opacity-20 mt-1 mx-auto rounded"></div>
        </div>
        <span class="text-sm font-medium">{{ theme.name }}</span>
      </button>
    </div>
  </div>
</template>