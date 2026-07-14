<template>
  <main class="relative min-h-screen">
    <!-- Dark / Light toggle -->
    <div class="absolute right-4 top-4 z-50">
      <button @click="toggleColorMode"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/30 text-slate-800 backdrop-blur-xl transition hover:bg-white/50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        aria-label="Toggle Dark Mode">
        <svg v-if="colorMode.value === 'dark'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    </div>

    <div
      class="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-4 py-10 select-none">
      <LogoSection />

      <div
        class="mb-4 w-full grid grid-cols-1 gap-3 rounded-3xl border border-black/10 bg-white/30 p-3 shadow-2xl shadow-black/10 backdrop-blur-2xl lg:grid-cols-2 dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
        <Card v-for="(card, index) in cards" :key="card.title" :title="card.title" :imageUrl="card.imageUrl"
          :website="card.website" class="card-enter" :style="{ animationDelay: `${index * 80}ms` }" />
      </div>

      <Footer />
    </div>

    <!-- Liquid glass background: base gradient + soft blurred color blobs -->
    <div
      class="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 transition-colors duration-500 dark:from-slate-950 dark:via-slate-900 dark:to-black">
      <div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-500/30">
      </div>
      <div class="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/20">
      </div>
      <div class="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/20"></div>
    </div>
  </main>
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
  ogImage: "/icon/threads.png",
  twitterCard: "summary_large_image",
});
</script>

<style scoped>
@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-enter {
  opacity: 0;
  animation: card-enter 0.5s ease-out forwards;
}
</style>
