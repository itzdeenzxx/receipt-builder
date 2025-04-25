import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useReceiptStore } from './receipt'

export const useHistoryStore = defineStore('history', () => {
  // Store receipt history array
  const receiptHistory = ref([])
  
  // Load history from localStorage
  const loadHistory = () => {
    const storedHistory = localStorage.getItem('receiptHistory')
    if (storedHistory) {
      try {
        receiptHistory.value = JSON.parse(storedHistory)
      } catch (e) {
        console.error('Failed to load receipt history:', e)
        receiptHistory.value = []
      }
    }
  }
  
  // Save current history to localStorage
  const saveHistory = () => {
    localStorage.setItem('receiptHistory', JSON.stringify(receiptHistory.value))
  }
  
  // Add receipt to history
  const saveReceiptToHistory = (receipt) => {
    // Create a copy with timestamp and ID
    const timestamp = new Date().toISOString()
    const id = `receipt-${Date.now()}`
    
    const historicalReceipt = {
      id,
      timestamp,
      data: JSON.parse(JSON.stringify(receipt)),
      preview: {
        shopName: receipt.shop.name || 'Unnamed Receipt',
        total: receipt.total || 0,
        customer: receipt.customer.name || 'Unnamed Customer',
        date: receipt.receiptDetails.date || timestamp,
      }
    }
    
    // Add to beginning of array (newest first)
    receiptHistory.value.unshift(historicalReceipt)
    
    // Limit history to 20 items
    if (receiptHistory.value.length > 20) {
      receiptHistory.value = receiptHistory.value.slice(0, 20)
    }
    
    // Save to localStorage
    saveHistory()
    
    return id
  }
  
  // Load a receipt from history into the current receipt
  const loadReceiptFromHistory = (id) => {
    const receiptStore = useReceiptStore()
    const receipt = receiptHistory.value.find(r => r.id === id)
    
    if (receipt) {
      receiptStore.$patch({ receipt: receipt.data })
      receiptStore.saveToLocalStorage()
      return true
    }
    
    return false
  }
  
  // Delete a receipt from history
  const deleteReceiptFromHistory = (id) => {
    const index = receiptHistory.value.findIndex(r => r.id === id)
    
    if (index !== -1) {
      receiptHistory.value.splice(index, 1)
      saveHistory()
      return true
    }
    
    return false
  }
  
  // Clear all history
  const clearHistory = () => {
    receiptHistory.value = []
    saveHistory()
  }
  
  // Initialize history from localStorage
  loadHistory()
  
  return {
    receiptHistory,
    saveReceiptToHistory,
    loadReceiptFromHistory,
    deleteReceiptFromHistory,
    clearHistory
  }
})
