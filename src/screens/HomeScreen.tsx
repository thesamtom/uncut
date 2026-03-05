import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  SectionList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MovieCard from '../components/MovieCard';
import { Movie, Genre } from '../types/movie';
import { getUpcomingMovies, getGenres, discoverMovies, calculateHypeScore } from '../services/tmdbApi';
import { Colors } from '../theme/colors';
import { Spacing, Fonts } from '../theme';

// Malayalam, Hindi, English (Hollywood)
const ALLOWED_LANGUAGES = ['ml', 'hi', 'en'];

type RootStackParamList = {
  HomeTabs: undefined;
  MovieDetail: { movieId: number };
};

interface MonthSection {
  title: string;
  data: Movie[][];
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genreMap, setGenreMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchMovies = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        refresh ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Fetch most popular upcoming movies for each language
      const [mlRes, hiRes, enRes, genres] = await Promise.all([
        discoverMovies({ page: pageNum, with_original_language: 'ml', sort_by: 'popularity.desc' }),
        discoverMovies({ page: pageNum, with_original_language: 'hi', sort_by: 'popularity.desc' }),
        discoverMovies({ page: pageNum, with_original_language: 'en', sort_by: 'popularity.desc' }),
        pageNum === 1 ? getGenres() : Promise.resolve([]),
      ]);

      if (pageNum === 1 && genres.length > 0) {
        const map: Record<number, string> = {};
        genres.forEach((g: Genre) => { map[g.id] = g.name; });
        setGenreMap(map);
      }

      // Combine, deduplicate, and keep only the most hyped
      const allResults = [...mlRes.results, ...hiRes.results, ...enRes.results];
      const uniqueMap = new Map<number, Movie>();
      allResults.forEach((m) => uniqueMap.set(m.id, m));
      const combined = Array.from(uniqueMap.values())
        .sort((a, b) => calculateHypeScore(b) - calculateHypeScore(a))
        .slice(0, 30);

      setTotalPages(Math.max(mlRes.total_pages, hiRes.total_pages, enRes.total_pages));

      if (refresh || pageNum === 1) {
        setMovies(combined);
      } else {
        setMovies((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMovies = combined.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newMovies];
        });
      }
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch movies:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies(1);
  }, [fetchMovies]);

  const onRefresh = () => fetchMovies(1, true);

  const loadMore = () => {
    if (!loadingMore && page < totalPages) {
      fetchMovies(page + 1);
    }
  };

  const handleMoviePress = (movie: Movie) => {
    navigation.navigate('MovieDetail', { movieId: movie.id });
  };

  // Group by month in chronological order
  // Top 3 most hyped per language per month = 9 movies max per month
  const groupedByMonth = (): MonthSection[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter to upcoming only
    const upcoming = movies.filter((m) => {
      if (!m.release_date) return false;
      if (!ALLOWED_LANGUAGES.includes(m.original_language)) return false;
      return new Date(m.release_date) >= today;
    });

    // Group by month key (YYYY-MM for sorting)
    const monthMap: Record<string, Movie[]> = {};
    upcoming.forEach((movie) => {
      const d = new Date(movie.release_date);
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[sortKey]) monthMap[sortKey] = [];
      monthMap[sortKey].push(movie);
    });

    // Sort months chronologically, then pick top 3 per language in each month
    const sortedMonths = Object.keys(monthMap).sort();

    return sortedMonths.map((sortKey) => {
      const monthMovies = monthMap[sortKey];
      const displayTitle = new Date(monthMovies[0].release_date)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Pick top 3 most hyped from each language
      const pickedMovies: Movie[] = [];
      for (const lang of ALLOWED_LANGUAGES) {
        const langMovies = monthMovies
          .filter((m) => m.original_language === lang)
          .sort((a, b) => calculateHypeScore(b) - calculateHypeScore(a))
          .slice(0, 3);
        pickedMovies.push(...langMovies);
      }

      // Sort final list by hype score descending
      pickedMovies.sort((a, b) => calculateHypeScore(b) - calculateHypeScore(a));

      // Group into pairs for 2-column layout
      const pairs: Movie[][] = [];
      for (let i = 0; i < pickedMovies.length; i += 2) {
        pairs.push(pickedMovies.slice(i, i + 2));
      }
      return { title: displayTitle, data: pairs };
    }).filter((section) => section.data.length > 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading upcoming movies...</Text>
      </View>
    );
  }

  const sections = groupedByMonth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>UNCUT</Text>
        <Text style={styles.subtitle}>Upcoming Movies</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `pair-${index}`}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item: pair }) => (
          <View style={styles.row}>
            {pair.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onPress={handleMoviePress}
                genreMap={genreMap}
              />
            ))}
            {pair.length === 1 && <View style={styles.emptyCard} />}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color={Colors.accent}
              style={{ marginVertical: Spacing.lg }}
            />
          ) : null
        }
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
  },
  appName: {
    fontSize: 32,
    fontFamily: Fonts.black,
    color: Colors.accent,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginTop: Spacing.md,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontFamily: Fonts.bold,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyCard: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});

export default HomeScreen;
