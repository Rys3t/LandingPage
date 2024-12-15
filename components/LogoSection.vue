<template>
  <div class="m-4 mx-auto w-full rounded-lg bg-white bg-opacity-80 py-4 shadow-lg">
    <img class="mx-auto h-24 w-24 rounded-full" id="logo" src="/public/icon/logo.png" />
    <p class="py-2 text-center font-mono text-2xl font-semibold">Rys3t_</p>

    <div class="flex items-center justify-center">
      <p
        class="py-2 text-center font-mono text-black transition-opacity duration-100"
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
