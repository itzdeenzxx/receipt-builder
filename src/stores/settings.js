import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import i18n from '../i18n'

export const useSettingsStore = defineStore('settings', () => {
  const language = ref(localStorage.getItem('language') || 'en')
  const darkMode = ref(localStorage.getItem('darkMode') === 'true')
  const currency = ref(localStorage.getItem('currency') || 'USD')
  
  // Expanded currency list
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'BTC', symbol: '₿', name: 'Bitcoin' },
  ]
  
  // Available languages
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'th', name: 'ไทย' }
  ]
  
  // Get current currency symbol
  const currencySymbol = computed(() => {
    const found = currencies.find(c => c.code === currency.value)
    return found ? found.symbol : '$'
  })
  
  // Watch for changes and save to localStorage
  watch(language, (newVal) => {
    localStorage.setItem('language', newVal)
    // Update i18n locale when language changes
    i18n.global.locale.value = newVal
  })
  
  watch(darkMode, (newVal) => {
    localStorage.setItem('darkMode', newVal)
    if (newVal) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })
  
  watch(currency, (newVal) => {
    localStorage.setItem('currency', newVal)
  })
  
  // Initialize dark mode from stored setting
  if (darkMode.value) {
    document.documentElement.classList.add('dark')
  }
  
  // Initialize i18n locale with stored language
  if (i18n.global && language.value) {
    i18n.global.locale.value = language.value
  }
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    darkMode.value = !darkMode.value
  }
  
  // Change language
  const setLanguage = (lang) => {
    language.value = lang
  }
  
  // Change currency
  const setCurrency = (curr) => {
    currency.value = curr
  }
  
  return {
    language,
    languages,
    darkMode,
    currency,
    currencies,
    currencySymbol,
    toggleDarkMode,
    setLanguage,
    setCurrency
  }
})
