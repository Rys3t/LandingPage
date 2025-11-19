<template>
  <!-- <SideBar /> -->
  <main class="relative min-h-screen">
    <!-- Dark Mode Toggle -->
    <div class="absolute right-4 top-4 z-50">
      <button
        @click="toggleColorMode"
        class="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/30"
        aria-label="Toggle Dark Mode"
      >
        <!-- Sun icon for dark mode (click to go light) -->
        <svg v-if="colorMode.value === 'dark'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <!-- Moon icon for light mode (click to go dark) -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    </div>

    <!-- md:ml-72 -->
    <div class="mx-auto flex min-h-screen w-4/5 flex-col items-center justify-center py-10 select-none">
      <LogoSection />

      <div class="mb-4 w-full grid grid-cols-1 gap-3 rounded-lg bg-white/80 p-2 shadow-lg lg:grid-cols-2 xl:grid-cols-4 dark:bg-gray-800/80">
        <Card
          v-for="card in cards"
          :key="card.title"
          :title="card.title"
          :imageUrl="card.imageUrl"
          :website="card.website"
        />
      </div>
      
      <Footer />
    </div>
  </main>
  <div class="fixed inset-0 -z-50 bg-gradient-to-b from-gray-500 to-gray-800 dark:from-gray-900 dark:to-black transition-colors duration-500"></div>
</template>

<script setup>
const { cards } = useSocials();
const colorMode = useColorMode();

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

useSeoMeta({
  title: "Rys3t's Landing Page",
  ogTitle: "Rys3t's Landing Page",
  description: "Connect with Rys3t across all social platforms.",
  ogDescription: "Connect with Rys3t across all social platforms.",
  ogImage: "/icon/threads.png", // Using threads icon as a placeholder or main image
  twitterCard: "summary_large_image",
});

// Removed forced light mode to allow system preference or future toggle
// definePageMeta({
//   colorMode: "light",
// });
</script>
