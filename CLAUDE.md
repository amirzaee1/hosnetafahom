# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

The actual application source lives inside a ZIP archive at the repo root:

```
کارگاه-حسن-تفاهم-و-یخ-شکن.zip
```

Extract it before making any edits:

```bash
unzip کارگاه-حسن-تفاهم-و-یخ-شکن.zip -d app
cd app
```

The extracted files are: `App.tsx`, `content.ts`, `types.ts`, `geminiService.ts`, `index.tsx`, `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `.env.local`, `.gitignore`, `README.md`.

## Development Commands

```bash
npm install
npm run dev      # starts at http://localhost:3000
npm run build
npm run preview
```

No test runner or linter is configured.

## Environment Setup

Set your Gemini API key in `.env.local` before running:

```
GEMINI_API_KEY=your_key_here
```

`vite.config.ts` forwards `GEMINI_API_KEY` as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` at build time.

## Architecture

This is a **single-page, paginated educational app** ("کارگاه حسن تفاهم و یخ شکن" — Workshop: Rapport Building and Ice Breaking). It is Persian-language, RTL, and mobile-first (max-width 430px).

### Data flow

`content.ts` exports a static `PAGES: PageContent[]` array — the sole source of educational content. Each `PageContent` has:
- `id`, optional `title`, `text` (Persian prose)
- `narrativeModel: NarrativeModel` — an enum used to select the AI image generation prompt style
- `highlights: string[]` — substrings rendered in alternating cyan/purple
- `primarySentences: string[]` — substrings rendered bold

`App` holds `currentPageIndex` in state and renders one page at a time.

### Scroll-to-unlock UX

`TextCard` places a sentinel `<div ref={sentinelRef}>` at the very bottom of the content. An `IntersectionObserver` in `App` watches it; only when it enters the viewport does `canProceed` become `true`, revealing the Next/Previous navigation bar. This resets on every page change. This is intentional UX — do not bypass it.

### AI image generation

`geminiService.ts` calls `gemini-2.5-flash-image` (via `@google/genai`) to produce a 1:1 flat 2D vector illustration for each page. The prompt encodes the page's `narrativeModel` and a 100-character excerpt of its text. Page 1 uses a hardcoded Unsplash URL instead. Images are fetched on component mount inside `Illustration`, with an `isMounted` guard to avoid state updates after unmount.

### Styling conventions

- **No Tailwind config** — Tailwind is loaded from CDN in `index.html`; use utility classes only
- **RTL** — `<html lang="fa" dir="rtl">` and the Vazirmatn font (loaded from jsDelivr CDN)
- **Color palette**: backgrounds `#0F172A` / `#111827`; accents `#22D3EE` (cyan), `#8B5CF6` (purple), `#22C55E` (green)
- **Glassmorphism**: use the `.glass-card` class (`backdrop-filter: blur(8px)`, semi-transparent background)
- **Custom animations** defined in `index.html` `<style>`: `animate-slide-up`, `animate-zoom-in`, `animate-bounce-in`

### Module resolution

`index.html` uses an **importmap** pointing to `esm.sh` CDNs for React, ReactDOM, and `@google/genai`. Vite handles the same imports for the build. Do not add imports that are not covered by the importmap when working with the raw HTML entrypoint.
