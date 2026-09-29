<script setup>
// 全螢幕燈箱(大圖檢視):由 App.vue 以 v-if 控制開關,顯示目前點選的照片
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { watermarkedUrl } from "../lib/cld";

const props = defineProps({
  items: { type: Array, required: true }, // 目前篩選後的照片清單
  index: { type: Number, required: true }, // 要顯示哪一張(清單索引)
});

// 篩選事件由 App.vue 寫回網址並關閉燈箱。
const emit = defineEmits(["close", "navigate", "select-series", "select-tag"]);

const MIN_ZOOM = 1;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;
const frame = ref(null);
const activeImage = ref(null);
const zoomScale = ref(MIN_ZOOM);
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);

const zoomPercent = computed(() => Math.round(zoomScale.value * 100));
const zoomStyle = computed(() => ({
  transform: `translate3d(${panX.value}px, ${panY.value}px, 0) scale(${zoomScale.value})`,
}));

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampPan() {
  if (zoomScale.value <= MIN_ZOOM || !frame.value) {
    panX.value = 0;
    panY.value = 0;
    return;
  }

  const maxX = (frame.value.clientWidth * (zoomScale.value - 1)) / 2;
  const maxY = (frame.value.clientHeight * (zoomScale.value - 1)) / 2;
  panX.value = clamp(panX.value, -maxX, maxX);
  panY.value = clamp(panY.value, -maxY, maxY);
}


function onViewportResize() {
  clampPan();
}

function setZoom(nextScale) {
  zoomScale.value = clamp(
    Math.round(nextScale * 100) / 100,
    MIN_ZOOM,
    MAX_ZOOM
  );

  if (zoomScale.value === MIN_ZOOM) {
    panX.value = 0;
    panY.value = 0;
  } else {
    requestAnimationFrame(clampPan);
  }
}

function zoomIn() {
  setZoom(zoomScale.value + ZOOM_STEP);
}

function zoomOut() {
  setZoom(zoomScale.value - ZOOM_STEP);
}

function resetZoom() {
  zoomScale.value = MIN_ZOOM;
  panX.value = 0;
  panY.value = 0;
  isPanning.value = false;
  pinching = false;
  touchPanning = false;
  trackingTouch = false;
}

function toggleZoom() {
  setZoom(zoomScale.value > MIN_ZOOM ? MIN_ZOOM : MAX_ZOOM);
}

function onWheel(e) {
  setZoom(zoomScale.value + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
}

let pointerStartX = 0;
let pointerStartY = 0;
let pointerOriginX = 0;
let pointerOriginY = 0;

function onPointerDown(e) {
  if (
    e.pointerType === "touch" ||
    e.button !== 0 ||
    zoomScale.value <= MIN_ZOOM
  ) {
    return;
  }

  isPanning.value = true;
  pointerStartX = e.clientX;
  pointerStartY = e.clientY;
  pointerOriginX = panX.value;
  pointerOriginY = panY.value;
  e.currentTarget.setPointerCapture?.(e.pointerId);
  e.preventDefault();
}

function onPointerMove(e) {
  if (!isPanning.value || e.pointerType === "touch") return;
  panX.value = pointerOriginX + e.clientX - pointerStartX;
  panY.value = pointerOriginY + e.clientY - pointerStartY;
  clampPan();
}

function onPointerEnd(e) {
  if (e.pointerType === "touch") return;
  isPanning.value = false;
  e.currentTarget.releasePointerCapture?.(e.pointerId);
  clampPan();
}
// 目前顯示的那張
const item = computed(() => props.items[props.index]);
const imageLoading = ref(true);

watch(
  () => item.value?.publicId,
  () => {
    imageLoading.value = true;
    resetZoom();
  }
);

// 上一張/下一張:用取餘數做循環,首尾相接
function prev() {
  emit("navigate", (props.index - 1 + props.items.length) % props.items.length);
}
function next() {
  emit("navigate", (props.index + 1) % props.items.length);
}

// 手機滑動切換：需有明確的水平位移，避免捲動說明文字時誤觸。
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let trackingTouch = false;
let suppressTapUntil = 0;

function onTouchStart(e) {
  if (e.touches.length !== 1 || props.items.length < 2) return;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = performance.now();
  trackingTouch = true;
}

function onTouchEnd(e) {
  if (!trackingTouch || !e.changedTouches.length) return;
  trackingTouch = false;

  const touch = e.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const elapsed = performance.now() - touchStartTime;
  const isHorizontalSwipe =
    Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25;

  if (elapsed <= 700 && isHorizontalSwipe) {
    // 防止 touchend 後產生的 click 再切換一次。
    suppressTapUntil = performance.now() + 400;
    if (deltaX < 0) next();
    else prev();
  }
}

function onTouchCancel() {
  trackingTouch = false;
}
let pinching = false;
let touchPanning = false;
let pinchStartDistance = 0;
let pinchStartScale = MIN_ZOOM;
let touchPanStartX = 0;
let touchPanStartY = 0;
let touchPanOriginX = 0;
let touchPanOriginY = 0;

function getTouchDistance(touches) {
  return Math.hypot(
    touches[1].clientX - touches[0].clientX,
    touches[1].clientY - touches[0].clientY
  );
}

function onViewerTouchStart(e) {
  if (e.touches.length === 2) {
    pinching = true;
    touchPanning = false;
    trackingTouch = false;
    isPanning.value = true;
    pinchStartDistance = getTouchDistance(e.touches);
    pinchStartScale = zoomScale.value;
    suppressTapUntil = performance.now() + 500;
    return;
  }

  if (e.touches.length === 1 && zoomScale.value > MIN_ZOOM) {
    const touch = e.touches[0];
    touchPanning = true;
    trackingTouch = false;
    isPanning.value = true;
    touchPanStartX = touch.clientX;
    touchPanStartY = touch.clientY;
    touchPanOriginX = panX.value;
    touchPanOriginY = panY.value;
    return;
  }

  onTouchStart(e);
}

function onViewerTouchMove(e) {
  if (pinching && e.touches.length === 2) {
    e.preventDefault();
    const distance = getTouchDistance(e.touches);
    setZoom(pinchStartScale * (distance / pinchStartDistance));
    suppressTapUntil = performance.now() + 500;
    return;
  }

  if (touchPanning && e.touches.length === 1) {
    e.preventDefault();
    const touch = e.touches[0];
    panX.value = touchPanOriginX + touch.clientX - touchPanStartX;
    panY.value = touchPanOriginY + touch.clientY - touchPanStartY;
    clampPan();
    suppressTapUntil = performance.now() + 500;
  }
}

function onViewerTouchEnd(e) {
  if (pinching) {
    if (e.touches.length < 2) {
      pinching = false;
      isPanning.value = false;
      clampPan();
    }
    return;
  }

  if (touchPanning) {
    if (!e.touches.length) {
      touchPanning = false;
      isPanning.value = false;
      clampPan();
    }
    return;
  }

  onTouchEnd(e);
}

function onViewerTouchCancel() {
  pinching = false;
  touchPanning = false;
  isPanning.value = false;
  onTouchCancel();
  clampPan();
}

function navigateFromTap(direction) {
  if (zoomScale.value > MIN_ZOOM || performance.now() < suppressTapUntil) return;
  if (direction === "next") next();
  else prev();
}

// 鍵盤快捷:Esc 關閉、左右方向鍵切換上下一張
function onKey(e) {
  if (e.key === "+" || e.key === "=") {
    e.preventDefault();
    zoomIn();
    return;
  }
  if (e.key === "-" || e.key === "_") {
    e.preventDefault();
    zoomOut();
    return;
  }
  if (e.key === "0") {
    e.preventDefault();
    resetZoom();
    return;
  }
  if (zoomScale.value > MIN_ZOOM && e.key.startsWith("Arrow")) {
    e.preventDefault();
    const PAN_STEP = 40;
    if (e.key === "ArrowLeft") panX.value += PAN_STEP;
    else if (e.key === "ArrowRight") panX.value -= PAN_STEP;
    else if (e.key === "ArrowUp") panY.value += PAN_STEP;
    else if (e.key === "ArrowDown") panY.value -= PAN_STEP;
    clampPan();
    return;
  }
  if (e.key === "Escape") emit("close");
  else if (e.key === "ArrowLeft") prev();
  else if (e.key === "ArrowRight") next();
}

// 切換照片時大圖淡入(class 非 Vue 綁定,不會被 patch 清掉)
function reveal(e) {
  if (e.target.dataset.publicId !== item.value?.publicId) return;
  e.target.classList.add("is-loaded");
  imageLoading.value = false;
}

onMounted(() => {
  // 掛上鍵盤監聽,並鎖住 body 捲動,避免背景跟著滑動
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", onViewportResize, { passive: true });
  document.body.style.overflow = "hidden";
});
onUnmounted(() => {
  // 關閉時卸載監聽並還原 body 捲動
  document.removeEventListener("keydown", onKey);
  window.removeEventListener("resize", onViewportResize);
  document.body.style.overflow = "";
});
</script>

<template>
  <!-- 全螢幕遮罩;點空白處(非子元素)即關閉 -->
  <div
    class="lightbox"
    :class="{ 'is-zoomed': zoomScale > MIN_ZOOM }"
    role="dialog"
    aria-modal="true"
    @click.self="emit('close')"
    @touchstart="onViewerTouchStart"
    @touchmove="onViewerTouchMove"
    @touchend="onViewerTouchEnd"
    @touchcancel="onViewerTouchCancel"
  >
    <!-- 關閉 / 上一張 / 下一張 控制鈕 -->
    <button class="ctrl close" aria-label="關閉" @touchstart.stop @click="emit('close')">×</button>
    <div
      class="zoom-controls"
      role="group"
      aria-label="Image zoom controls"
      @touchstart.stop
      @touchmove.stop
      @click.stop
    >
      <button
        type="button"
        class="zoom-button"
        aria-label="Zoom out"
        :disabled="zoomScale <= MIN_ZOOM"
        @click="zoomOut"
      >
        -
      </button>
      <button
        type="button"
        class="zoom-level"
        aria-label="Reset zoom"
        @click="resetZoom"
      >
        {{ zoomPercent }}%
      </button>
      <button
        type="button"
        class="zoom-button"
        aria-label="Zoom in"
        :disabled="zoomScale >= MAX_ZOOM"
        @click="zoomIn"
      >
        +
      </button>
    </div>
    <button
      v-if="items.length > 1"
      class="screen-tap screen-prev"
      aria-label="點擊左半部顯示上一張"
      @click="navigateFromTap('prev')"
    />
    <button
      v-if="items.length > 1"
      class="screen-tap screen-next"
      aria-label="點擊右半部顯示下一張"
      @click="navigateFromTap('next')"
    />
    <button class="ctrl nav prev" aria-label="上一張" @click="navigateFromTap('prev')">
      <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M15 18 9 12l6-6" />
      </svg>
    </button>

    <figure class="stage">
      <!-- frame:圓角 + overflow 裁切 -->
      <div
        ref="frame"
        class="frame"
        :class="{ 'is-zoomed': zoomScale > MIN_ZOOM, 'is-panning': isPanning }"
        @contextmenu.prevent
        @wheel.prevent="onWheel"
        @dblclick="toggleZoom"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerEnd"
        @pointercancel="onPointerEnd"
      >
        <Transition name="loader-fade">
          <div
            v-if="imageLoading"
            class="image-loader"
            role="status"
            aria-live="polite"
          >
            <span class="loader-ring" aria-hidden="true" />
            <span class="loader-label">Loading</span>
          </div>
        </Transition>
        <div class="zoom-surface" :style="zoomStyle">
        <!-- key 綁 publicId:換張時換成新 <img>,配合 CSS 讓大圖淡入 -->
        <img
          ref="activeImage"
          :key="item.publicId"
          class="lightbox-image"
          :src="watermarkedUrl(item)"
          :width="item.width"
          :height="item.height"
          :data-public-id="item.publicId"
          :alt="item.title || ''"
          draggable="false"
          @load="reveal"
          @error="reveal"
        />
        </div>
      </div>
      <figcaption class="meta">
        <!-- 標題與說明:有值才顯示 -->
        <div class="meta-text">
          <div class="meta-copy">
            <span v-if="item.title" class="meta-title">{{ item.title }}</span>
            <span v-if="item.caption" class="meta-caption">{{ item.caption }}</span>
          </div>
          <div
            v-if="item.series || item.tags?.length"
            class="meta-taxonomy"
            aria-label="圖片分類與標籤"
          >
            <button
              v-if="item.series"
              class="meta-series"
              :aria-label="`顯示 ${item.series} 系列的全部圖片`"
              @touchstart.stop
              @click="emit('select-series', item.series)"
            >
              <span class="taxonomy-label">Series</span>{{ item.series }}
            </button>
            <button
              v-for="tag in item.tags"
              :key="tag"
              class="meta-tag"
              :aria-label="`顯示 ${tag} 標籤的全部圖片`"
              @touchstart.stop
              @click="emit('select-tag', tag)"
            >
              #{{ tag }}
            </button>
          </div>
        </div>
        <!-- 右側:第幾張 / 共幾張(補零兩位) -->
        <span class="meta-index">
          {{ String(index + 1).padStart(2, "0") }} / {{ String(items.length).padStart(2, "0") }}
        </span>
      </figcaption>
    </figure>

    <button class="ctrl nav next" aria-label="下一張" @click="navigateFromTap('next')">
      <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* 固定覆蓋整個視窗的半透明深色遮罩,內容置中 */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: var(--lightbox-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 舞台:大圖 + 底部資訊列,直向排列 */
.stage {
  margin: 0;
  max-width: min(92vw, 1400px);
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 48px 0 32px;
}

/* frame:承載圓角與裁切;align-self 置中並收縮至圖片寬度,避免 letterbox 空白 */
.frame {
  position: relative;
  align-self: center;
  max-width: 100%;
  overflow: hidden;
  border-radius: 8px; /* 大圖用比縮圖(4px)大一點的圓角 */
  line-height: 0; /* 消除 inline 圖片底部縫隙 */
}

.zoom-surface {
  position: relative;
  transform-origin: center;
  will-change: transform;
  transition: transform 0.18s ease;
}

.frame.is-zoomed {
  cursor: grab;
}

.frame.is-panning {
  cursor: grabbing;
}

.frame.is-panning .zoom-surface {
  transition: none;
}

/* 大圖:等比縮放不裁切;預設透明,載入後淡入(見 .is-loaded) */
.lightbox-image {
  max-width: 100%;
  max-height: calc(100vh - 140px);
  object-fit: contain;
  display: block;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lightbox-image.is-loaded {
  opacity: 1;
}
.image-loader {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  min-width: 120px;
  min-height: 120px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgb(var(--loader-rgb));
  pointer-events: none;
}

.loader-ring {
  width: 34px;
  height: 34px;
  border: 2px solid rgba(var(--accent-rgb), 0.18);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: loader-spin 0.8s linear infinite;
}

.loader-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--muted);
}

.loader-fade-leave-active {
  transition: opacity 0.24s ease;
}

.loader-fade-leave-to {
  opacity: 0;
}

@keyframes loader-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loader-ring {
    animation: none;
    border-color: rgba(var(--accent-rgb), 0.45);
  }
}

/* 底部資訊列:左側標題/說明,右側張數索引 */
.meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  border-top: 1px solid var(--line);
  padding-top: 12px;
}

.meta-text {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.meta-copy {
  display: flex;
  align-items: baseline;
  gap: 14px;
  min-width: 0;
}

.meta-title {
  font-family: var(--font-display);
  font-size: 16px;
}

.meta-caption {
  font-size: 13px;
  color: var(--muted);
}

.meta-taxonomy {
  position: relative;
  z-index: 51;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px 7px;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.4;
}

.meta-series,
.meta-tag {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 2px 8px;
  color: var(--muted);
}

.meta-series {
  border-color: rgba(var(--accent-rgb), 0.38);
  color: var(--accent);
}

.meta-series:hover,
.meta-tag:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.taxonomy-label {
  margin-right: 6px;
  color: var(--muted);
  font-size: 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.meta-index {
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.4;
  color: var(--accent);
  white-space: nowrap;
  padding: 3px 0;
}

/* 控制鈕(關閉/左右):固定定位於視窗邊緣,疊在遮罩之上 */
.zoom-controls {
  position: fixed;
  top: 18px;
  left: 20px;
  z-index: 52;
  display: grid;
  grid-template-columns: 34px 54px 34px;
  gap: 3px;
  padding: 4px;
  border: 1px solid rgba(var(--contrast-rgb), 0.12);
  border-radius: 999px;
  background: rgba(var(--surface-rgb), 0.78);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}

.zoom-button,
.zoom-level {
  display: grid;
  min-width: 0;
  height: 32px;
  padding: 0;
  place-items: center;
  border-radius: 999px;
  color: var(--text);
  font-family: var(--font-mono);
  line-height: 1;
  touch-action: manipulation;
}

.zoom-button {
  font-size: 20px;
}

.zoom-level {
  color: var(--accent);
  font-size: 10px;
}

.zoom-button:hover:not(:disabled),
.zoom-level:hover {
  background: rgba(var(--contrast-rgb), 0.08);
}

.zoom-button:disabled {
  cursor: not-allowed;
  opacity: 0.32;
}
.ctrl {
  position: fixed;
  color: var(--muted);
  font-size: 34px;
  line-height: 1;
  padding: 12px;
  transition: color 0.15s ease;
  z-index: 51;
}

.ctrl:hover {
  color: var(--text);
}

.close {
  top: 16px;
  right: 20px;
}

.nav {
  top: 50%;
  transform: translateY(-50%);
  font-size: 44px;
}

.nav-icon {
  display: block;
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.prev {
  left: 16px;
}

.next {
  right: 16px;
}

/* 手機版的左右半螢幕透明點擊區；桌面預設不啟用。 */
.screen-tap {
  display: none;
}

/* 手機版:舞台佔滿寬度,左右切換鈕移到底部並排 */
@media (max-width: 860px) {
  .lightbox {
    min-height: 100vh;
    min-height: 100dvh;
    overscroll-behavior: contain;
    touch-action: pan-y;
  }


  .lightbox.is-zoomed {
    touch-action: none;
  }

  .zoom-controls {
    top: max(10px, env(safe-area-inset-top, 0px));
    left: max(10px, env(safe-area-inset-left, 0px));
    grid-template-columns: 32px 50px 32px;
  }
  .stage {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    max-width: 100vw;
    max-height: 100vh;
    max-height: 100dvh;
    gap: 10px;
    padding: calc(10px + env(safe-area-inset-top, 0px)) 8px
      calc(60px + env(safe-area-inset-bottom, 0px));
    overflow: hidden;
  }

  .zoom-surface {
    width: 100%;
    height: 100%;
  }
  .frame {
    display: block;
    align-self: stretch;
    width: 100%;
    height: 100%;
    min-height: 0;
    border-radius: 6px;
  }

  .lightbox-image {
    width: 100%;
    height: 100%;
    max-height: none;
    object-fit: contain;
  }

  .meta {
    max-height: 76px;
    align-items: flex-end;
    padding-top: 8px;
    overflow-y: auto;
  }

  .meta-text {
    gap: 6px;
  }

  .meta-copy {
    flex-direction: column;
    gap: 2px;
  }

  .screen-tap {
    position: fixed;
    top: calc(60px + env(safe-area-inset-top, 0px));
    bottom: calc(64px + env(safe-area-inset-bottom, 0px));
    z-index: 50;
    display: block;
    width: 50%;
    padding: 0;
    background: transparent;
    -webkit-tap-highlight-color: transparent;
    touch-action: pan-y;
  }
  .lightbox.is-zoomed .screen-tap {
    pointer-events: none;
  }

  .screen-tap:focus-visible {
    outline-offset: -3px;
  }

  .screen-prev {
    left: 0;
  }

  .screen-next {
    right: 0;
  }

  .nav,
  .close {
    display: grid;
    box-sizing: border-box;
    flex: 0 0 auto;
    padding: 0;
    place-items: center;
    aspect-ratio: 1 / 1;
    border: 1px solid rgba(var(--contrast-rgb), 0.1);
    border-radius: 50%;
    overflow: hidden;
    -webkit-appearance: none;
    appearance: none;
  }

  .nav {
    top: auto;
    bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    transform: none;
    width: 48px;
    height: 48px;
    min-width: 48px;
    min-height: 48px;
    max-width: 48px;
    max-height: 48px;
    background: rgba(var(--surface-rgb), 0.72);
    color: var(--text);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    touch-action: manipulation;
  }

  .prev {
    left: max(20px, env(safe-area-inset-left, 0px));
  }

  .next {
    right: max(20px, env(safe-area-inset-right, 0px));
  }

  .close {
    top: max(10px, env(safe-area-inset-top, 0px));
    right: max(10px, env(safe-area-inset-right, 0px));
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    max-width: 44px;
    max-height: 44px;
    background: rgba(var(--surface-rgb), 0.78);
    color: var(--text);
    font-size: 30px;
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    touch-action: manipulation;
  }
}
</style>
