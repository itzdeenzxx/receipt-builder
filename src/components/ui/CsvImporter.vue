<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DocumentArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const emit = defineEmits(['items-imported'])

const isDragging = ref(false)
const isProcessing = ref(false)
const importResult = ref(null)
const hasHeader = ref(true)

const allowedFileTypes = ['text/csv', 'application/vnd.ms-excel']

const handleFileDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  
  const files = e.dataTransfer?.files || e.target.files
  if (!files || !files.length) return
  
  const file = files[0]
  if (!allowedFileTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    importResult.value = {
      success: false,
      message: t('csv.invalidFile', 'Invalid file type. Please upload a CSV file.')
    }
    return
  }
  
  processCSV(file)
}

const processCSV = async (file) => {
  isProcessing.value = true
  importResult.value = null
  
  try {
    const content = await readFileContent(file)
    const items = parseCSV(content, hasHeader.value)
    
    if (!items.length) {
      importResult.value = {
        success: false,
        message: t('csv.noValidData', 'No valid data found in the CSV file.')
      }
      return
    }
    
    importResult.value = {
      success: true,
      message: t('csv.importSuccess', 'Successfully imported {count} items.', { count: items.length })
    }
    
    emit('items-imported', items)
  } catch (error) {
    console.error('CSV import error:', error)
    importResult.value = {
      success: false,
      message: t('csv.parseError', 'Failed to process the CSV file. Please check the format.')
    }
  } finally {
    isProcessing.value = false
  }
}

const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(event.target.result)
    reader.onerror = (error) => reject(error)
    reader.readAsText(file)
  })
}

const parseCSV = (content, hasHeader = true) => {
  const rows = content.split('\n')
  if (rows.length <= 0) return []
  
  let headerRow = 0
  let headers = ['name', 'description', 'price', 'quantity']
  
  // If file has headers, use them
  if (hasHeader && rows.length > 0) {
    const headerLine = rows[0].toLowerCase()
    if (headerLine.includes('name') || headerLine.includes('product')) {
      headers = parseCSVLine(rows[0]).map(h => h.trim().toLowerCase())
      headerRow = 1
    }
  }
  
  // Check if essential columns exist
  if (!headers.includes('name')) {
    throw new Error('Missing required name column')
  }
  
  const items = []
  
  for (let i = headerRow; i < rows.length; i++) {
    if (!rows[i].trim()) continue
    
    const values = parseCSVLine(rows[i])
    if (values.length === 0) continue
    
    const item = {
      name: '',
      description: '',
      price: 0,
      quantity: 1
    }
    
    // Map values to corresponding headers
    headers.forEach((header, index) => {
      if (index < values.length) {
        if (header === 'name' || header === 'product' || header === 'item') {
          item.name = values[index] || 'Unnamed Item'
        } else if (header === 'description' || header === 'desc') {
          item.description = values[index] || ''
        } else if (header === 'price' || header === 'cost' || header === 'rate') {
          const priceVal = parseFloat(values[index])
          item.price = isNaN(priceVal) ? 0 : priceVal
        } else if (header === 'quantity' || header === 'qty' || header === 'amount') {
          const qtyVal = parseInt(values[index])
          item.quantity = isNaN(qtyVal) ? 1 : qtyVal
        }
      }
    })
    
    // If we have just one column, assume it's the name
    if (headers.length === 1 && values.length === 1) {
      item.name = values[0]
    }
    
    // Add the item if it has a name
    if (item.name && item.name.trim()) {
      items.push(item)
    }
  }
  
  return items
}

// Improved CSV line parsing
const parseCSVLine = (line) => {
  if (!line || !line.trim()) return []
  
  const result = []
  let currentValue = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (i < line.length - 1 && line[i + 1] === '"') {
        // Handle escaped quotes (two double quotes in a row)
        currentValue += '"'
        i++ // Skip the next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentValue.trim())
      currentValue = ''
    } else {
      currentValue += char
    }
  }
  
  // Add the last value
  result.push(currentValue.trim())
  
  return result
}

const resetImport = () => {
  importResult.value = null
}

const handleDragOver = (e) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleClick = () => {
  document.getElementById('csv-file-input').click()
}
</script>

<template>
  <div>
    <div
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleFileDrop"
      @click="handleClick"
      class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-150"
      :class="{ 
        'border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20': isDragging,
        'border-gray-300 hover:border-primary-300 dark:border-gray-700 dark:hover:border-primary-700': !isDragging
      }"
    >
      <input 
        id="csv-file-input" 
        type="file" 
        class="sr-only" 
        @change="handleFileDrop" 
        accept=".csv"
      />
      
      <div v-if="isProcessing" class="flex flex-col items-center">
        <div class="animate-spin h-10 w-10 border-b-2 border-primary-500 rounded-full mb-2"></div>
        <p class="text-gray-600 dark:text-gray-300">{{ t('csv.importing', 'Processing CSV...') }}</p>
      </div>
      
      <div v-else-if="importResult" class="flex flex-col items-center">
        <CheckCircleIcon v-if="importResult.success" class="h-10 w-10 text-green-500 mb-2" />
        <ExclamationTriangleIcon v-else class="h-10 w-10 text-red-500 mb-2" />
        <p :class="importResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
          {{ importResult.message }}
        </p>
        <button @click.stop="resetImport" class="btn-secondary mt-3 text-sm">
          {{ t('csv.importButton', 'Import Another File') }}
        </button>
      </div>
      
      <div v-else class="flex flex-col items-center">
        <DocumentArrowUpIcon class="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
        <p class="text-gray-600 dark:text-gray-300">{{ t('csv.clickToUpload', 'Drag & drop a CSV file here, or click to browse') }}</p>
        
        <div class="mt-3 flex items-center">
          <input 
            id="csv-has-header" 
            v-model="hasHeader" 
            type="checkbox"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            @click.stop
          />
          <label for="csv-has-header" class="ml-2 text-sm text-gray-600 dark:text-gray-400" @click.stop>
            {{ t('csv.hasHeader', 'File has header row') }}
          </label>
        </div>
        
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">
          {{ t('csv.formatHint', 'Required columns: name, price, quantity') }}
        </p>
      </div>
    </div>
  </div>
</template>
