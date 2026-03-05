import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Keyboard,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import MovieCard from '../components/MovieCard';
import { Movie, Genre } from '../types/movie';
import { searchMovies, getGenres, discoverMovies, getImageUrl } from '../services/tmdbApi';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing, Fonts } from '../theme';

type RootStackParamList = {
  HomeTabs: undefined;
  MovieDetail: { movieId: number };
};

const YEARS = [2026, 2027, 2028];

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreMap, setGenreMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filters
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const genreList = await getGenres();
      setGenres(genreList);
      const map: Record<number, string> = {};
      genreList.forEach((g) => { map[g.id] = g.name; });
      setGenreMap(map);
    } catch {}
  };

  // Autocomplete: debounced fetch as user types
  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await searchMovies(text.trim());
      setSuggestions(res.results.slice(0, 5));
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const onQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 350);
  }, [fetchSuggestions]);

  const pickSuggestion = useCallback((movie: Movie) => {
    setQuery(movie.title);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
    navigation.navigate('MovieDetail', { movieId: movie.id });
  }, [navigation]);

  const handleSearch = useCallback(async () => {
    if (!query.trim() && !selectedGenre && !selectedYear) return;

    Keyboard.dismiss();
    setShowSuggestions(false);
    setLoading(true);
    setSearched(true);

    try {
      if (query.trim()) {
        const res = await searchMovies(query.trim());
        let results = res.results;

        // Apply local filters on search results
        if (selectedGenre) {
          results = results.filter((m) => m.genre_ids.includes(selectedGenre));
        }
        if (selectedYear) {
          results = results.filter((m) => {
            const year = new Date(m.release_date).getFullYear();
            return year === selectedYear;
          });
        }

        setMovies(results);
      } else {
        // Use discover API with filters
        const res = await discoverMovies({
          with_genres: selectedGenre?.toString(),
          primary_release_year: selectedYear || undefined,
        });
        setMovies(res.results);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedGenre, selectedYear]);

  const handleMoviePress = (movie: Movie) => {
    navigation.navigate('MovieDetail', { movieId: movie.id });
  };

  const clearSearch = () => {
    setQuery('');
    setMovies([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearched(false);
    setSelectedGenre(null);
    setSelectedYear(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={onQueryChange}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.suggestionItem,
                index < suggestions.length - 1 && styles.suggestionBorder,
              ]}
              onPress={() => pickSuggestion(item)}
              activeOpacity={0.6}
            >
              {item.poster_path ? (
                <Image
                  source={{ uri: getImageUrl(item.poster_path, 'w92')! }}
                  style={styles.suggestionPoster}
                />
              ) : (
                <View style={[styles.suggestionPoster, styles.suggestionPosterPlaceholder]}>
                  <Ionicons name="film-outline" size={16} color={Colors.textMuted} />
                </View>
              )}
              <View style={styles.suggestionTextWrap}>
                <Text style={styles.suggestionTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.release_date ? (
                  <Text style={styles.suggestionYear}>
                    {new Date(item.release_date).getFullYear()}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Genre Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Genre</Text>
        <FlatList
          horizontal
          data={genres.slice(0, 12)}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedGenre === item.id && styles.filterChipActive,
              ]}
              onPress={() =>
                setSelectedGenre(selectedGenre === item.id ? null : item.id)
              }
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedGenre === item.id && styles.filterChipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Year Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Year</Text>
        <View style={styles.yearRow}>
          {YEARS.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.filterChip,
                selectedYear === year && styles.filterChipActive,
              ]}
              onPress={() => setSelectedYear(selectedYear === year ? null : year)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedYear === year && styles.filterChipTextActive,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search Button */}
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Ionicons name="search" size={18} color="#FFFFFF" />
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>

      {/* Results */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={movies}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <MovieCard movie={item} onPress={handleMoviePress} genreMap={genreMap} />
          )}
          ListEmptyComponent={
            searched ? (
              <View style={styles.emptyState}>
                <Ionicons name="film-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No movies found</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Search for upcoming movies</Text>
              </View>
            )
          }
        />
      )}
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
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.extraBold,
    color: Colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 50,
    marginHorizontal: Spacing.md,
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.sm + 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  suggestionsBox: {
    marginHorizontal: Spacing.md + 8,
    marginTop: 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 20,
    overflow: 'hidden',
  },
  suggestionPoster: {
    width: 34,
    height: 50,
    borderRadius: 4,
    backgroundColor: Colors.background,
  },
  suggestionPosterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 10,
  },
  suggestionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  suggestionTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionTitle: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  suggestionYear: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.regular,
    marginLeft: Spacing.sm,
  },
  filterSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  filterLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  yearRow: {
    flexDirection: 'row',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.bold,
    marginLeft: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl * 2,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginTop: Spacing.md,
  },
});

export default SearchScreen;
