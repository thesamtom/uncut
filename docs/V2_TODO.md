# UNCUT v2.0 — Feature Roadmap & TODO

> **Current state (v1.0):** Auth (email/password), TMDB-backed home feed (ML/HI/EN), search with genre + year filters & autocomplete, movie detail with trailer, cast, hype score & countdown, basic watchlist (add/remove), profile with placeholder settings.

---

## Phase 1 — Core Retention (Ship first) ✅ COMPLETE

### 1.1 Release-Day Reminders (Push Notifications) ✅
- [x] Create `src/services/notifications.ts` — permission request, token registration, schedule/cancel helpers using `expo-notifications`
- [x] Add Supabase table `push_tokens` (user_id, expo_push_token, platform, created_at)
- [x] Add Supabase table `reminders` (id, user_id, movie_id, remind_at, type: '7_days' | '1_day' | 'release_day', status)
- [x] On MovieDetailScreen add "Remind Me" button → schedule local notification 7 days before & on release day
- [x] Wire ProfileScreen notifications toggle to real `expo-notifications` permission grant/revoke
- [x] Show active reminders badge / list on FavoritesScreen or a new RemindersScreen
- [x] Handle notification tap → deep-link to MovieDetailScreen

### 1.2 Watchlist 2.0 (Statuses + Personal Rating) ✅
- [x] Extend Supabase `favorites` table → add columns: `status` (want_to_watch | watching | watched | skipped), `rating` (1–10 nullable), `notes` (text nullable), `notify` (boolean), `updated_at`
- [x] Create `src/types/watchlist.ts` with `WatchlistEntry` type
- [x] Update `src/services/supabase.ts` — CRUD helpers for new columns, migration of existing rows to `want_to_watch`
- [x] Update `src/services/supabase.ts` — `unifiedAddFavorite` accepts optional status, rating, notes
- [x] FavoritesScreen — add tab bar / segmented control: Want to Watch | Watched | All
- [x] FavoritesScreen — sort options: date added, release date, hype score, personal rating
- [x] MovieDetailScreen — replace simple heart toggle with status picker bottom sheet (Want / Watched / Skip)
- [x] MovieDetailScreen — star-rating input + optional notes field after marking "Watched"
- [x] Update AsyncStorage fallback to store full watchlist entry objects (not just IDs)

### 1.3 Similar & Recommended Movies ✅
- [x] Add `getSimilarMovies(movieId)` and `getRecommendations(movieId)` to `tmdbApi.ts` (TMDB endpoints `/movie/{id}/similar` and `/movie/{id}/recommendations`)
- [x] MovieDetailScreen — add horizontal "You might also like" carousel below trailer section
- [x] MovieDetailScreen — add "More from this director / cast" section using existing credits data
- [x] Make each card tappable → navigate to its own MovieDetailScreen

---

## Phase 2 — Personalization

### 2.1 User Preferences & Personalized Feed
- [ ] Add Supabase table `user_preferences` (user_id, preferred_languages[], preferred_genres[], release_window: 'upcoming' | 'all', created_at, updated_at)
- [ ] Create `src/screens/OnboardingPreferencesScreen.tsx` — language + genre picker shown after first sign-up
- [ ] Create `src/services/preferences.ts` — load / save preference helpers (Supabase + AsyncStorage fallback)
- [ ] HomeScreen — replace hardcoded `ALLOWED_LANGUAGES` with user's preferred languages
- [ ] HomeScreen — weight genre preferences into hype score or add a "For You" section at the top
- [ ] ProfileScreen — add "Content Preferences" menu item → navigate to preferences editor
- [ ] Update `src/context/` — add `PreferencesContext` to provide preferences app-wide

### 2.2 Real Profile
- [ ] Add Supabase table `profiles` (user_id, username, display_name, avatar_url, bio, created_at)
- [ ] On registration, save username to `profiles` table (currently collected but not stored)
- [ ] ProfileScreen — show username + display name instead of just email initials
- [ ] ProfileScreen — avatar upload (pick from gallery, upload to Supabase Storage, show on profile card)
- [ ] ProfileScreen — show stats: movies tracked, movies watched, average rating given
- [ ] ProfileScreen — editable display name + bio

---

## Phase 3 — Discovery & Utility

### 3.1 Advanced Search & Filters
- [ ] SearchScreen — add language filter chips (Malayalam, Hindi, English, + more)
- [ ] SearchScreen — add sort-by picker: Popularity, Release Date (soonest first), Hype Score, Rating
- [ ] SearchScreen — add toggle: "Upcoming only" vs "All movies"
- [ ] Add `searchPeople(query)` to `tmdbApi.ts` — search for actors/directors
- [ ] SearchScreen — cast/director search mode with results linking to their filmography
- [ ] SearchScreen — save recent searches (AsyncStorage, last 10)

### 3.2 Release Calendar
- [ ] Create `src/screens/CalendarScreen.tsx` — monthly calendar view of upcoming releases
- [ ] Add CalendarScreen as a new bottom tab (between Home and Search, use `calendar-outline` icon)
- [ ] Update `AppNavigator.tsx` — register new tab
- [ ] Each date cell shows poster thumbnails of releasing movies; tap → MovieDetailScreen
- [ ] Filter calendar by language, genre, or "my watchlist only"
- [ ] Highlight dates that have reminders set

### 3.3 Where to Watch (Streaming Availability)
- [ ] Add `getWatchProviders(movieId, region)` to `tmdbApi.ts` (TMDB endpoint `/movie/{id}/watch/providers`)
- [ ] MovieDetailScreen — add "Where to Watch" section below details for released movies
- [ ] Show streaming (Netflix, Prime, etc.), rent, and buy options with logos
- [ ] Let user set default region in preferences

---

## Phase 4 — Polish & Delight

### 4.1 Dark Mode
- [ ] Create `src/theme/darkColors.ts` with dark palette matching current color token names
- [ ] Create `src/context/ThemeContext.tsx` — light / dark / system toggle, persisted to AsyncStorage
- [ ] Update all screens + components to consume `ThemeContext` instead of importing `Colors` directly
- [ ] ProfileScreen — replace "Appearance" placeholder alert with real theme switcher (Light / Dark / System)
- [ ] Ensure nav theme (`LightNavTheme` in AppNavigator) switches dynamically

### 4.2 Animations & Micro-interactions
- [ ] Add shared-element transition from MovieCard → MovieDetailScreen (poster image)
- [ ] Add skeleton loaders on HomeScreen, SearchScreen, FavoritesScreen while data loads
- [ ] Animate hype-score badge fill on MovieDetailScreen using `react-native-reanimated`
- [ ] Pull-to-refresh haptic feedback
- [ ] Smooth bottom-sheet for watchlist status picker (use `@gorhom/bottom-sheet` or Reanimated)

### 4.3 Offline Support & Caching
- [ ] Cache home feed, genres, and watchlist movie details in AsyncStorage with TTL
- [ ] Show cached data instantly on app launch, then refresh in background
- [ ] Show offline banner when network is unavailable
- [ ] Queue watchlist changes made offline and sync when back online

---

## Phase 5 — Social & Growth (Later)

### 5.1 Share & Invite
- [ ] MovieDetailScreen — share button → native share sheet with movie poster, title, release date & deep link
- [ ] FavoritesScreen — "Share my watchlist" → generate shareable link or image
- [ ] Invite friends flow with referral tracking

### 5.2 Social Feed (Stretch)
- [ ] Friend system — follow / unfollow users
- [ ] Activity feed — "Sam added Inception to watchlist," "Priya rated Manjummel Boys 9/10"
- [ ] Shared watchlists for groups (e.g., "movies to watch together")
- [ ] Comments / reactions on movies

---

## New Files to Create (Summary)

| File | Purpose |
|------|---------|
| `src/services/notifications.ts` | Push notification helpers |
| `src/services/preferences.ts` | User preference load/save |
| `src/types/watchlist.ts` | Watchlist entry types |
| `src/screens/CalendarScreen.tsx` | Release calendar view |
| `src/screens/OnboardingPreferencesScreen.tsx` | Post-signup preference picker |
| `src/context/ThemeContext.tsx` | Dark/light theme provider |
| `src/context/PreferencesContext.tsx` | User preferences provider |
| `src/theme/darkColors.ts` | Dark mode color palette |
| `docs/V2_TODO.md` | This file |

## Supabase Schema Changes (Summary)

| Table | Change |
|-------|--------|
| `push_tokens` | **New** — stores Expo push tokens per user |
| `reminders` | **New** — scheduled release reminders |
| `favorites` | **Alter** — add status, rating, notes, notify, updated_at |
| `user_preferences` | **New** — languages, genres, release window |
| `profiles` | **New** — username, display name, avatar, bio |

## New Dependencies (Estimate)

| Package | Purpose |
|---------|---------|
| `@gorhom/bottom-sheet` | Watchlist status picker, filter sheets |
| `react-native-calendars` | Calendar screen |
| `expo-image-picker` | Avatar upload |
| `expo-sharing` | Native share sheet |
| `expo-haptics` | Micro-interaction feedback |

---

_Build order: Phase 1 → 2 → 3 → 4 → 5. Ship each phase as a minor release (v2.1, v2.2, …)._
