<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { cldUrl, cldSrcset } from "../lib/cld";
import MobileCardMeta from "./MobileCardMeta.vue";

const props = defineProps({
  items: { type: Array, required: true },
  layoutPaused: { type: Boolean, default: false },
  locale: { type: String, default: "zh" },
});

const translations = {
  en: {
    empty: "No works match the current filters.",
    emptyHint: "Try removing a tag or switching back to “All works”.",
  },
  ja: {
    empty: "現在の絞り込み条件に一致する作品はありません。",
    emptyHint: "タグを1つ解除するか、「すべての作品」に戻ってみてください。",
  },
  zh: {
    empty: "目前的篩選條件沒有符合的作品。",
    emptyHint: "試著取消一個標籤，或切回「全部作品」。",
  },
};
const copy = computed(() => translations[props.locale] ?? translations.zh);

const emit = defineEmits(["open"]);

// 篩選(series/tag)一改變,props.items 就換新陣列;bump 這個 key 讓所有 cell 重新掛載,
// 連留存的圖片也重跑一次依序淡入,切換 tag 也有過場動畫
const revealKey = ref(0);
watch(
  () => props.items,
  async () => {
    revealKey.value++;
    await nextTick();
    requestLayout();
    if (resizeObserver && grid.value && !props.layoutPaused) {
      resizeObserver.disconnect();
      resizeObserver.observe(grid.value);
    }
  }
);

// 以容器寬度計算 grid row span，維持「左至右、再往下」的 DOM 排序。
// 首次量測完成前不顯示 cells，避免預設短 row 讓圖片暫時互相重疊。
const grid = ref(null);
const columnWidth = ref(0);
const rowUnit = ref(8);
const rowGap = ref(18);
const layoutReady = ref(false);
const frozenWidth = ref(null);

function measureLayout() {
  const el = grid.value;
  if (!el) return;

  const styles = getComputedStyle(el);
  const columnCount =
    parseInt(styles.getPropertyValue("--column-count"), 10) || 1;
  const columnGap = parseFloat(styles.columnGap) || 0;
  const paddingX =
    (parseFloat(styles.paddingLeft) || 0) +
    (parseFloat(styles.paddingRight) || 0);
  const availableWidth = el.clientWidth - paddingX;
  const measuredWidth =
    (availableWidth - columnGap * (columnCount - 1)) / columnCount;

  rowUnit.value = parseFloat(styles.gridAutoRows) || 8;
  rowGap.value = parseFloat(styles.rowGap) || 0;
  if (measuredWidth > 0) {
    columnWidth.value = measuredWidth;
    layoutReady.value = true;
  }
}

function requestLayout() {
  if (props.layoutPaused) return;
  measureLayout();
}

watch(
  () => props.layoutPaused,
  async (paused) => {
    const el = grid.value;
    if (!el) return;

    if (paused) {
      frozenWidth.value = `${el.getBoundingClientRect().width}px`;
      resizeObserver?.disconnect();
      return;
    }

    frozenWidth.value = null;
    await nextTick();
    measureLayout();
    resizeObserver?.observe(el);
  },
  { flush: "post" }
);

function cellStyle(item) {
  if (!columnWidth.value || !item.width || !item.height) return {};
  const imageHeight = (columnWidth.value * item.height) / item.width;
  const span = Math.max(
    1,
    Math.ceil((imageHeight + rowGap.value) / (rowUnit.value + rowGap.value))
  );
  return { gridRowEnd: `span ${span}` };
}

let resizeObserver;
onMounted(() => {
  measureLayout();
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(requestLayout);
    if (grid.value) resizeObserver.observe(grid.value);
  }
  window.addEventListener("resize", requestLayout, { passive: true });
});
onUnmounted(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("resize", requestLayout);
});

// 圖片載入後淡入;class 非 Vue 綁定,patch 不會清掉,keyed 新元素則是乾淨狀態
function reveal(e) {
  e.target.classList.add("is-loaded");
}
// 依 index 錯開淡入(前幾張依序,之後共用上限延遲,避免下方 lazy 圖等太久)
function revealDelay(i) {
  return `${Math.min(i, 10) * 40}ms`;
}
</script>

<template>
  <div
    v-if="items.length"
    ref="grid"
    class="masonry"
    :class="{ 'is-ready': layoutReady }"
    :style="{ width: frozenWidth }"
  >
    <figure
      v-for="(item, i) in items"
      :key="`${revealKey}|${item.publicId}`"
      class="cell"
      :style="cellStyle(item)"
    >
      <button class="cell-btn" @click="emit('open', i)" :aria-label="item.title || item.publicId">
        <!-- zoomer:hover 時放大內層圖片,溢出由 .cell-btn 的圓角裁切 -->
        <div class="zoomer" @contextmenu.prevent>
          <img
            :src="cldUrl(item, 600, 'eco')"
            :srcset="cldSrcset(item, undefined, 'eco')"
            sizes="(max-width: 800px) 50vw, (max-width: 1100px) 30vw, 22vw"
            :width="item.width"
            :height="item.height"
            :alt="item.title || ''"
            :style="{ transitionDelay: `${revealDelay(i)}, 0s` }"
            loading="lazy"
            decoding="async"
            draggable="false"
            @load="reveal"
            @error="reveal"
          />
        </div>
        <figcaption v-if="item.title || item.series || item.tags?.length" class="cap">
          <span class="desktop-card-heading desktop-card-meta">
            <span v-if="item.title" class="cap-title">{{ item.title }}</span>
            <span v-if="item.series" class="cap-series">{{ item.series }}</span>
          </span>
          <span v-if="item.tags?.length" class="desktop-card-tags desktop-card-meta">
            <span v-for="tag in item.tags" :key="tag" class="desktop-card-tag">
              #{{ tag }}
            </span>
          </span>
          <MobileCardMeta
            :title="item.title"
            :series="item.series"
            :tags="item.tags"
          />
        </figcaption>
      </button>
    </figure>
  </div>

  <div v-else class="empty">
    <p>{{ copy.empty }}</p>
    <p class="empty-hint">{{ copy.emptyHint }}</p>
  </div>
</template>

<style scoped>
.masonry {
  --column-count: 4;

  display: grid;
  grid-template-columns: repeat(var(--column-count), minmax(0, 1fr));
  grid-auto-rows: 8px;
  column-gap: 18px;
  row-gap: 18px;
  padding: 32px;
}

.cell {
  margin: 0;
  visibility: hidden;
}

.masonry.is-ready .cell {
  visibility: visible;
}

.cell-btn {
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
  border-radius: 4px; /* 縮圖小圓角 */
  background: var(--panel); /* 載入中的佔位底色 */
}

/* zoomer:承載 hover 放大;transition 參考 kvn 元件的 .zoomer 曲線 */
.zoomer {
  display: block;
  transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

.cell-btn:hover .zoomer {
  transform: scale(1.05);
}

.cell img {
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
  opacity: 0; /* 預設透明,載入後淡入 */
  transition: opacity 0.5s ease, filter 0.2s ease;
}

.cell img.is-loaded {
  opacity: 1;
}

.cell-btn:hover img {
  filter: brightness(0.88);
}

.cap {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: stretch;
  gap: 5px;
  padding: 24px 12px 10px;
  background: linear-gradient(transparent, rgba(10, 11, 13, 0.82));
  opacity: 1;
  transition: opacity 0.2s ease;
  text-align: left;
}

.cell-btn:hover .cap,
.cell-btn:focus-visible .cap {
  opacity: 1;
}

.desktop-card-heading {
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.cap-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #fff;
  font-family: var(--font-display);
  font-size: clamp(12px, 1vw, 14px);
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.88);
}

.cap-series {
  flex-shrink: 0;
  color: #fff;
  font-family: var(--font-mono);
  font-size: clamp(8px, 0.72vw, 10px);
  letter-spacing: 0.08em;
  white-space: nowrap;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.88);
}

.desktop-card-tags {
  max-height: 20px;
  display: flex;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
}

.desktop-card-tag {
  flex-shrink: 0;
  padding: 1px 5px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  color: #fff;
  background: rgba(0, 0, 0, 0.28);
  font-family: var(--font-mono);
  font-size: clamp(7px, 0.65vw, 9px);
  line-height: 1.45;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.88);
}

.empty {
  padding: 80px 32px;
  text-align: center;
  color: var(--muted);
}

.empty-hint {
  font-size: 13px;
}

@media (max-width: 1100px) {
  .masonry {
    --column-count: 3;
  }
}

@media (max-width: 860px) {
  .masonry {
    --column-count: 3;

    padding: 20px;
    column-gap: 14px;
    row-gap: 14px;
  }

  .cap {
    align-items: flex-end;
    padding: 28px 8px 7px;
    opacity: 1;
    pointer-events: none;
  }

  .desktop-card-meta {
    display: none;
  }
}

@media (max-width: 800px) {
  .masonry {
    --column-count: 2;
  }
}
</style>
