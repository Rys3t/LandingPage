# Project Guide: Photography Portfolio

## Purpose

This repository is a responsive photography portfolio for **Rys3t_**, with light and dark themes.
It presents a masonry gallery of photographs, which users can narrow by work
type (portrait/events or street), series, and tags, then view in a
keyboard-accessible lightbox.

The site uses a static Vue frontend plus Node.js gallery and Sharp image Functions.
`/api/gallery` reads Cloudinary's Search API on the server with fixed collection
scopes, then returns a public field allowlist. It is not a general Admin API proxy.
The browser never imports the checked-in `gallery.json`. It fetches the catalogue
at runtime and refreshes every 60 seconds while visible (also on return to the tab).
Thumbnails use Cloudinary's CDN via `/images`; Lightbox uses `/api/image`, which
checks the runtime catalogue and burns the SVG logo into WebP pixels.

## Stack and commands

- Vue 3 (Composition API, single-file components)
- Vite 6
- pnpm 11 (`packageManager` is pinned in `package.json`)
- Cloudinary Search/Admin API server-side at runtime; image-delivery CDN for images

```powershell
pnpm.cmd install
pnpm.cmd run dev
pnpm.cmd run build                 # frontend build; no catalogue or credentials needed
pnpm.cmd run fetch:gallery         # optional local catalogue export; not used by website
pnpm.cmd run build:full            # legacy export + build; deployment uses build
```

On Windows, use `pnpm.cmd` if the PowerShell execution policy blocks
`pnpm.ps1`.

Run `pnpm.cmd test` for image compositing and API boundary tests. There is no lint command. At a minimum, verify UI
changes with `pnpm.cmd run build`; visually check both desktop and <=860px
layouts when changing components or CSS.

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/main.js` | Vue application entry point; imports global CSS. |
| `index.html`, `src/pages/AboutPage.vue` | Default `/` entry using the shared app shell; lazy-loaded profile content in the main area. |
| `src/components/landing/`, `src/data/socials.js`, `src/assets/social/` | Migrated profile, rotating bio, nine social cards and footer; original local icons. |
| `src/App.vue` | Owns gallery/about navigation, shared sidebar state, selected collection/series/tags, filtered ordering, and lightbox index. |
| `src/components/Header.vue` | Sticky header, navigation toggle, language switcher, scroll glass effect. |
| `src/components/Sidebar.vue` | Localized collection/series/tag filters, fuzzy search, filter reset. |
| `src/components/MasonryGallery.vue` | Row-major CSS-grid masonry layout, lazy thumbnails, hover captions, open event. |
| `src/components/Lightbox.vue` | Modal image view; close, previous/next controls, Escape and arrow-key navigation. |
| `api/gallery.js`, `server/gallery.js` | Runtime public catalogue endpoint, explicit field allowlist, ETag and remaining-lifetime CDN cache. |
| `server/catalogue.js` | Scoped Cloudinary search, pagination, metadata normalization, per-instance cache and refresh coalescing. |
| `api/image.js`, `server/watermark.js`, `server/image-version.js` | Sharp image endpoint; live catalogue allowlist, bounded input/output, per-image version plus logo/policy hash. |
| `src/lib/cld.js` | The only image URL helper. Generates Cloudinary URLs and responsive `srcset`; uses Picsum for demo entries. |
| `src/data/gallery.json` | Historical/optional local export only; never import into frontend or Functions. Do not casually hand-edit. |
| `scripts/fetch-gallery.mjs` | Optional export using the same server catalogue loader; does not publish data. |
| `src/style.css` | Global reset, design tokens, typography, focus and reduced-motion rules. |
| `.env.example` | Required Cloudinary variable names; safe template only. |

## Data contract

The private server catalogue (and optional local export) has these top-level fields:

```text
generatedAt, cloudName, collections[], series[], tags[], items[]
```

Each collection contains `id`, `rootFolder`, and `count`. Series and tag
summaries contain their owning `collection`. An item contains `collection`,
`publicId`, `folder`, `series`, `format`, `width`, `height`, `tags`, `title`,
`caption`, `createdAt`, and Cloudinary `version`.

`/api/gallery` returns `version`, `collections`, `series`, `tags`, and `items`.
Only collection `id/count`, scoped summary `collection/name/count`, and item
`publicId/collection/series/width/height/tags/title/caption/version/imageVersion`
are public. Do not return `cloudName`, `rootFolder`, `folder`, raw API responses,
or credentials. Public IDs and displayed metadata remain visible to visitors.
The content version excludes fetch time so unchanged polling does not remount the gallery.
`imageVersion` hashes the processing policy, logo, cloud, ID and asset version.

Cloudinary conventions shared by the API and `fetch-gallery.mjs`:

- Portrait/event search scope is
  `asset_folder:${GALLERY_PORTFOLIO_ROOT_FOLDER}/*` (default root:
  `portfolio`). `GALLERY_ROOT_FOLDER` remains a legacy fallback for this root.
- Street search scope is `asset_folder:${GALLERY_STREET_ROOT_FOLDER}/*`
  (default root: `street`).
- Each root maps to a **collection**; the immediate image-folder name becomes
  the displayed **series** within that collection.
- Cloudinary asset tags become displayed **tags**.
- Context fields `title` or `caption` become the card/lightbox title.
- Context fields `alt` or `description` become the lightbox caption.
- Only public `image/upload` assets in the configured folder scopes are included.
- Results are fetched page-by-page (up to 500 each, capped at 20 pages per collection)
  and initially ordered by newest Cloudinary creation date. An incomplete or failed
  search fails the refresh instead of publishing a partial catalogue.

The sidebar only exposes the series and tags owned by the active collection, so
portrait/event and street taxonomies never mix. Switching collections clears
the selected series and tags. Only one tag can be selected at a time: selecting
another replaces it, and selecting it again clears it. Choosing a series keeps
the selected tag, and toggling tags keeps the selected
series. A Lightbox series link also keeps the current tags; only a Lightbox tag
link uses single-destination navigation, clearing existing filters before
applying that tag. The resulting images are grouped by the scoped order in
`gallery.series`.

Filter state is shareable through query parameters. Non-default work types use
`collection`; the selected series uses `series`; the selected tag uses one
`tags` parameter, for example
`?collection=street&series=Taipei+Night&tags=rain`. Unknown or
out-of-collection values are discarded. Legacy URLs with repeated `tags`
parameters retain only the first valid tag. Browser back/forward navigation
restores the corresponding filters.

Initial URL validation waits for the first successful catalogue request. A refresh
revalidates filters with `replaceState` and tracks the Lightbox photo by ID instead
of its old array index. Initial load, failure and retry states support en/ja/zh.
Failed refreshes retain previously displayed data with a visible notice; the image
server fails closed when it cannot refresh its expired allowlist.

## UI and responsiveness

- The header theme toggle preserves the shared layout and defaults to light. Light
  mode uses Swiss-inspired paper/ink/red tokens in `src/style.css`. The selection
  persists as `portfolio-theme`; `public/theme.js` restores it before first paint
  in all HTML entries. First visits and unavailable/invalid storage use light;
  an explicit saved dark preference is preserved. It does not follow the OS theme.
  Image overlays retain white text for photo contrast.

- `/` preserves the source LandingPage profile, card order, bio rotation,
  footer, and one-column / >=1024px two-column layout. It uses the portfolio's
  shared dark palette and typography; component styles stay scoped. About and
  gallery content share the same persistent Header and Sidebar in `App.vue`.
  The Header is hidden on About, with its layout height offset set to zero;
  returning to the gallery restores the Header.
  The header link and Photography card switch views without reloading, preserving
  collection/series/tag filters in the URL. Sidebar filter actions return to the
  gallery; browser back/forward restores the view and filters. All HTML entries
  load `src/main.js`, so direct visits and reloads also include the shared shell.
  Other social cards keep their original destinations and open a new tab.
  Vite builds only the root AboutPage entry and the `/gallery/` gallery entry.
  The legacy `/about/` HTML entry is removed; do not add a compatibility redirect.
  Do not add a catch-all rewrite that intercepts `/images` or `/api/image`.

- Desktop breakpoint: `861px` and above. The sidebar is sticky and initially
  open.
- The collection switcher stays above independently scrollable series and tag
  sections. Collection counts and the "all works" count are scoped.
  Sidebar top padding is 16px. Headings and controls do not shrink; series names
  wrap, and short viewports allow the sidebar itself to scroll while retaining
  usable minimum heights for both filter sections.
- The header language switcher supports English (`en`), Japanese (`ja`), and
  Traditional Chinese (`zh`). It localizes sidebar UI copy, persists the choice
  in `localStorage` under `portfolio-locale`, and updates the document language.
- Mobile: the sidebar becomes an overlay beneath the sticky header, with a
  scrim; the masonry gallery uses three columns at 801–860px and two at <=800px.
- The masonry effect preserves left-to-right, then top-to-bottom DOM order. It
  calculates `grid-row` spans from the container width and the CSS custom
  property `--column-count`; cells stay hidden until the first valid measure to
  prevent an 8px default row from causing first-paint overlap. Keep the CSS row
  size/gaps and `measureLayout()` in sync, and retain both ResizeObserver and
  window-resize handling when changing this component.
- Thumbnail URLs use `f_auto`, `q_auto:eco`, widths via `srcset`, lazy loading,
  and intrinsic dimensions. Lightbox images use a maximum 2048px-wide WebP variant
  with a bottom-centred logo composited by Sharp (6% of image width, capped by
  image height). No separate DOM watermark is rendered.

## Security and deployment

- `vercel.json` rewrites `/images/:path*` to the catalogue's Cloudinary cloud.
  `src/lib/cld.js` uses this same-origin path for thumbnails and `srcset` in all
  environments. Vite development and preview use an equivalent proxy configured
  in `vite.config.js`. Keep the rewrite destination in sync when changing the
  catalogue cloud name; verify deployed rewrites on Vercel separately.
  This public proxy does not provide access control.
- Never move `CLOUDINARY_API_SECRET` into client code, Vite public variables,
  or `gallery.json`. Only server-side Cloudinary search and the optional export use it.
- `.env` is ignored and must provide `CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`;
  `GALLERY_PORTFOLIO_ROOT_FOLDER` and `GALLERY_STREET_ROOT_FOLDER` are optional.
  `GALLERY_CACHE_SECONDS` defaults to 60 (allowed 30–3600).
- Deploy the repository to Vercel with output directory `dist`; Vercel must also
  build `api/gallery.js` and `api/image.js`. Uploading only `dist` to a static host cannot serve the
  catalogue or Lightbox image API. `pnpm run dev` and `pnpm run preview` provide local API
  middleware, but do not verify Vercel deployment or CDN caching.
- The API accepts only `id` and `v`, with IDs from the catalogue; it does not
  accept arbitrary URLs or a no-watermark option. Source downloads are limited
  to 20 MiB / 15 seconds / 50 million pixels, and output to 4 MB. Errors are
  uncached and do not fall back to an unwatermarked image. Successful responses
  cache in the browser for one hour and Vercel CDN for one day. Asset replacement
  changes the per-image version automatically, without rebuilding. Bump the processing
  revision in `server/image-version.js` when changing rendering policy; logo/policy
  changes need a rebuild. Previously cached images can survive catalogue removal
  until their browser/CDN TTL expires; this is not immediate revocation.
- The public Cloudinary originals and thumbnail proxy remain publicly accessible;
  this feature stamps Lightbox delivery, not access control.
- `vercel.json` sets `pnpm run build` and `dist`. Configure Cloudinary credentials
  for the relevant Vercel Production/Preview runtime environments, then deploy.
  No rebuild is needed for photo/tag/caption changes. Use the same cloud name in
  the `/images` rewrite. The logo is the only explicitly included Function asset.
- The catalogue has a 60-second warm-instance cache and coalesces concurrent
  refreshes. CDN TTL uses the remaining cache lifetime; errors use `no-store`.
  Upstream failures back off for 30 seconds. There is no public force-refresh input.
  Cloudinary Search indexing plus frontend polling adds delay: default visible-page
  freshness is roughly 1–2 minutes after indexing, not a hard realtime guarantee.
- Instance caches are not globally shared. Multiple cold instances and the gallery/image
  Functions may each query Cloudinary; Search/Admin rate limits still apply. For higher
  traffic or stricter freshness, use verified webhooks and a shared private datastore.
- The historical JSON is kept in Git but excluded from the deployed frontend and
  Function imports. A public repository still exposes its contents/history. Vite dev
  denies raw catalogue/server files; production serves only `dist` and API responses.

## Working conventions

- Keep server normalization, the public field allowlist, optional export, frontend
  consumers and this document consistent when changing the data schema.
- Route every Cloudinary display URL through `src/lib/cld.js` so format,
  quality, size limits, and demo behavior stay consistent.
- `gallery.json` contains historical real metadata, not secrets; it is no longer a
  website data source. Never reintroduce a frontend import or a production fallback.
- An untracked `.claude/` worktree directory may be present locally. It is not
  application source and should not be modified or committed as part of normal
  frontend work.
