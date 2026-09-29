<script setup>
import { computed, onUnmounted, ref } from "vue";
import logoUrl from "../assets/Rys3t_logo.svg";

const props = defineProps({
  sidebarOpen: { type: Boolean, required: true },
  locale: { type: String, default: "zh" },
  aboutActive: { type: Boolean, default: false },
  aboutHref: { type: String, default: "/" },
});

const emit = defineEmits(["toggle", "change-locale", "show-about"]);

function openAbout(event) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  emit("show-about");
}

const languages = [
  { code: "en", label: "English", short: "EN" },
  { code: "ja", label: "日本語", short: "日" },
  { code: "zh", label: "中文", short: "中" },
];

const headerCopy = computed(() => ({
  en: { menu: "Toggle sidebar", language: "Language", about: "About" },
  ja: { menu: "サイドバーを開閉", language: "言語", about: "紹介" },
  zh: { menu: "開合側邊欄", language: "語言", about: "關於" },
}[props.locale] ?? { menu: "Toggle sidebar", language: "Language", about: "About" }));

const theme = ref(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const themeLabel = computed(() => ({
  en: theme.value === "dark" ? "Switch to light mode" : "Switch to dark mode",
  ja: theme.value === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え",
  zh: theme.value === "dark" ? "切換明亮模式" : "切換深色模式",
}[props.locale]));
function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme.value;
  try { localStorage.setItem("portfolio-theme", theme.value); } catch { /* Storage may be unavailable. */ }
}

const scrolled = ref(false);
const onScroll = () => (scrolled.value = window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();
onUnmounted(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <header class="header" :class="{ glass: scrolled }">
    <button class="toggle" aria-controls="sidebar" :aria-expanded="sidebarOpen" :aria-label="headerCopy.menu"
      @click="emit('toggle')">
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>

    <div class="brand">
      <h1>
        <img class="brand-logo" :src="logoUrl" alt="Rys3t_" />
      </h1>
      <p class="brand-sub">Photography</p>
    </div>

    <a class="about-link" :class="{ active: aboutActive }" :href="aboutHref"
      :aria-current="aboutActive ? 'page' : undefined" @click="openAbout">{{ headerCopy.about }}</a>

    <button class="theme-toggle" type="button" :aria-label="themeLabel" :title="themeLabel"
      @click="toggleTheme">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <g v-if="theme === 'dark'">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
        </g>
        <path v-else d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" />
      </svg>
    </button>

    <nav class="language-switcher" :aria-label="headerCopy.language">
      <button
        v-for="language in languages"
        :key="language.code"
        class="language-option"
        :class="{ active: locale === language.code }"
        :lang="language.code === 'zh' ? 'zh-Hant' : language.code"
        :aria-pressed="locale === language.code"
        :aria-label="language.label"
        :title="language.label"
        @click="emit('change-locale', language.code)"
      >
        <span class="language-full">{{ language.label }}</span>
        <span class="language-short" aria-hidden="true">{{ language.short }}</span>
      </button>
    </nav>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  height: var(--header-h);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  background: var(--bg);
  border-bottom: 1px solid transparent;
  transition: background 0.3s ease, border-color 0.3s ease,
    backdrop-filter 0.3s ease;
}

/* 往下捲後的 liquid glass:半透明 + 背景模糊增飽和 + 髮絲底線 */
.header.glass {
  background: rgba(var(--surface-rgb), 0.55);
  -webkit-backdrop-filter: blur(18px) saturate(1.5);
  backdrop-filter: blur(18px) saturate(1.5);
  border-bottom-color: rgba(var(--contrast-rgb), 0.06);
}

.toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: var(--muted);
  transition: color 0.15s ease, background 0.15s ease;
}

.toggle:hover {
  color: var(--text);
  background: rgba(var(--contrast-rgb), 0.05);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand h1 {
  margin: 0;
  line-height: 0;
}

.theme-toggle {
  display: grid;
  place-items: center;
  flex: 0 0 32px;
  height: 36px;
  color: var(--muted);
}

.theme-toggle:hover {
  color: var(--accent);
}

.brand-logo {
  filter: var(--logo-filter);
  display: block;
  width: 84px;
  height: auto;
}

.brand-sub {
  align-self: flex-end;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0;
}

.about-link {
  margin-left: auto;
  flex-shrink: 0;
  padding: 6px 0;
  color: var(--muted);
  font-size: 12px;
  text-decoration: none;
}

.about-link:hover,
.about-link:focus-visible,
.about-link.active {
  color: var(--accent);
}

.language-switcher {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(var(--contrast-rgb), 0.025);
  flex-shrink: 0;
}

.language-option {
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--muted);
  transition: color 0.15s ease, background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.language-option:hover {
  color: var(--text);
}

.language-option.active {
  background: rgba(var(--accent-rgb), 0.14);
  color: var(--accent);
  box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb), 0.3);
}

.language-short {
  display: none;
}

@media (max-width: 560px) {
  .header {
    gap: 10px;
    padding: 0 12px;
  }

  .brand-sub {
    display: none;
  }

  .brand-logo {
    width: 74px;
  }

  .language-option {
    min-width: 30px;
    padding: 4px 8px;
  }

  .language-full {
    display: none;
  }

  .language-short {
    display: inline;
  }
}
</style>
