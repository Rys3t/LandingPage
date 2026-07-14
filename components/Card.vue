<template>
  <main
    class="group relative z-10 cursor-pointer rounded-2xl border border-black/10 bg-white/40 p-4 shadow-lg shadow-black/5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-black/20 hover:bg-white/60 hover:shadow-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30 dark:hover:border-white/20 dark:hover:bg-white/10"
    @click="clickHandler(website)"
  >
    <div class="relative flex items-center">
      <img :src="imageUrl" class="max-h-12 rounded-lg" alt="Image" />
      <p class="my-2 ml-3 font-mono text-lg font-bold text-slate-800 transition-colors duration-300 dark:text-white">
        {{ title }}
      </p>
    </div>
  </main>
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

const clickHandler = (site) => {
  if (site) {
    window.open(site, "_blank");
  }
};
</script>
