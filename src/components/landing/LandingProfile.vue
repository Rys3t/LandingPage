<template>
  <section class="profile" aria-labelledby="profile-title">
    <img id="logo" class="avatar" :src="avatarUrl" alt="Rys3t's avatar" width="96" height="96" />
    <div class="bio-wrap">
      <p class="bio" :class="{ fading: isFading }">{{ bio }}</p>
    </div>
  </section>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import avatarUrl from "../../assets/social/logo.png";
const bios = ["Software Engineer", "Hobbyist Photographer", "Music Enthusiast", "Gamer", "Bookworm", "Foodie"];
const bio = ref(bios[0]);
const isFading = ref(false);
let currentIndex = 0;
let intervalId;
let timeoutId;
onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  intervalId = setInterval(() => {
    isFading.value = true;
    timeoutId = setTimeout(() => {
      currentIndex = (currentIndex + 1) % bios.length;
      bio.value = bios[currentIndex];
      isFading.value = false;
    }, 160);
  }, 3000);
});
onUnmounted(() => {
  clearInterval(intervalId);
  clearTimeout(timeoutId);
});
</script>
<style scoped>
.profile {
  width: 100%;
  margin-bottom: 24px;
  padding: 24px 0;
  border: 1px solid var(--line);
  border-top-color: var(--accent);
  background: var(--panel);
}

.avatar {
  display: block;
  width: 96px;
  height: 96px;
  margin: 0 auto;
  border: 1px solid var(--text);
  border-radius: 50%;
  object-fit: cover;
}

h1 {
  margin: 0;
  padding: 8px 0;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  letter-spacing: -1px;
}

h1 span {
  color: var(--accent);
}

.bio-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bio {
  margin: 0;
  padding: 8px 0;
  text-align: center;
  font-size: 16px;
  line-height: 24px;
  color: var(--muted);
  transition: opacity 160ms;
}

.fading {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .bio {
    transition: none;
  }
}
</style>
