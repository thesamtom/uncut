// ──────────────────────────────────────────────────────────────────────
// Watchlist Types
// ──────────────────────────────────────────────────────────────────────

export type WatchlistStatus = 'want_to_watch' | 'watching' | 'watched' | 'skipped';

export interface WatchlistEntry {
  movie_id: number;
  status: WatchlistStatus;
  rating: number | null;     // 1–10
  notes: string | null;
  notify: boolean;
  created_at: string;
  updated_at: string;
}

export const WATCHLIST_STATUS_LABELS: Record<WatchlistStatus, string> = {
  want_to_watch: 'Want to Watch',
  watching: 'Watching',
  watched: 'Watched',
  skipped: 'Skipped',
};

export const WATCHLIST_STATUS_ICONS: Record<WatchlistStatus, string> = {
  want_to_watch: 'bookmark-outline',
  watching: 'eye-outline',
  watched: 'checkmark-circle-outline',
  skipped: 'close-circle-outline',
};
