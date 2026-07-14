<template>
  <div
    class="mb-6 w-full rounded-3xl border border-black/10 bg-white/30 py-6 shadow-2xl shadow-black/10 backdrop-blur-2xl transition-colors duration-500 dark:border-white/10 dark:bg-white/5 dark:shadow-black/40"
  >
    <img
      class="mx-auto h-24 w-24 rounded-full border border-black/10 object-cover shadow-lg dark:border-white/20"
      id="logo"
      src="/icon/logo.png"
    />
    <p class="py-2 text-center font-mono text-2xl font-semibold text-slate-800 dark:text-white">Rys3t_</p>

    <div class="flex items-center justify-center">
      <p
        class="py-2 text-center font-mono text-slate-600 transition-opacity duration-100 dark:text-gray-300"
        :class="{ 'opacity-0': isFading }"
      >
        {{ bio }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const bio = ref("💻 Software Engineer");
const isFading = ref(false);

const bios = ref([
  "📷 Hobbyist Photographer",
  "🎵 Music Enthusiast",
  "🎮 Gamer",
  "📚 Bookworm",
  "🍜 Foodie",
  "💻 Software Engineer",
]);
const currentIndex = ref(-1);

function getBio() {
  currentIndex.value = (currentIndex.value + 1) % bios.value.length;
  if (currentIndex.value >= bios.value.length) {
    currentIndex.value = 0;
  }
  const bio = bios.value[currentIndex.value];
  return bio;
}

onMounted(() => {
  setInterval(() => {
    isFading.value = true;
    setTimeout(() => {
      bio.value = getBio();
      isFading.value = false;
    }, 100);
  }, 3000);
});
</script>
