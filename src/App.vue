<script setup>
import { onMounted, watch, ref } from 'vue'
import { RouterView } from 'vue-router'
import { useSettingsStore } from './stores/settings'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import DevModePanel from './components/ui/DevModePanel.vue'

const settingsStore = useSettingsStore()
const showDevMode = ref(false)

// Initialize dark mode based on settings
onMounted(() => {
  if (settingsStore.darkMode) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  
  // Check for dev mode query parameter
  const urlParams = new URLSearchParams(window.location.search)
  showDevMode.value = urlParams.get('dev') === 'true'
})

// Watch for dark mode changes
watch(() => settingsStore.darkMode, (newVal) => {
  if (newVal) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-grow">
      <RouterView />
    </main>
    <AppFooter />
    <DevModePanel v-if="showDevMode" />
  </div>
</template>
