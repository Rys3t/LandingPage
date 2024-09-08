<template>
    <aside
        id="default-sidebar"
        class="fixed top-0 left-0 z-50 w-64 h-full transition-transform duration-300 bg-gray-800 select-none md:translate-x-0"
        :class="{
            '-translate-x-full ': !bDrawerVisible,
            'translate-x-0': bDrawerVisible
        }">
        <div class="h-full px-3 py-4">
            <button @click="toggleDrawer" class="text-white">顯示</button>
            <ul class="space-y-2 font-medium">
                <li>
                    <NuxtLink
                        to="/"
                        class="flex items-center p-2 text-white rounded-lg cursor-pointer hover:bg-gray-700">
                        <span class="ml-3">About</span>
                    </NuxtLink>
                </li>
            </ul>
        </div>
    </aside>

    <div
        class="fixed inset-0 z-30 transition-opacity duration-300 bg-gray-900/50 backdrop-blur-md"
        :class="{
            'opacity-0': !bDrawerVisible,
            'opacity-100': bDrawerVisible
        }"
        v-if="bDrawerVisible"
        @click="toggleDrawer"></div>
</template>

<script setup>
const bDrawerVisible = ref(false)

const toggleDrawer = () => {
    bDrawerVisible.value = !bDrawerVisible.value
}
</script>
