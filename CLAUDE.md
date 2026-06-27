# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Nuxt 3 personal landing page ("Rys3t's Landing Page") that displays a profile card with a rotating bio and a grid of social media links. Originally migrated from a static landing page to Nuxt 3 (see README.md).

## Commands

This project uses **pnpm** (pinned via `packageManager` in `package.json`), not npm/yarn.

- `pnpm dev` — start the dev server (Nuxt dev, with devtools enabled)
- `pnpm build` — production build
- `pnpm generate` — static site generation
- `pnpm preview` — preview a production build locally
- `pnpm install` triggers `postinstall` → `nuxt prepare` (regenerates `.nuxt/`)
- Build scripts for native/postinstall packages (`esbuild`, `@parcel/watcher`, `scrollreveal`) are explicitly allow-listed in `pnpm-workspace.yaml` under `allowBuilds` — pnpm blocks arbitrary postinstall scripts by default, so new deps with build scripts will need approval there (`pnpm approve-builds`) before `pnpm install` succeeds.

There is no lint or test script configured in `package.json` — there is no test suite in this repo.

Formatting is via Prettier (`prettier-plugin-tailwindcss` for class sorting), config in `.prettierrc.json` (printWidth 120). Run via `npx prettier --write .` if needed; no script is wired up.

## Architecture

- **Nuxt 3 + `@nuxt/ui`** with `@nuxtjs/tailwindcss` and `@nuxtjs/color-mode` modules, plus `nuxt-gtag` for Google Analytics (tracking ID hardcoded in `nuxt.config.ts`).
- File-based routing under `pages/`: `index.vue` is the real landing page; `about.vue` is unused scaffold boilerplate from `nuxt create`.
- `app.vue` is just a `<NuxtPage />` shell.
- **Data-driven cards**: the composable `composables/useSocials.ts` exports `useSocials()`, returning a reactive `cards` array (`SocialCard[]`: title, imageUrl, website). `pages/index.vue` loops over this to render `Card` components — to add/remove a social link, edit this composable rather than the page template.
- **Components**:
  - `LogoSection.vue` — profile picture + auto-rotating bio text (interval-based fade transition, no external state).
  - `Card.vue` — a single social link tile; click opens `website` in a new tab.
  - `Footer.vue` — static footer.
  - `SideBar.vue` — drawer-style sidebar nav; currently commented out in `index.vue` (`<!-- <SideBar /> -->`), not active.
- **Dark mode**: handled via `@nuxtjs/color-mode` (`useColorMode()`), toggled manually by a button in `index.vue`; preference defaults to light (`nuxt.config.ts` `colorMode.preference`). Dark-mode-aware styling is done with Tailwind `dark:` variants throughout, not `@nuxt/ui`'s own theming.
- Icons/images for social links live in `public/icon/`; reference them as `/icon/<name>.png`.
- No server API routes are in active use (`server/` only has a `tsconfig.json`).
