import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import MovieCard from '../components/MovieCard';
import { useAuth } from '../context/AuthContext';
import { unifiedGetFavorites, unifiedRemoveFavorite } from '../services/supabase';
import { Movie, MovieDetails, Genre } from '../types/movie';
import { getMovieDetails, getGenres } from '../services/tmdbApi';
import { Colors } from '../theme/colors';
import { Spacing, Fonts } from '../theme';

type RootStackParamList = {
  HomeTabs: undefined;
  MovieDetail: { movieId: number };
};

const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [movies, setMovies] = useState<MovieDetails[]>([]);
  const [genreMap, setGenreMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const favoriteIds = await unifiedGetFavorites(user?.id ?? null);

      if (favoriteIds.length === 0) {
        setMovies([]);
        setLoading(false);
        return;
      }

      // Load genres
      const genreList = await getGenres();
      const map: Record<number, string> = {};
      genreList.forEach((g: Genre) => { map[g.id] = g.name; });
      setGenreMap(map);

      // Fetch movie details for each favorite
      const moviePromises = favoriteIds.map((id) =>
        getMovieDetails(id).catch(() => null)
      );
      const results = await Promise.all(moviePromises);
      const validMovies = results.filter((m): m is MovieDetails => m !== null);

      setMovies(validMovies);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh favorites whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const handleMoviePress = (movie: Movie) => {
    navigation.navigate('MovieDetail', { movieId: movie.id });
  };

  const handleRemoveFavorite = async (movieId: number) => {
    Alert.alert(
      'Remove from Watchlist',
      'Are you sure you want to remove this movie?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await unifiedRemoveFavorite(user?.id ?? null, movieId);
              setMovies((prev) => prev.filter((m) => m.id !== movieId));
            } catch (err) {
              console.error('Failed to remove favorite:', err);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading watchlist...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Watchlist</Text>
        <Text style={styles.count}>{movies.length} movies</Text>
      </View>

      <FlatList
        data={movies}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View>
            <MovieCard movie={item} onPress={handleMoviePress} genreMap={genreMap} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveFavorite(item.id)}
            >
              <Ionicons name="trash-outline" size={14} color={Colors.error} />
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No movies saved</Text>
            <Text style={styles.emptySubtitle}>
              Movies you add to your watchlist will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.textMuted,
    marginTop: Spacing.md,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.extraBold,
    color: Colors.textPrimary,
  },
  count: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Fonts.medium,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  row: {
    justifyContent: 'space-between',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  removeText: {
    color: Colors.error,
    fontSize: 12,
    fontFamily: Fonts.medium,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl * 3,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontFamily: Fonts.bold,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
});

export default FavoritesScreen;
