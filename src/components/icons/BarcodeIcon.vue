<template>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="props.class">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h2v10H7V7zm4 0h1v10h-1V7zm2 0h3v10h-3V7zm4 0h1v10h-1V7z" />
  </svg>
</template>

<script setup>
const props = defineProps({
  class: {
    type: String,
    default: 'h-6 w-6'
  }
});
</script>
