<template>
    <button @click="toggleDrawer">顯示</button>
    <aside
        id="default-sidebar"
        class="fixed mt-16 z-50 w-64 h-[calc(100vh-4rem)] transition-transform duration-300 md:translate-x-0"
        :class="{
            '-translate-x-full ': !bDrawerVisible,
            'translate-x-0': bDrawerVisible
        }">
        <div class="h-full px-3 py-4 overflow-y-auto bg-gray-800">
            <ul class="space-y-2 font-medium">
                <li>
                    <a
                        class="flex items-center p-2 text-white rounded-lg hover:bg-gray-700">
                        <span class="ms-3">test</span>
                    </a>
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
