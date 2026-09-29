<script setup>
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import Header from "./components/Header.vue";
import Sidebar from "./components/Sidebar.vue";
import MasonryGallery from "./components/MasonryGallery.vue";
import Lightbox from "./components/Lightbox.vue";

const AboutPage = defineAsyncComponent(() => import("./pages/AboutPage.vue"));
const ROUTES = Object.freeze({
  about: "/",
  gallery: "/gallery/",
});
const currentPage = ref("about");
watch(currentPage, (page) => {
  document.title = page === "about" ? "About Rys3t_ — Photography" : "Rys3t_ — Photography";
}, { immediate: true });

const DEFAULT_COLLECTION = "portfolio";
const gallery = shallowRef(null);
const refreshing = ref(false);
const galleryError = ref(false);
const galleryItems = computed(() => gallery.value?.items ?? []);
const galleryCollections = computed(() => gallery.value?.collections ?? []);
function leadingNumberParts(name) {
  const match = String(name).trim().match(/^\d+(?:[.-]\d+)*/);
  return match ? match[0].split(/[.-]/).map(Number) : null;
}

function compareSeriesByLeadingNumberDesc(a, b) {
  const aParts = leadingNumberParts(a.name);
  const bParts = leadingNumberParts(b.name);

  if (aParts && bParts) {
    const length = Math.max(aParts.length, bParts.length);
    for (let index = 0; index < length; index += 1) {
      const difference = (bParts[index] ?? 0) - (aParts[index] ?? 0);
      if (difference) return difference;
    }
    return 0;
  }

  if (aParts) return -1;
  if (bParts) return 1;
  return 0;
}

const gallerySeries = computed(() => [...(gallery.value?.series ?? [])].sort(compareSeriesByLeadingNumberDesc));
const galleryTags = computed(() => gallery.value?.tags ?? []);

// 桌機預設展開、小螢幕預設隱藏;跨越斷點時自動同步,同斷點內由 header 按鈕手動開合
const mql = window.matchMedia("(min-width: 861px)");
const sidebarOpen = ref(mql.matches);
const masonryLayoutPaused = ref(false);
const syncBreakpoint = (e) => {
  masonryLayoutPaused.value = false;
  sidebarOpen.value = e.matches;
};
mql.addEventListener("change", syncBreakpoint);
onUnmounted(() => mql.removeEventListener("change", syncBreakpoint));
const collectionIds = computed(() => new Set(galleryCollections.value.map((collection) => collection.id)));
const initialCollection = computed(() => collectionIds.value.has(DEFAULT_COLLECTION)
  ? DEFAULT_COLLECTION
  : galleryCollections.value[0]?.id || DEFAULT_COLLECTION);
const activeCollection = ref(DEFAULT_COLLECTION);
const activeSeries = ref("");
const activeTags = ref([]);
const lightboxIndex = ref(-1);
const supportedLocales = new Set(["en", "ja", "zh"]);

function readStoredLocale() {
  try {
    const stored = window.localStorage.getItem("portfolio-locale");
    return supportedLocales.has(stored) ? stored : "zh";
  } catch {
    return "zh";
  }
}

const locale = ref(readStoredLocale());

function changeLocale(nextLocale) {
  if (!supportedLocales.has(nextLocale)) return;
  locale.value = nextLocale;
  document.documentElement.lang = {
    en: "en",
    ja: "ja",
    zh: "zh-Hant",
  }[nextLocale];
  try {
    window.localStorage.setItem("portfolio-locale", nextLocale);
  } catch {
    // 隱私模式禁止儲存時，仍維持本次瀏覽的語言狀態。
  }
}

changeLocale(locale.value);

const galleryCopy = computed(() => ({
  zh: { loading: "正在載入作品…", error: "暫時無法載入作品，請稍後再試。", stale: "作品更新暫時失敗，目前顯示上次載入的內容。", retry: "重新載入" },
  en: { loading: "Loading works…", error: "Works are temporarily unavailable. Please try again.", stale: "Unable to refresh. Showing the last loaded works.", retry: "Retry" },
  ja: { loading: "作品を読み込んでいます…", error: "作品を読み込めませんでした。しばらくしてからお試しください。", stale: "更新できませんでした。前回読み込んだ作品を表示しています。", retry: "再読み込み" },
}[locale.value]));

// 系列排序索引,和側邊欄的 gallery.series 順序一致
const seriesOrder = computed(() => new Map(
  gallerySeries.value.map((series, index) => [
    `${series.collection}\0${series.name}`,
    index,
  ])
));
const scopedSeries = computed(() =>
  gallerySeries.value.filter((series) => series.collection === activeCollection.value)
);
const scopedTags = computed(() =>
  galleryTags.value.filter((tag) => tag.collection === activeCollection.value)
);
const collectionItems = computed(() =>
  galleryItems.value.filter((item) => item.collection === activeCollection.value)
);

function knownSeriesFor(collection) {
  return new Set(
    gallerySeries.value
      .filter((series) => series.collection === collection)
      .map((series) => series.name)
  );
}

function knownTagsFor(collection) {
  return new Set(
    galleryTags.value
      .filter((tag) => tag.collection === collection)
      .map((tag) => tag.name)
  );
}

// 可分享網址格式：?collection=street&series=分類&tags=標籤
function readFiltersFromUrl({ closeLightbox = true } = {}) {
  const pathname = window.location.pathname.replace(/\/index\.html$/, "/");
  currentPage.value = /^\/gallery(?:\/)?$/.test(pathname)
    ? "gallery"
    : "about";
  // Keep shared-link query parameters until the asynchronous catalogue arrives.
  if (!gallery.value) return;
  const params = new URLSearchParams(window.location.search);
  const requestedCollection = params.get("collection") || initialCollection.value;
  activeCollection.value = collectionIds.value.has(requestedCollection)
    ? requestedCollection
    : initialCollection.value;

  const knownSeries = knownSeriesFor(activeCollection.value);
  const knownTags = knownTagsFor(activeCollection.value);
  const series = params.get("series") || "";
  activeSeries.value = knownSeries.has(series) ? series : "";
  // 舊的多標籤網址只保留第一個有效標籤。
  activeTags.value = params.getAll("tags").filter((tag) => knownTags.has(tag)).slice(0, 1);
  if (closeLightbox) lightboxIndex.value = -1;
}

function viewUrl(page) {
  const url = new URL(window.location.href);
  url.pathname = ROUTES[page] || ROUTES.about;
  if (!gallery.value) return `${url.pathname}${url.search}${url.hash}`;
  url.searchParams.delete("collection");
  url.searchParams.delete("series");
  url.searchParams.delete("tags");

  if (activeCollection.value !== initialCollection.value) {
    url.searchParams.set("collection", activeCollection.value);
  }
  if (activeSeries.value) url.searchParams.set("series", activeSeries.value);
  for (const tag of activeTags.value) url.searchParams.append("tags", tag);

  return `${url.pathname}${url.search}${url.hash}`;
}

const aboutHref = computed(() => viewUrl("about"));
const galleryHref = computed(() => viewUrl("gallery"));

function syncFiltersToUrl({ replace = false } = {}) {
  const nextUrl = viewUrl(currentPage.value);
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl === currentUrl) return;
  window.history[replace ? "replaceState" : "pushState"](null, "", nextUrl);
}

function restoreFiltersFromHistory() {
  readFiltersFromUrl();
}

function navigatePage(page) {
  if (currentPage.value === page) return;
  currentPage.value = page;
  lightboxIndex.value = -1;
  syncFiltersToUrl();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function applyGalleryFilters() {
  const leavingAbout = currentPage.value === "about";
  currentPage.value = "gallery";
  lightboxIndex.value = -1;
  syncFiltersToUrl();
  if (leavingAbout) {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (!mql.matches) sidebarOpen.value = false;
  }
}

readFiltersFromUrl();
window.addEventListener("popstate", restoreFiltersFromHistory);
onUnmounted(() => window.removeEventListener("popstate", restoreFiltersFromHistory));

const filtered = computed(() =>
  collectionItems.value
    .filter((item) => {
      if (activeSeries.value && item.series !== activeSeries.value) return false;
      return !activeTags.value.length || item.tags.includes(activeTags.value[0]);
    })
    // 不管有沒有選 tag,一律依系列分組排序(同系列內維持原本時間順序)
    .sort(
      (a, b) =>
        (seriesOrder.value.get(`${a.collection}\0${a.series}`) ?? Infinity) -
        (seriesOrder.value.get(`${b.collection}\0${b.series}`) ?? Infinity)
    )
);

function selectCollection(id) {
  if (!collectionIds.value.has(id)) return;
  if (id === activeCollection.value) {
    applyGalleryFilters();
    return;
  }
  activeCollection.value = id;
  activeSeries.value = "";
  activeTags.value = [];
  applyGalleryFilters();
}

function selectSeries(name) {
  activeSeries.value = name;
  applyGalleryFilters();
}

function toggleTag(name) {
  if (!knownTagsFor(activeCollection.value).has(name)) return;
  activeTags.value = activeTags.value.includes(name) ? [] : [name];
  applyGalleryFilters();
}

function clearFilters() {
  activeSeries.value = "";
  activeTags.value = [];
  applyGalleryFilters();
}

function showSeriesFromPreview(name) {
  // Series 僅替換分類，保留目前的 Tags 交集條件。
  activeSeries.value = knownSeriesFor(activeCollection.value).has(name)
    ? name
    : "";
  lightboxIndex.value = -1;
  syncFiltersToUrl();
}

function showTagFromPreview(name) {
  // 預覽頁的 Tag 採單一導向：先清空既有參數，再套用目標 Tag。
  activeSeries.value = "";
  activeTags.value = knownTagsFor(activeCollection.value).has(name)
    ? [name]
    : [];
  lightboxIndex.value = -1;
  syncFiltersToUrl();
}

function toggleSidebar() {
  // 窄畫面時側邊欄改為 fixed 從 header 下方展開(見 CSS),不需捲回頂端
  sidebarOpen.value = !sidebarOpen.value;
}

function pauseMasonryLayout() {
  if (mql.matches) masonryLayoutPaused.value = true;
}

function resumeMasonryLayout() {
  masonryLayoutPaused.value = false;
}

let requestController;
let lastRequestAt = 0;
let refreshTimer;
let disposed = false;

async function refreshGallery({ force = false } = {}) {
  if (refreshing.value || (!force && Date.now() - lastRequestAt < 30_000)) return;
  refreshing.value = true;
  lastRequestAt = Date.now();
  requestController = new AbortController();
  const timeout = window.setTimeout(() => requestController.abort(), 25_000);
  try {
    const response = await fetch("/api/gallery", { signal: requestController.signal });
    if (!response.ok) throw new Error("Gallery request failed");
    const next = await response.json();
    if (!next.version || !Array.isArray(next.items) || !Array.isArray(next.collections) ||
        !Array.isArray(next.series) || !Array.isArray(next.tags)) throw new Error("Invalid gallery response");
    if (disposed) return;
    if (next.version !== gallery.value?.version) {
      const selectedId = filtered.value[lightboxIndex.value]?.publicId;
      gallery.value = next;
      readFiltersFromUrl({ closeLightbox: false });
      syncFiltersToUrl({ replace: true });
      // A newly inserted photograph must not change the photograph open in Lightbox.
      lightboxIndex.value = selectedId ? filtered.value.findIndex((item) => item.publicId === selectedId) : -1;
    }
    galleryError.value = false;
  } catch {
    if (!disposed) galleryError.value = true;
  } finally {
    window.clearTimeout(timeout);
    refreshing.value = false;
  }
}

function refreshVisibleGallery() {
  if (!document.hidden) void refreshGallery();
}

onMounted(() => {
  void refreshGallery();
  refreshTimer = window.setInterval(refreshVisibleGallery, 60_000);
  document.addEventListener("visibilitychange", refreshVisibleGallery);
  window.addEventListener("online", refreshVisibleGallery);
});
onUnmounted(() => {
  disposed = true;
  requestController?.abort();
  window.clearInterval(refreshTimer);
  document.removeEventListener("visibilitychange", refreshVisibleGallery);
  window.removeEventListener("online", refreshVisibleGallery);
});
</script>

<template>
  <Header
    v-show="currentPage !== 'about'"
    :sidebar-open="sidebarOpen"
    :locale="locale"
    :about-active="currentPage === 'about'"
    :about-href="aboutHref"
    @toggle="toggleSidebar"
    @change-locale="changeLocale"
    @show-about="navigatePage('about')"
  />

  <div class="layout" :class="{ 'is-about': currentPage === 'about' }">
    <Transition
      name="sidebar"
      @before-enter="pauseMasonryLayout"
      @after-enter="resumeMasonryLayout"
      @enter-cancelled="resumeMasonryLayout"
      @before-leave="pauseMasonryLayout"
      @after-leave="resumeMasonryLayout"
      @leave-cancelled="resumeMasonryLayout"
    >
      <Sidebar
        v-show="sidebarOpen"
        id="sidebar"
        :collections="galleryCollections"
        :series="scopedSeries"
        :tags="scopedTags"
        :active-collection="activeCollection"
        :active-series="activeSeries"
        :active-tags="activeTags"
        :total="collectionItems.length"
        :locale="locale"
        @select-collection="selectCollection"
        @select-series="selectSeries"
        @toggle-tag="toggleTag"
        @clear="clearFilters"
      />
    </Transition>

    <!-- 手機版側邊欄展開時的遮罩:點擊收合;桌機以 CSS display:none 隱藏 -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="scrim"
        aria-hidden="true"
        @click="toggleSidebar"
      />
    </Transition>

    <main
      class="content"
      :class="{ 'is-layout-paused': masonryLayoutPaused }"
    >
      <AboutPage
        v-if="currentPage === 'about'"
        :gallery-href="galleryHref"
        @show-gallery="navigatePage('gallery')"
      />
      <template v-else>
        <div v-if="galleryError" class="gallery-status" role="status">
          <p>{{ gallery ? galleryCopy.stale : galleryCopy.error }}</p>
          <button type="button" :disabled="refreshing" @click="refreshGallery({ force: true })">{{ galleryCopy.retry }}</button>
        </div>
        <p v-else-if="!gallery" class="gallery-status" role="status" aria-live="polite">{{ galleryCopy.loading }}</p>
        <MasonryGallery
          v-if="gallery"
          :items="filtered"
          :locale="locale"
          :layout-paused="masonryLayoutPaused"
          @open="(i) => (lightboxIndex = i)"
        />
      </template>
    </main>

    <Transition name="fade">
      <Lightbox
        v-if="lightboxIndex >= 0"
        :items="filtered"
        :index="lightboxIndex"
        @close="lightboxIndex = -1"
        @navigate="(i) => (lightboxIndex = i)"
        @select-series="showSeriesFromPreview"
        @select-tag="showTagFromPreview"
      />
    </Transition>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: calc(100vh - var(--header-h));
}

.layout.is-about {
  --header-h: 0px;
}

.sidebar {
  position: sticky;
  top: var(--header-h);
  height: calc(100vh - var(--header-h));
  height: calc(100dvh - var(--header-h));
  flex-shrink: 0;
  align-self: flex-start;
}

.content {
  flex: 1;
  min-width: 0;
}

.content.is-layout-paused {
  overflow: hidden;
}

.gallery-status {
  margin: 0;
  padding: 32px 24px;
  color: var(--muted);
}

.gallery-status button {
  margin-top: 12px;
  padding: 8px 16px;
  border: 1px solid currentColor;
  border-radius: 4px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
}

.scrim {
  position: fixed;
  top: var(--header-h);
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 14; /* 內容之上、側邊欄(15)之下,header(20)仍在最上層 */
  background: rgba(0, 0, 0, 0.5);
}

/* 電腦版不顯示遮罩 */
@media (min-width: 861px) {
  .scrim {
    display: none;
  }
}

@media (max-width: 860px) {
  .layout {
    flex-direction: column;
  }

  /* 手機：從左側滑入的固定抽屜，維持在 header 下方。 */
  .sidebar {
    position: fixed;
    top: var(--header-h);
    left: 0;
    right: auto;
    bottom: 0;
    z-index: 15; /* 在 header(20)之下、內容之上 */
    width: min(86vw, 320px);
    height: calc(100vh - var(--header-h));
    height: calc(100dvh - var(--header-h));
    max-height: none;
    overflow-y: auto;
    box-shadow: 18px 0 36px rgba(0, 0, 0, 0.42);
  }
}

/* 側邊欄開合過場 —— 桌機收合寬度、手機從左側滑入。 */
@media (min-width: 861px) {
  .sidebar-enter-active,
  .sidebar-leave-active {
    overflow: hidden;
    transition: width 0.28s ease, padding 0.28s ease, opacity 0.28s ease;
  }

  /* 用 .sidebar.xxx 提高特異度,穩定蓋過 Sidebar.vue 的 .sidebar{width:var(--sidebar-w)} */
  .sidebar.sidebar-enter-from,
  .sidebar.sidebar-leave-to {
    width: 0;
    padding-left: 0;
    padding-right: 0;
    opacity: 0;
  }
}

@media (max-width: 860px) {
  .sidebar-enter-active,
  .sidebar-leave-active {
    will-change: opacity, transform;
    transition: opacity 0.28s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .sidebar-enter-from,
  .sidebar-leave-to {
    opacity: 0;
    transform: translateX(-100%);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
