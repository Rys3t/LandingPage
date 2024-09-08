<template>
    <!-- <SideBar /> -->
    <main class="">
        <!-- md:ml-72 -->
        <div
            class="flex-col items-center justify-center w-4/5 h-full mx-auto select-none">
            <LogoSection />

            <div
                class="grid grid-cols-1 gap-2 p-2 mb-4 rounded-lg lg:grid-cols-2 xl:grid-cols-4 bg-white/80">
                <Card
                    v-for="card in cards"
                    :key="card.title"
                    :title="card.title"
                    :imageUrl="card.imageUrl"
                    :website="card.website" />
            </div>
        </div>
    </main>
    <bg
        class="fixed inset-0 from-gray-500 to-gray-800 bg-gradient-to-b -z-50"></bg>
</template>

<script setup>
const cards = reactive([
    {
        title: "Twitter",
        imageUrl: "/icon/twitter.png",
        website: "https://x.com/Rys3t_"
    },
    {
        title: "Youtube",
        imageUrl: "/icon/youtube.png",
        website: "https://www.youtube.com/@Rys3t_"
    },
    {
        title: "Github",
        imageUrl: "/icon/github.png",
        website: "https://github.com/Rys3t"
    },
    {
        title: "Steam",
        imageUrl: "/icon/steam.png",
        website: "https://steamcommunity.com/id/Rys3t_/"
    },
    {
        title: "Facebook",
        imageUrl: "/icon/facebook.png",
        website: "https://www.facebook.com/ryu.tactival/"
    },
    {
        title: "SoundCloud",
        imageUrl: "/icon/soundcloud.png",
        website: "https://soundcloud.com/rys3t"
    },
    {
        title: "Instagram",
        imageUrl: "/icon/instagram.png",
        website: "https://www.instagram.com/rys3t_/"
    }
])
definePageMeta({
    colorMode: "light"
})
</script>
