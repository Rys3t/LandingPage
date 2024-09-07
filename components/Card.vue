<template>
    <main
        class="relative p-6 transition duration-300 bg-white rounded-lg hover:cursor-pointer hover:bg-slate-300 scrollreveal"
        @click="clickHandler(website)"
        @scroll="onScroll">
        <div class="flex items-center">
            <img :src="imageUrl" class="rounded-lg max-h-12" alt="Image" />
            <h3 class="my-2 ml-3 text-lg font-bold text-gray-800">
                {{ title }}
            </h3>
        </div>
    </main>
</template>
<script setup>
defineProps({
    title: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    website: {
        type: String,
        required: false
    }
})

const clickHandler = (site) => {
    if (site) {
        window.open(site, "_blank")
    }
}
const onScroll = ({target: {scrollTop, clientHeight, scrollHeight}}) => {
    if (scrollTop + clientHeight >= scrollHeight) {
        this.loadMorePosts()
    }
}
</script>
