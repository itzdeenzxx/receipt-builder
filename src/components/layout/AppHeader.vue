<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { 
  Bars3Icon, 
  XMarkIcon, 
  MoonIcon, 
  SunIcon,
  LanguageIcon
} from '@heroicons/vue/24/outline'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()
const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const toggleDarkMode = () => {
  settingsStore.toggleDarkMode()
}

const changeLanguage = (lang) => {
  settingsStore.setLanguage(lang)
  locale.value = lang // Directly update i18n locale as well
}
</script>

<template>
  <header class="bg-white dark:bg-gray-800 shadow-sm">
    <nav class="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Brand -->
        <div class="flex items-center">
          <RouterLink to="/" class="flex-shrink-0">
            <h1 class="text-xl font-bold text-primary-600 dark:text-primary-400">
              {{ t('app.title') }}
            </h1>
          </RouterLink>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:block">
          <div class="flex items-center space-x-4">
            <RouterLink
              v-for="item in [
                { name: t('nav.home'), to: '/' },
                { name: t('nav.editor'), to: '/editor' },
                { name: t('nav.history'), to: '/history' }
              ]"
              :key="item.name"
              :to="item.to"
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
            >
              {{ item.name }}
            </RouterLink>
          </div>
        </div>

        <!-- Settings Menu -->
        <div class="hidden md:flex items-center">
          <button 
            @click="toggleDarkMode" 
            class="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoonIcon v-if="!settingsStore.darkMode" class="h-5 w-5" />
            <SunIcon v-else class="h-5 w-5" />
          </button>

          <Menu as="div" class="relative ml-3">
            <MenuButton class="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              <LanguageIcon class="h-5 w-5" />
            </MenuButton>
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <MenuItems class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div class="py-1">
                  <MenuItem v-for="lang in settingsStore.languages" :key="lang.code">
                    <button 
                      @click="changeLanguage(lang.code)"
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      :class="{ 'font-medium text-primary-600 dark:text-primary-400': settingsStore.language === lang.code }"
                    >
                      {{ lang.name }}
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </Menu>
        </div>

        <!-- Mobile menu button -->
        <div class="flex md:hidden">
          <button
            @click="toggleMenu"
            class="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Bars3Icon v-if="!isMenuOpen" class="h-6 w-6" />
            <XMarkIcon v-else class="h-6 w-6" />
          </button>
        </div>
      </div>

      <!-- Mobile menu, show/hide based on menu state -->
      <div v-show="isMenuOpen" class="md:hidden">
        <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <RouterLink
            v-for="item in [
              { name: t('nav.home'), to: '/' },
              { name: t('nav.editor'), to: '/editor' },
              { name: t('nav.history'), to: '/history' }
            ]"
            :key="item.name"
            :to="item.to"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
            @click="isMenuOpen = false"
          >
            {{ item.name }}
          </RouterLink>

          <div class="flex items-center justify-between pt-3">
            <button 
              @click="toggleDarkMode" 
              class="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200"
            >
              <MoonIcon v-if="!settingsStore.darkMode" class="h-5 w-5 mr-2" />
              <SunIcon v-else class="h-5 w-5 mr-2" />
              {{ settingsStore.darkMode ? 'Light Mode' : 'Dark Mode' }}
            </button>
          </div>

          <div class="mt-3 space-y-1 px-2">
            <button 
              v-for="lang in settingsStore.languages" 
              :key="lang.code"
              @click="changeLanguage(lang.code); isMenuOpen = false"
              class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200"
              :class="{ 'text-primary-600 dark:text-primary-400': settingsStore.language === lang.code }"
            >
              {{ lang.name }}
            </button>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>
