<script setup>
defineProps({
  title: { type: String, default: "" },
  series: { type: String, default: "" },
  tags: { type: Array, default: () => [] },
});
</script>

<template>
  <span class="mobile-card-meta" aria-hidden="true">
    <span v-if="title" class="mobile-card-title">{{ title }}</span>
    <span v-if="series" class="mobile-card-series">{{ series }}</span>
    <span v-if="tags.length" class="mobile-card-tags">
      {{ tags.map((tag) => `#${tag}`).join(" ") }}
    </span>
  </span>
</template>

<style scoped>
.mobile-card-meta {
  display: none;
}

@media (max-width: 860px) {
  .mobile-card-meta {
    min-width: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .mobile-card-title,
  .mobile-card-series,
  .mobile-card-tags {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #fff;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.88);
  }

  .mobile-card-title {
    font-family: var(--font-display);
    font-size: clamp(9px, 2vw, 11px);
    line-height: 1.3;
  }

  .mobile-card-series {
    font-family: var(--font-mono);
    font-size: clamp(7px, 1.55vw, 9px);
    line-height: 1.3;
    letter-spacing: 0.05em;
  }

  .mobile-card-tags {
    font-family: var(--font-mono);
    font-size: clamp(7px, 1.45vw, 8px);
    line-height: 1.3;
    letter-spacing: 0.02em;
  }
}
</style>
