import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// ─── Favorites Helpers ──────────────────────────────────

export const addFavorite = async (userId: string, movieId: number) => {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, movie_id: movieId })
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

// ─── Unified Favorites (Supabase + AsyncStorage fallback) ───

const LOCAL_FAVORITES_KEY = 'favorites';

export const unifiedGetFavorites = async (userId: string | null): Promise<number[]> => {
  if (userId) {
    return getFavorites(userId);
  }
  const stored = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const unifiedIsFavorite = async (userId: string | null, movieId: number): Promise<boolean> => {
  if (userId) {
    return isFavorite(userId, movieId);
  }
  const stored = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);
  const ids: number[] = stored ? JSON.parse(stored) : [];
  return ids.includes(movieId);
};

export const unifiedAddFavorite = async (userId: string | null, movieId: number): Promise<void> => {
  if (userId) {
    await addFavorite(userId, movieId);
    return;
  }
  const stored = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);
  const ids: number[] = stored ? JSON.parse(stored) : [];
  if (!ids.includes(movieId)) {
    ids.push(movieId);
    await AsyncStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(ids));
  }
};

export const unifiedRemoveFavorite = async (userId: string | null, movieId: number): Promise<void> => {
  if (userId) {
    await removeFavorite(userId, movieId);
    return;
  }
  const stored = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);
  let ids: number[] = stored ? JSON.parse(stored) : [];
  ids = ids.filter((id) => id !== movieId);
  await AsyncStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(ids));
};

export const migrateLocalFavoritesToSupabase = async (userId: string): Promise<void> => {
  const stored = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);
  const localIds: number[] = stored ? JSON.parse(stored) : [];
  if (localIds.length === 0) return;

  const existing = await getFavorites(userId);
  const toAdd = localIds.filter((id) => !existing.includes(id));

  for (const movieId of toAdd) {
    try {
      await addFavorite(userId, movieId);
    } catch {}
  }

  await AsyncStorage.removeItem(LOCAL_FAVORITES_KEY);
};
