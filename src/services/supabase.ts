import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WatchlistEntry, WatchlistStatus } from '../types/watchlist';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Auth Helpers ───────────────────────────────────────

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// ─── Favorites / Watchlist Helpers ──────────────────────────────────

export const addFavorite = async (
  userId: string,
  movieId: number,
  status: WatchlistStatus = 'want_to_watch',
  rating: number | null = null,
  notes: string | null = null,
) => {
  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      movie_id: movieId,
      status,
      rating,
      notes,
      notify: false,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const removeFavorite = async (userId: string, movieId: number) => {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('movie_id', movieId);
  if (error) throw error;
};

export const getFavorites = async (userId: string): Promise<number[]> => {
  const { data, error } = await supabase
    .from('favorites')
    .select('movie_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []).map((row: { movie_id: number }) => row.movie_id);
};

export const isFavorite = async (userId: string, movieId: number): Promise<boolean> => {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('movie_id', movieId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
};

// ─── Watchlist 2.0 Helpers ──────────────────────────────

export const updateWatchlistStatus = async (
  userId: string,
  movieId: number,
  status: WatchlistStatus,
): Promise<void> => {
  const { error } = await supabase
    .from('favorites')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('movie_id', movieId);
  if (error) throw error;
};

export const updateWatchlistRating = async (
  userId: string,
  movieId: number,
  rating: number | null,
  notes: string | null = null,
): Promise<void> => {
  const { error } = await supabase
    .from('favorites')
    .update({ rating, notes, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('movie_id', movieId);
  if (error) throw error;
};

export const getWatchlistEntry = async (
  userId: string,
  movieId: number,
): Promise<WatchlistEntry | null> => {
  const { data, error } = await supabase
    .from('favorites')
    .select('movie_id, status, rating, notes, notify, created_at, updated_at')
    .eq('user_id', userId)
    .eq('movie_id', movieId)
    .maybeSingle();
  if (error) throw error;
  return data as WatchlistEntry | null;
};

export const getWatchlistByStatus = async (
  userId: string,
  status?: WatchlistStatus,
): Promise<WatchlistEntry[]> => {
  let query = supabase
    .from('favorites')
    .select('movie_id, status, rating, notes, notify, created_at, updated_at')
    .eq('user_id', userId);
  if (status) query = query.eq('status', status);
  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as WatchlistEntry[];
};

// ─── Unified Favorites (Supabase + AsyncStorage fallback) ───

const LOCAL_FAVORITES_KEY = 'favorites_v2';

const getLocalWatchlist = async (): Promise<WatchlistEntry[]> => {
  const stored = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveLocalWatchlist = async (entries: WatchlistEntry[]): Promise<void> => {
  await AsyncStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(entries));
};

export const unifiedGetFavorites = async (userId: string | null): Promise<number[]> => {
  if (userId) {
    return getFavorites(userId);
  }
  const entries = await getLocalWatchlist();
  return entries.map((e) => e.movie_id);
};

export const unifiedGetWatchlist = async (
  userId: string | null,
  status?: WatchlistStatus,
): Promise<WatchlistEntry[]> => {
  if (userId) {
    return getWatchlistByStatus(userId, status);
  }
  const entries = await getLocalWatchlist();
  if (status) return entries.filter((e) => e.status === status);
  return entries;
};

export const unifiedGetWatchlistEntry = async (
  userId: string | null,
  movieId: number,
): Promise<WatchlistEntry | null> => {
  if (userId) {
    return getWatchlistEntry(userId, movieId);
  }
  const entries = await getLocalWatchlist();
  return entries.find((e) => e.movie_id === movieId) || null;
};

export const unifiedIsFavorite = async (userId: string | null, movieId: number): Promise<boolean> => {
  if (userId) {
    return isFavorite(userId, movieId);
  }
  const entries = await getLocalWatchlist();
  return entries.some((e) => e.movie_id === movieId);
};

export const unifiedAddFavorite = async (
  userId: string | null,
  movieId: number,
  status: WatchlistStatus = 'want_to_watch',
  rating: number | null = null,
  notes: string | null = null,
): Promise<void> => {
  if (userId) {
    await addFavorite(userId, movieId, status, rating, notes);
    return;
  }
  const entries = await getLocalWatchlist();
  if (!entries.some((e) => e.movie_id === movieId)) {
    entries.push({
      movie_id: movieId,
      status,
      rating,
      notes,
      notify: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await saveLocalWatchlist(entries);
  }
};

export const unifiedUpdateStatus = async (
  userId: string | null,
  movieId: number,
  status: WatchlistStatus,
): Promise<void> => {
  if (userId) {
    await updateWatchlistStatus(userId, movieId, status);
    return;
  }
  const entries = await getLocalWatchlist();
  const entry = entries.find((e) => e.movie_id === movieId);
  if (entry) {
    entry.status = status;
    entry.updated_at = new Date().toISOString();
    await saveLocalWatchlist(entries);
  }
};

export const unifiedUpdateRating = async (
  userId: string | null,
  movieId: number,
  rating: number | null,
  notes: string | null = null,
): Promise<void> => {
  if (userId) {
    await updateWatchlistRating(userId, movieId, rating, notes);
    return;
  }
  const entries = await getLocalWatchlist();
  const entry = entries.find((e) => e.movie_id === movieId);
  if (entry) {
    entry.rating = rating;
    entry.notes = notes;
    entry.updated_at = new Date().toISOString();
    await saveLocalWatchlist(entries);
  }
};

export const unifiedRemoveFavorite = async (userId: string | null, movieId: number): Promise<void> => {
  if (userId) {
    await removeFavorite(userId, movieId);
    return;
  }
  const entries = await getLocalWatchlist();
  const filtered = entries.filter((e) => e.movie_id !== movieId);
  await saveLocalWatchlist(filtered);
};

export const migrateLocalFavoritesToSupabase = async (userId: string): Promise<void> => {
  // Migrate v2 entries
  const entries = await getLocalWatchlist();
  if (entries.length === 0) {
    // Also try old v1 key
    const oldStored = await AsyncStorage.getItem('favorites');
    const oldIds: number[] = oldStored ? JSON.parse(oldStored) : [];
    if (oldIds.length === 0) return;

    const existing = await getFavorites(userId);
    const toAdd = oldIds.filter((id) => !existing.includes(id));
    for (const movieId of toAdd) {
      try { await addFavorite(userId, movieId); } catch {}
    }
    await AsyncStorage.removeItem('favorites');
    return;
  }

  const existing = await getFavorites(userId);
  for (const entry of entries) {
    if (!existing.includes(entry.movie_id)) {
      try {
        await addFavorite(userId, entry.movie_id, entry.status, entry.rating, entry.notes);
      } catch {}
    }
  }

  await AsyncStorage.removeItem(LOCAL_FAVORITES_KEY);
  await AsyncStorage.removeItem('favorites');
};
