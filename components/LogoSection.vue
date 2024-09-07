<template>
    <div
        class="w-full py-4 m-4 mx-auto bg-white rounded-lg shadow-lg bg-opacity-80">
        <img
            class="w-24 h-24 mx-auto rounded-full"
            id="logo"
            src="/public/icon/logo.png" />
        <p class="py-2 text-2xl font-semibold text-center">Rys3t_</p>
        <p class="py-2 text-center text-black">{{ bio }}</p>
    </div>
</template>

<script setup>
const bio = ref(
    "💻 Software Engineer | 📷 Hobbyist Photographer | 🎮 Gacha Games Enjoyer"
)
</script>
