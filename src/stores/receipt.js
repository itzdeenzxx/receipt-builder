import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export const useReceiptStore = defineStore('receipt', () => {
  // Receipt data
  const receipt = ref({
    receiptDetails: {
      number: '',
      date: new Date().toISOString().substring(0, 10),
      dueDate: null,
    },
    shop: {
      name: '',
      logo: null,
      address: '',
      phone: '',
      email: '',
      website: ''
    },
    customer: {
      name: '',
      address: '',
      phone: '',
      email: ''
    },
    items: [],
    taxRate: 0,
    discount: 0,
    discountType: 'percentage', // percentage or amount
    notes: '',
    theme: 'modern',
    paymentMethod: 'cash', // new field for payment method
    footer: {
      text: '',
      thankyouMessage: true,
      showPoweredBy: false
    }
  })

  // Computed properties
  const subtotal = computed(() => {
    return receipt.value.items.reduce((total, item) => {
      return total + (Number(item.price) * Number(item.quantity))
    }, 0)
  })

  const discountValue = computed(() => {
    if (receipt.value.discountType === 'percentage') {
      return (Number(receipt.value.discount) / 100) * subtotal.value
    } else {
      return Number(receipt.value.discount)
    }
  })

  const taxValue = computed(() => {
    return (Number(receipt.value.taxRate) / 100) * (subtotal.value - discountValue.value)
  })

  const total = computed(() => {
    return subtotal.value - discountValue.value + taxValue.value
  })

  // Actions
  function addItem(item = {}) {
    const newItem = {
      id: uuidv4(),
      name: item.name || '',
      description: item.description || '',
      price: item.price || 0,
      quantity: item.quantity || 1,
      image: item.image || null
    }
    receipt.value.items.push(newItem)
    return newItem.id
  }

  function removeItem(index) {
    // Updated to handle both ID and index
    if (typeof index === 'number') {
      receipt.value.items.splice(index, 1)
    } else {
      receipt.value.items = receipt.value.items.filter(item => item.id !== index)
    }
  }

  function updateImage(id, imageData) {
    const item = receipt.value.items.find(item => item.id === id)
    if (item) {
      item.image = imageData
    }
  }

  function setShopLogo(imageData) {
    receipt.value.shop.logo = imageData
  }

  // Make sure this method exists and can be called from Home.vue
  function reset() {
    receipt.value = {
      receiptDetails: {
        number: '',
        date: new Date().toISOString().substring(0, 10),
        dueDate: null,
      },
      shop: {
        name: '',
        logo: null,
        address: '',
        phone: '',
        email: '',
        website: ''
      },
      customer: {
        name: '',
        address: '',
        phone: '',
        email: ''
      },
      items: [],
      taxRate: 0,
      discount: 0,
      discountType: 'percentage',
      notes: '',
      theme: 'modern',
      paymentMethod: 'cash',
      footer: {
        text: '',
        thankyouMessage: true,
        showPoweredBy: false
      }
    }
  }
  
  function setPaymentMethod(method) {
    receipt.value.paymentMethod = method;
  }
  
  function saveToLocalStorage() {
    const receiptData = {
      ...receipt.value,
      subtotal: subtotal.value,
      discountValue: discountValue.value,
      taxValue: taxValue.value,
      total: total.value
    };
    
    // Generate a unique ID if there isn't one
    const receiptId = receipt.value.id || uuidv4();
    receiptData.id = receiptId;
    
    // Save to localStorage
    const savedReceipts = JSON.parse(localStorage.getItem('savedReceipts') || '{}');
    savedReceipts[receiptId] = receiptData;
    localStorage.setItem('savedReceipts', JSON.stringify(savedReceipts));
    
    return receiptId;
  }

  // Improved CSV Import functionality
  function importFromCSV(csvData) {
    try {
      const lines = csvData.split('\n');
      
      // Determine if first line is a header
      let startRow = 0;
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('name') && firstLine.includes('price')) {
        startRow = 1; // Skip header
      }
      
      // Clear existing items
      receipt.value.items = [];
      
      // Process data rows
      let importCount = 0;
      for (let i = startRow; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const values = parseCSVLine(line);
        
        if (values.length >= 2) {
          const newItem = {
            id: uuidv4(),
            name: values[0] || 'Unnamed Item',
            description: values[1] || '',
            price: parseFloat(values[2]) || 0,
            quantity: parseInt(values[3]) || 1,
            image: null
          };
          
          receipt.value.items.push(newItem);
          importCount++;
        }
      }
      
      return importCount > 0;
    } catch (error) {
      console.error('Error importing CSV:', error);
      return false;
    }
  }
  
  // Improved CSV parsing function
  function parseCSVLine(line) {
    const result = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    result.push(currentValue.trim());
    
    return result;
  }

  // Expose state and methods
  return {
    receipt,
    subtotal,
    discountValue,
    taxValue,
    total,
    addItem,
    removeItem,
    updateImage,
    setShopLogo,
    reset, // Make sure this is returned
    setPaymentMethod,
    saveToLocalStorage,
    importFromCSV
  }
})
