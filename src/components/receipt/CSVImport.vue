<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useReceiptStore } from '@/stores/receipt';

const { t } = useI18n();
const receiptStore = useReceiptStore();

const isUploading = ref(false);
const showModal = ref(false);
const csvFile = ref(null);
const parseError = ref('');
const importSuccess = ref(false);
const previewData = ref([]);
const hasHeader = ref(true);
const importCount = ref(0);

const openModal = () => {
  showModal.value = true;
  resetState();
};

const closeModal = () => {
  showModal.value = false;
  resetState();
};

const resetState = () => {
  csvFile.value = null;
  parseError.value = '';
  importSuccess.value = false;
  previewData.value = [];
  isUploading.value = false;
  importCount.value = 0;
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Check if it's a CSV file
  if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
    parseError.value = t('csv.invalidFile', 'Invalid file type. Please upload a CSV file.');
    return;
  }
  
  csvFile.value = file;
  parseError.value = '';
  
  // Read file contents
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      const lines = content.split('\n');
      
      if (lines.length <= (hasHeader.value ? 1 : 0)) {
        parseError.value = t('csv.emptyFile', 'The CSV file appears to be empty.');
        return;
      }
      
      // Parse header if present
      if (lines.length > 0 && hasHeader.value) {
        const headerLine = lines[0].trim().toLowerCase();
        
        // Basic header validation - check for minimum required columns
        if (!headerLine.includes('name')) {
          parseError.value = t('csv.missingColumns', 'CSV must include at least a "name" column.');
          return;
        }
      }
      
      // Generate preview data (first few rows)
      previewData.value = [];
      const startRow = hasHeader.value ? 1 : 0;
      const maxPreviewRows = Math.min(3, lines.length - startRow);
      
      for (let i = startRow; i < startRow + maxPreviewRows; i++) {
        if (!lines[i] || !lines[i].trim()) continue;
        
        try {
          const values = parseCSVLine(lines[i]);
          if (values.length > 0) {
            previewData.value.push({
              name: values[0] || 'Unnamed Item',
              description: values[1] || '',
              price: parseFloat(values[2]) || 0,
              quantity: parseInt(values[3]) || 1
            });
          }
        } catch (err) {
          console.error('Error parsing CSV line:', err);
        }
      }
      
      if (previewData.value.length === 0) {
        parseError.value = t('csv.noValidData', 'No valid data found in the CSV file.');
      }
    } catch (error) {
      parseError.value = t('csv.parseError', 'Error parsing the CSV file.');
      console.error('CSV parse error:', error);
    }
  };
  
  reader.onerror = () => {
    parseError.value = t('csv.readError', 'Failed to read the file.');
  };
  
  reader.readAsText(file);
};

const importCSV = () => {
  if (!csvFile.value) return;
  isUploading.value = true;
  
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const result = receiptStore.importFromCSV(e.target.result);
      
      if (result) {
        importSuccess.value = true;
        importCount.value = receiptStore.receipt.items.length;
        
        // Close modal after a short delay
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        parseError.value = t('csv.importError', 'Failed to import items.');
      }
    } catch (error) {
      parseError.value = t('csv.importError', 'Failed to import items.');
      console.error('Import error:', error);
    } finally {
      isUploading.value = false;
    }
  };
  
  reader.onerror = () => {
    parseError.value = t('csv.readError', 'Failed to read the file.');
    isUploading.value = false;
  };
  
  reader.readAsText(csvFile.value);
};

// Helper function for parsing CSV
function parseCSVLine(line) {
  const result = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (i < line.length - 1 && line[i + 1] === '"') {
        // Handle escaped quotes (two double quotes in a row)
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add the last value
  result.push(currentValue);
  
  return result;
}

// Expose methods to parent
defineExpose({
  openModal
});
</script>

<template>
  <!-- CSV Import Button -->
  <button 
    @click="openModal"
    class="group flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 text-gray-500 group-hover:text-primary-500" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
    </svg>
    {{ t('csv.importButton', 'Import from CSV') }}
  </button>
  
  <!-- CSV Import Modal -->
  <div v-if="showModal" class="fixed inset-0 flex items-center justify-center z-50 p-4">
    <div class="absolute inset-0 bg-black bg-opacity-70" @click="closeModal"></div>
    
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 z-10">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ t('csv.title', 'Import Items from CSV') }}
        </h3>
        <button @click="closeModal" class="text-gray-400 hover:text-gray-500 bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div v-if="importSuccess" class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 dark:text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <p class="text-green-700 dark:text-green-300">
            {{ t('csv.importSuccess', 'Successfully imported items!') }}
            ({{ importCount }} {{ t('csv.itemsImported', 'items') }})
          </p>
        </div>
      </div>
      
      <div v-else>
        <!-- Upload Input -->
        <div class="mb-6">
          <label 
            for="csv-file" 
            class="block p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
          >
            <div class="flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400 mb-3" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ csvFile ? csvFile.name : t('csv.clickToUpload', 'Click to upload or drag and drop') }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">CSV</p>
            </div>
            <input 
              id="csv-file" 
              type="file" 
              accept=".csv" 
              class="hidden" 
              @change="handleFileUpload"
            />
          </label>
          
          <div class="mt-2 flex items-center">
            <input 
              id="has-header" 
              v-model="hasHeader" 
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label for="has-header" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {{ t('csv.hasHeader', 'File has a header row') }}
            </label>
          </div>
          
          <p v-if="parseError" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ parseError }}</p>
          
          <!-- Format Hint -->
          <div class="mt-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-2 rounded">
            <p class="font-medium mb-1">{{ t('csv.formatHint', 'CSV Format Example:') }}</p>
            <code class="block bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono overflow-x-auto whitespace-nowrap">
              name,description,price,quantity
              "Product 1","Description here",19.99,2
              "Product 2","Another description",29.99,1
            </code>
          </div>
        </div>
        
        <!-- Preview Data -->
        <div v-if="previewData.length > 0" class="mb-6">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('csv.preview', 'Preview') }}
          </h4>
          
          <div class="overflow-x-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-left">{{ t('receipt.items.name', 'Name') }}</th>
                  <th class="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">{{ t('receipt.items.price', 'Price') }}</th>
                  <th class="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">{{ t('receipt.items.quantity', 'Qty') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(item, index) in previewData" :key="index">
                  <td class="px-3 py-2 text-xs text-gray-900 dark:text-gray-100">{{ item.name }}</td>
                  <td class="px-3 py-2 text-xs text-gray-900 dark:text-gray-100 text-right">{{ item.price.toFixed(2) }}</td>
                  <td class="px-3 py-2 text-xs text-gray-900 dark:text-gray-100 text-right">{{ item.quantity }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ t('csv.previewNote', 'Showing the first few rows. All existing items will be replaced.') }}
          </p>
        </div>
      </div>
      
      <div class="flex justify-end">
        <button 
          @click="closeModal" 
          class="btn-secondary mr-2"
        >
          {{ t('actions.cancel', 'Cancel') }}
        </button>
        
        <button 
          @click="importCSV" 
          class="btn"
          :disabled="!csvFile || isUploading || parseError || importSuccess"
        >
          <template v-if="isUploading">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ t('csv.importing', 'Importing...') }}
          </template>
          <template v-else>
            {{ t('csv.import', 'Import Items') }}
          </template>
        </button>
      </div>
    </div>
  </div>
</template>