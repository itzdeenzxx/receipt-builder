<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { CurrencyDollarIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

const settingsStore = useSettingsStore()

const emit = defineEmits(['change'])

const changeCurrency = (currencyCode) => {
  settingsStore.setCurrency(currencyCode)
  emit('change', currencyCode)
}

const getCurrencyFlag = (code) => {
  // Simple mapping of currency codes to flag emojis
  const flags = {
    USD: '🇺🇸',
    EUR: '🇪🇺',
    GBP: '🇬🇧',
    THB: '🇹🇭',
    JPY: '🇯🇵',
    CNY: '🇨🇳',
    KRW: '🇰🇷',
    SGD: '🇸🇬',
    AUD: '🇦🇺',
    CAD: '🇨🇦',
    BTC: '₿'
  }
  
  return flags[code] || ''
}
</script>

<template>
  <Menu as="div" class="relative">
    <MenuButton class="btn-secondary flex items-center">
      <CurrencyDollarIcon class="h-5 w-5 mr-2" />
      <span class="mr-1">{{ settingsStore.currency }}</span>
      <span class="mr-1">{{ getCurrencyFlag(settingsStore.currency) }}</span>
      <ChevronDownIcon class="h-4 w-4" />
    </MenuButton>
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <MenuItems class="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
        <div class="py-1 max-h-60 overflow-y-auto">
          <MenuItem v-for="currency in settingsStore.currencies" :key="currency.code">
            <button 
              @click="changeCurrency(currency.code)"
              class="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              :class="{ 'bg-gray-100 dark:bg-gray-700': settingsStore.currency === currency.code }"
            >
              <div class="flex items-center">
                <span class="mr-2">{{ getCurrencyFlag(currency.code) }}</span>
                <span>{{ currency.code }}</span>
              </div>
              <span class="text-gray-500 dark:text-gray-400">{{ currency.name }}</span>
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>
