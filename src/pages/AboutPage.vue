<script setup>
import LandingProfile from "../components/landing/LandingProfile.vue";
import SocialCard from "../components/landing/SocialCard.vue";
import LandingFooter from "../components/landing/LandingFooter.vue";
import { socialCards } from "../data/socials";

defineProps({ galleryHref: { type: String, default: "/gallery/" } });
const emit = defineEmits(["show-gallery"]);

function openCard(event, card) {
  if (card.external !== false || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  emit("show-gallery");
}
</script>

<template>
  <section class="landing-page" aria-labelledby="profile-title">
    <div class="page-content">
      <LandingProfile />
      <div class="social-grid">
        <SocialCard v-for="card in socialCards" :key="card.title" v-bind="card"
          :website="card.external === false ? galleryHref : card.website" @click="openCard($event, card)" />
      </div>
      <LandingFooter />
    </div>
  </section>
</template>

<style scoped>
.landing-page {
  position: relative;
  min-height: calc(100vh - var(--header-h));
  color-scheme: dark;
}

.landing-page ::selection {
  background: var(--accent);
  color: var(--bg);
}

.page-content {
  position: relative;
  margin: 0 auto;
  display: flex;
  min-height: calc(100vh - var(--header-h));
  width: 100%;
  max-width: 768px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}

.social-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  gap: 12px;
  padding: 12px;
  margin-bottom: 16px;
  border: 1px solid var(--line);
  background: var(--panel);
}

@media (min-width: 1024px) {
  .social-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
