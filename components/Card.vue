<template>
  <main
    class="group relative rounded-lg bg-white p-6 transition duration-300 hover:cursor-pointer hover:bg-slate-400"
    @click="clickHandler(website)"
    @scroll="onScroll"
  >
    <div class="flex items-center">
      <img :src="imageUrl" class="max-h-12 rounded-lg" alt="Image" />
      <p
        class="my-2 ml-3 text-lg font-bold text-gray-800 duration-300 group-hover:text-white"
      >
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

<style scoped>
.filltest:hover,
.filltest:focus {
  box-shadow: inset 0 0 0 2em var(--hover);
}
</style>
