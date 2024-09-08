<template>
    <div
        class="w-full py-4 m-4 mx-auto bg-white rounded-lg shadow-lg bg-opacity-80">
        <img
            class="w-24 h-24 mx-auto rounded-full"
            id="logo"
            src="/public/icon/logo.png" />
        <p class="py-2 text-2xl font-semibold text-center">Rys3t_</p>

        <div class="flex items-center justify-center">
            <p
                class="py-2 text-center text-black transition-opacity duration-100"
                :class="{'opacity-0': isFading}">
                {{ bio }}
            </p>
        </div>
    </div>
</template>

<script setup>
import {ref, onMounted} from "vue"

const bio = ref("💻 Software Engineer")
const isFading = ref(false)

const bios = ref([
    "📷 Hobbyist Photographer",
    "🎮 Gamer",
    "💻 Software Engineer"
])
const currentIndex = ref(0)

function getBio() {
    currentIndex.value = (currentIndex.value + 1) % bios.value.length
    if (currentIndex.value >= bios.value.length) {
        currentIndex.value = 0
    }
    const bio = bios.value[currentIndex.value]
    return bio
}

onMounted(() => {
    setInterval(() => {
        isFading.value = true
        setTimeout(() => {
            bio.value = getBio()
            isFading.value = false
        }, 100)
    }, 3000)
})
</script>
