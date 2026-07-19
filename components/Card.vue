<template>
  <a
    :href="website"
    target="_blank"
    rel="noopener noreferrer"
    class="group relative z-10 block cursor-pointer rounded-2xl border border-black/10 bg-white/40 p-4 shadow-lg shadow-black/5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-black/20 hover:bg-white/60 hover:shadow-xl"
  >
    <div class="relative flex items-center">
      <img :src="imageUrl" class="max-h-12 rounded-lg" :alt="title" />
      <p class="my-2 ml-3 font-mono text-lg font-bold text-slate-800 transition-colors duration-300">
        {{ title }}
      </p>
    </div>
  </a>
</template>
<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    required: false,
  },
});
</script>
