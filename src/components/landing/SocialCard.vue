<template>
  <a :href="website" :target="external ? '_blank' : undefined" rel="noopener noreferrer" class="social-card"
    :aria-label="external ? title + ' (opens in a new tab)' : title">
    <div class="card-content">
      <img :src="imageUrl" :class="{ 'rounded-icon': roundedIcon }" alt="" />
      <p>{{ title }}</p>
    </div>
  </a>
</template>
<script setup>
defineProps({
  external: { type: Boolean, default: true },
  roundedIcon: { type: Boolean, default: false },
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  website: { type: String, required: true },
});
</script>
<style scoped>
.social-card {
  position: relative;
  display: block;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
  color: var(--text);
  text-decoration: none;
  transition:
    background-color 160ms,
    color 160ms,
    border-color 160ms;
}

.card-content {
  position: relative;
  display: flex;
  align-items: center;
}

img {
  display: block;
  max-height: 48px;
  max-width: 48px;
  object-fit: contain;
}

.rounded-icon {
  border-radius: 20%;
}

p {
  margin: 8px 0 8px 12px;
  font-size: 18px;
  line-height: 28px;
  font-weight: 700;
  letter-spacing: -0.4px;
}

.social-card:hover,
.social-card:focus-visible {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
}

@media (prefers-reduced-motion: reduce) {
  .social-card {
    transition: none;
  }
}
</style>
