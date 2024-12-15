<template>
  <aside
    id="default-sidebar"
    class="fixed left-0 top-0 z-50 h-full w-64 select-none bg-gray-800 transition-transform duration-300 md:translate-x-0"
    :class="{
      '-translate-x-full': !bDrawerVisible,
      'translate-x-0': bDrawerVisible,
    }"
  >
    <div class="h-full px-3 py-4">
      <button @click="toggleDrawer" class="text-white">顯示</button>
      <ul class="space-y-2 font-medium">
        <li>
          <NuxtLink to="/" class="flex cursor-pointer items-center rounded-lg p-2 text-white hover:bg-gray-700">
            <span class="ml-3">About</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </aside>

  <div
    class="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-md transition-opacity duration-300"
    :class="{
      'opacity-0': !bDrawerVisible,
      'opacity-100': bDrawerVisible,
    }"
    v-if="bDrawerVisible"
    @click="toggleDrawer"
  ></div>
</template>

<script setup>
const bDrawerVisible = ref(false);

const toggleDrawer = () => {
  bDrawerVisible.value = !bDrawerVisible.value;
};
</script>
