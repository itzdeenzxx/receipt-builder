<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import JsBarcode from 'jsbarcode'

const props = defineProps({
  value: {
    type: String,
    required: true
  },
  format: {
    type: String,
    default: 'CODE128'
  },
  width: {
    type: Number,
    default: 2
  },
  height: {
    type: Number,
    default: 100
  },
  displayValue: {
    type: Boolean,
    default: true
  },
  lineColor: {
    type: String,
    default: '#000000'
  },
  background: {
    type: String,
    default: '#ffffff'
  }
})

const barcodeRef = ref(null)
const errorMessage = ref('')

const validValue = computed(() => {
  // Different barcode formats have different validation rules
  try {
    switch (props.format) {
      case 'EAN13':
        // EAN13 requires exactly 12 or 13 digits (13th is check digit)
        if (!/^\d{12,13}$/.test(props.value)) {
          errorMessage.value = 'EAN13 requires exactly 12 or 13 digits'
          return '590123412345' // Valid default EAN13
        }
        break
      case 'EAN8':
        // EAN8 requires exactly 7 or 8 digits
        if (!/^\d{7,8}$/.test(props.value)) {
          errorMessage.value = 'EAN8 requires exactly 7 or 8 digits'
          return '9638527' // Valid default EAN8
        }
        break
      case 'UPC':
        // UPC requires exactly 11 or 12 digits
        if (!/^\d{11,12}$/.test(props.value)) {
          errorMessage.value = 'UPC requires exactly 11 or 12 digits'
          return '123456789012' // Valid default UPC
        }
        break
      case 'CODE39':
        // CODE39 allows alphanumeric plus some special chars
        if (!/^[A-Z0-9\-\.\ \$\/\+\%]+$/i.test(props.value)) {
          errorMessage.value = 'CODE39 only allows alphanumeric and -.$/+% characters'
          return 'CODE39' // Valid default CODE39
        }
        break
      case 'ITF14':
        // ITF14 requires exactly 14 digits
        if (!/^\d{14}$/.test(props.value)) {
          errorMessage.value = 'ITF14 requires exactly 14 digits'
          return '12345678901234' // Valid default ITF14
        }
        break
      case 'CODE128':
      default:
        // CODE128 allows any character
        errorMessage.value = ''
        return props.value
    }
    
    errorMessage.value = ''
    return props.value
  } catch (error) {
    errorMessage.value = 'Invalid barcode value'
    return 'INVALID'
  }
})

const generateBarcode = () => {
  if (barcodeRef.value) {
    try {
      JsBarcode(barcodeRef.value, validValue.value, {
        format: props.format,
        width: props.width,
        height: props.height,
        displayValue: props.displayValue,
        lineColor: props.lineColor,
        background: props.background,
        margin: 10,
        fontSize: 16
      })
      errorMessage.value = ''
    } catch (error) {
      console.error('Failed to generate barcode:', error)
      errorMessage.value = 'Failed to generate barcode'
    }
  }
}

onMounted(() => {
  generateBarcode()
})

watch([() => props.value, () => props.format], () => {
  generateBarcode()
})
</script>

<template>
  <div>
    <svg ref="barcodeRef"></svg>
    <p v-if="errorMessage" class="text-red-500 text-sm mt-2">
      {{ errorMessage }}
    </p>
    <p v-if="format !== 'CODE128'" class="text-amber-500 text-sm mt-2">
      Note: {{ format }} has specific format requirements. Using a compatible value.
    </p>
  </div>
</template>
