<template>
  <main
    class="group relative z-10 rounded-lg bg-white transition duration-300 hover:cursor-pointer"
    @click="clickHandler(website)"
    @scroll="onScroll"
  >
    <!-- 陰影 -->
    <div
      class="absolute -inset-2 -z-50 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100"
    ></div>
    <!--圖片與文字 -->
    <div class="relative flex items-center rounded-lg bg-white p-6 hover:bg-slate-200">
      <img :src="imageUrl" class="max-h-12 rounded-lg" alt="Image" />
      <p class="my-2 ml-3 font-mono text-lg font-bold text-gray-800 duration-300">
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
const onScroll = ({ target: { scrollTop, clientHeight, scrollHeight } }) => {
  if (scrollTop + clientHeight >= scrollHeight) {
    this.loadMorePosts();
  }
};
</script>

<style scoped></style>
