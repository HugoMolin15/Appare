# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Appare** is a mobile-first Japanese vocabulary flashcard app built on Tomoko Yamane's curriculum. It runs as a client-side SPA (SSR disabled in `src/routes/+layout.ts`) with local-first state (localStorage) and optional Supabase cloud sync.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # Type-check with svelte-check
npm run check:watch  # Type-check in watch mode
npm run prepare      # Sync SvelteKit types (after changing routes)
```

No test framework. `npm run check` is the correctness gate.

## Tech Stack

- **SvelteKit 2 + Svelte 5** (runes mode: `$state`, `$derived`, `$effect`)
- **TypeScript** (strict mode)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Supabase** (PostgreSQL + Auth via `@supabase/supabase-js`)
- **Vercel** deployment via `@sveltejs/adapter-vercel`

## Architecture

### Local-First Sync
State lives in Svelte stores backed by localStorage. Supabase is optional — the app runs as guest mode if `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are not set.

- **Pull:** `pullFromSupabase(userId)` in `src/lib/services/sync.ts` — called on login, server wins on conflicts
- **Push:** `pushWord()`, `pushFolder()`, `pushSettingsUpdate()` — write-through helpers called after every CRUD op
- **Logout:** `clearAllStores()` wipes all local state

### Stores (`src/lib/stores/`)
| File | Purpose |
|------|---------|
| `auth.ts` | `currentUser`, `isLoggedIn`, `currentUserId` |
| `words.ts` | All vocabulary (seed bundle + user words) |
| `folders.ts` | Folder hierarchy |
| `history.ts` | Daily study records (date → word ID array) |
| `wordScores.ts` | Per-word proficiency: `'none' \| 'unknown' \| 'learning' \| 'known'` |
| `settings.ts` | User preferences (study goal, font size, card order, etc.) |
| `studySession.ts` | Transient state during active study session |
| `persisted.ts` | `persisted<T>(key, default, options)` — localStorage wrapper with `onChange` hooks for cloud sync |

### Seed Words
- 328 built-in words in `src/lib/data/seed-words.ts` (~103KB)
- IDs prefixed with `"seed-"` — never synced to Supabase, never deletable
- Lazy-loaded on first launch via `ensureSeeded()` gated by `SEED_VERSION` constant

### Database Schema (`schema.sql`)
Tables: `words`, `folders`, `study_history`, `settings`, `date_colors` — all with Row-Level Security (`user_id = auth.uid()`).

Key `words` columns: `id`, `user_id`, `italiano`, `hiragana`, `katakana`, `romaji`, `kanji`, `tags` (TEXT[]), `folder_id`, `word_type`, `created_at` (BIGINT ms).

## Key Conventions

- **Dates:** Always `YYYY-MM-DD` local format via `getLocalValue()` in `src/lib/utils/date.ts` — no UTC conversion
- **Seed IDs:** Anything starting with `"seed-"` is immutable curriculum data
- **Sync errors:** Logged but never block the UI (fire-and-forget pattern)
- **Scroll restore:** Tracked per-route; desktop uses `.main-content` div, mobile uses `window`
- **iOS edge swipe:** Left swipe-back gesture blocked globally in `src/routes/+layout.svelte`

## Routes

SvelteKit file-based routing under `src/routes/`:
- `/` — Dashboard (heatmap + study CTA)
- `/studia` — Flashcard study session; `/studia/seleziona` — word/folder picker
- `/parole` — Word list; `/parole/[id]` — word detail/edit
- `/cartelle` — Folder list; `/cartelle/[id]` — folder contents
- `/cronologia` — Study history heatmap
- `/nuova-parola`, `/nuova-cartella` — Create forms
- `/impostazioni` — Settings
- `/login` — Auth form

## Environment

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
