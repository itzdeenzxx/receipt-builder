import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import th from './locales/th.json'

// Get stored language preference or default to English
const storedLang = localStorage.getItem('language') || 'en'

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: storedLang,
  fallbackLocale: 'en',
  messages: {
    en,
    th
  },
  globalInjection: true, // Makes $t() available in templates
  silentTranslationWarn: true, // Suppress warnings for missing translations
})

export default i18n
