<template>
  <div
    class="mb-6 w-full rounded-3xl border border-black/10 bg-white/30 py-6 shadow-2xl shadow-black/10 backdrop-blur-2xl"
  >
    <img
      class="mx-auto h-24 w-24 rounded-full border border-black/10 object-cover shadow-lg"
      id="logo"
      src="/icon/logo.png"
      alt="Rys3t_ avatar"
    />
    <p class="py-2 text-center font-mono text-2xl font-semibold text-slate-800">Rys3t_</p>

    <div class="flex items-center justify-center">
      <p
        class="py-2 text-center font-mono text-slate-600 transition-opacity duration-100"
        :class="{ 'opacity-0': isFading }"
      >
        {{ bio }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

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
  return bios.value[currentIndex.value];
}

let intervalId;

onMounted(() => {
  intervalId = setInterval(() => {
    isFading.value = true;
    setTimeout(() => {
      bio.value = getBio();
      isFading.value = false;
    }, 100);
  }, 3000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>
