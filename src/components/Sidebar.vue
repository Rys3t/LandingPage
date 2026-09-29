<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  collections: { type: Array, required: true }, // [{ id, count }]
  series: { type: Array, required: true }, // [{ name, count }]
  tags: { type: Array, required: true }, // [{ name, count }]
  activeCollection: { type: String, required: true },
  activeSeries: { type: String, default: "" },
  activeTags: { type: Array, default: () => [] },
  total: { type: Number, required: true },
  locale: { type: String, default: "zh" },
});

const emit = defineEmits([
  "select-collection",
  "select-series",
  "toggle-tag",
  "clear",
]);

const pad = (n) => String(n).padStart(3, "0");

const seriesQuery = ref("");
const tagQuery = ref("");

watch(
  () => props.activeCollection,
  () => {
    seriesQuery.value = "";
    tagQuery.value = "";
  }
);

const translations = {
  en: {
    collections: "Work type",
    portfolio: "Portrait / Events",
    street: "Street",
    series: "Series",
    tags: "Tags",
    searchSeries: "Search series…",
    searchTags: "Search tags…",
    all: "All works",
    clear: "Clear filters",
    noResults: "No matching items",
  },
  ja: {
    collections: "作品タイプ",
    portfolio: "人物・イベント",
    street: "ストリート",
    series: "シリーズ",
    tags: "タグ",
    searchSeries: "シリーズを検索…",
    searchTags: "タグを検索…",
    all: "すべての作品",
    clear: "絞り込みを解除",
    noResults: "該当する項目はありません",
  },
  zh: {
    collections: "作品類型",
    portfolio: "人像・活動",
    street: "街景",
    series: "系列",
    tags: "標籤",
    searchSeries: "搜尋系列…",
    searchTags: "搜尋標籤…",
    all: "全部作品",
    clear: "清除篩選",
    noResults: "無符合項目",
  },
};

const copy = computed(() => translations[props.locale] ?? translations.zh);

function collectionLabel(id) {
  return copy.value[id] || id;
}

// 模糊搜尋:不分大小寫的字元子序列比對(st26 可命中 street-2026),空字串全部命中
function fuzzyMatch(query, name) {
  const q = query.toLowerCase().replace(/\s/g, "");
  const n = name.toLowerCase();
  let i = 0;
  for (const ch of n) if (ch === q[i]) i++;
  return i === q.length;
}

const filteredSeries = computed(() =>
  props.series.filter((s) => fuzzyMatch(seriesQuery.value, s.name))
);
const filteredTags = computed(() =>
  props.tags.filter((t) => fuzzyMatch(tagQuery.value, t.name))
);
</script>

<template>
  <aside class="sidebar">
    <nav class="series-nav" :aria-label="copy.series">
      <p class="section-label">{{ copy.series }}</p>
      <div class="collection-switcher" role="group" :aria-label="copy.collections">
        <button
          v-for="collection in collections"
          :key="collection.id"
          class="collection-item"
          :class="{ active: activeCollection === collection.id }"
          :aria-pressed="activeCollection === collection.id"
          @click="emit('select-collection', collection.id)"
        >
          <span class="collection-name">{{ collectionLabel(collection.id) }}</span>
          <span class="collection-count">{{ pad(collection.count) }}</span>
        </button>
      </div>
      <input v-model="seriesQuery" type="search" class="search-input" :placeholder="copy.searchSeries" :aria-label="copy.searchSeries" />
      <div class="filter-scroll series-scroll">
        <ul class="series-list">
          <li>
            <button class="series-item" :class="{ active: activeSeries === '' }" @click="emit('select-series', '')">
              <span class="series-name">{{ copy.all }}</span>
              <span class="series-count">{{ pad(total) }}</span>
            </button>
          </li>
          <li v-for="s in filteredSeries" :key="s.name">
            <button class="series-item" :class="{ active: activeSeries === s.name }"
              @click="emit('select-series', s.name)">
              <span class="series-name">{{ s.name }}</span>
              <span class="series-count">{{ pad(s.count) }}</span>
            </button>
          </li>
        </ul>
      </div>
      <p v-if="seriesQuery && !filteredSeries.length" class="empty-hint">
        {{ copy.noResults }}
      </p>
    </nav>

    <nav class="tags-nav" :aria-label="copy.tags">
      <div class="section-head">
        <p class="section-label">{{ copy.tags }}</p>
        <button v-if="activeSeries || activeTags.length" class="clear" @click="emit('clear')">
          {{ copy.clear }}
        </button>
      </div>
      <input v-model="tagQuery" type="search" class="search-input" :placeholder="copy.searchTags" :aria-label="copy.searchTags" />
      <div class="filter-scroll tag-scroll">
        <div class="tag-cloud">
          <button v-for="t in filteredTags" :key="t.name" class="tag" :class="{ active: activeTags.includes(t.name) }"
            :aria-pressed="activeTags.includes(t.name)" @click="emit('toggle-tag', t.name)">
            #{{ t.name }}<span class="tag-count">{{ t.count }}</span>
          </button>
        </div>
      </div>
      <p v-if="tagQuery && !filteredTags.length" class="empty-hint">
        {{ copy.noResults }}
      </p>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  padding: 16px 18px;
  border-right: 1px solid var(--line);
  background: var(--panel);
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* Series 與 Tags 各自捲動，避免其中一個長清單擠壓另一區。 */
.sidebar>nav {
  display: flex;
  flex-direction: column;
}

.series-nav {
  flex: 1.6 1 0;
  min-height: 220px;
}

.tags-nav {
  flex: 1 1 0;
  min-height: 140px;
}

/* Only the lists shrink; headings and controls must remain readable. */
.sidebar > nav > :not(.filter-scroll) {
  flex-shrink: 0;
}

.collection-switcher {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 4px;
}

.collection-item {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 8px;
  color: var(--muted);
  text-align: left;
  transition: color 0.15s ease, background 0.15s ease;
}

.collection-item + .collection-item {
  border-left: 1px solid var(--line);
}

.collection-item:hover {
  color: var(--text);
  background: rgba(var(--contrast-rgb), 0.03);
}

.collection-item.active {
  color: var(--accent);
  background: rgba(var(--accent-rgb), 0.1);
}

.collection-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collection-count {
  flex: 0 0 auto;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  opacity: 0.72;
}

.filter-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  padding-right: 5px;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--accent-rgb), 0.5) transparent;
  overscroll-behavior: contain;
}

.filter-scroll::-webkit-scrollbar {
  width: 8px;
}

.filter-scroll::-webkit-scrollbar-thumb {
  border-width: 2px;
  background-color: rgba(var(--accent-rgb), 0.5);
}

.filter-scroll::-webkit-scrollbar-thumb:hover {
  background-color: var(--accent);
}

.section-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--muted);
  margin: 0 0 12px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.search-input {
  width: 100%;
  margin: 0 0 12px;
  padding: 6px 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 4px;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input::placeholder {
  color: var(--muted);
}

.search-input:focus {
  border-color: var(--accent);
}

/* 搜尋框內的清除(×)按鈕改成輔色黃;用 mask 上色才能精準指定顏色 */
.search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  cursor: pointer;
  background-color: var(--accent);
  -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" stroke="black" stroke-width="2" stroke-linecap="round"/></svg>') center / contain no-repeat;
  mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" stroke="black" stroke-width="2" stroke-linecap="round"/></svg>') center / contain no-repeat;
}

.empty-hint {
  font-size: 12px;
  color: var(--muted);
  margin: 8px 0 0;
}

.series-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* 接觸印樣式索引:左邊系列名、右邊等寬字型張數 */
.series-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  text-align: left;
  gap: 12px;
  padding: 9px 8px;
  border-left: 2px solid transparent;
  color: var(--text);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.series-item:hover {
  background: rgba(var(--contrast-rgb), 0.03);
}

.series-item.active {
  border-left-color: var(--accent);
  background: rgba(var(--accent-rgb), 0.07);
}

.series-name {
  min-width: 0;
  flex: 1;
  overflow-wrap: anywhere;
  font-size: 13px;
}

.series-count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  flex-shrink: 0;
  /* 保持寬度,不被長名稱擠壓 */
}

.series-item.active .series-count {
  color: var(--accent);
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  font-size: 13px;
  color: var(--muted);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 12px;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.tag:hover {
  color: var(--text);
  border-color: var(--muted);
}

.tag.active {
  color: var(--accent);
  border-color: var(--accent);
}

.tag-count {
  font-family: var(--font-mono);
  font-size: 10px;
  margin-left: 6px;
  opacity: 0.7;
}

.clear {
  font-size: 12px;
  color: var(--muted);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.clear:hover {
  color: var(--text);
}

@media (max-width: 860px) {
  .sidebar {
    width: min(86vw, 320px);
    border-right: 1px solid var(--line);
    border-bottom: none;
    padding: 16px;
  }
}
</style>
