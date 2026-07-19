<template>
  <main class="relative min-h-screen">
    <div
      class="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-4 py-10 select-none">
      <LogoSection />

      <div
        class="mb-4 w-full grid grid-cols-1 gap-3 rounded-3xl border border-black/10 bg-white/30 p-3 shadow-2xl shadow-black/10 backdrop-blur-2xl lg:grid-cols-2">
        <Card v-for="(card, index) in cards" :key="card.title" :title="card.title" :imageUrl="card.imageUrl"
          :website="card.website" class="card-enter" :style="{ animationDelay: `${index * 80}ms` }" />
      </div>

      <Footer />
    </div>

    <!-- Solid off-white background -->
    <div class="fixed inset-0 -z-10 bg-[#f5f0e4]"></div>
  </main>
</template>

<script setup>
const { cards } = useSocials();

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
