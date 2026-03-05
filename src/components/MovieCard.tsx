import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Movie } from '../types/movie';
import { getPosterUrl, calculateHypeScore } from '../services/tmdbApi';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing, Fonts } from '../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.md * 3) / 2;
const POSTER_HEIGHT = CARD_WIDTH * 1.5;
const INFO_PADDING = Spacing.sm + 2; // ✅ FIX 1: Computed outside StyleSheet

interface MovieCardProps {
  movie: Movie;
  onPress: (movie: Movie) => void;
  genreMap?: Record<number, string>;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onPress, genreMap }) => {
  const posterUri = getPosterUrl(movie.poster_path);

  // ✅ FIX 4: Guard against NaN/undefined from calculateHypeScore
  const rawScore = calculateHypeScore(movie);
  const hypeScore = typeof rawScore === 'number' && !isNaN(rawScore) ? rawScore : 0;

  // ✅ FIX 3: Guard against missing release_date
  const formattedDate = movie.release_date
    ? new Date(movie.release_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'TBA';

  const getHypeColor = (score: number): string => {
    if (score >= 80) return Colors.hypeHigh;
    if (score >= 50) return Colors.hypeMedium;
    return Colors.hypeLow;
  };

  // ✅ FIX 5: Fallback to null if genre is undefined
  const primaryGenreId = movie.genre_ids?.[0];
  const primaryGenre =
    genreMap && primaryGenreId !== undefined && genreMap[primaryGenreId]
      ? genreMap[primaryGenreId]
      : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(movie)}
      activeOpacity={0.8}
    >
      {/* Poster */}
      <View style={styles.posterContainer}>
        {posterUri ? (
          <Image
            source={{ uri: posterUri }}
            style={styles.poster}
            resizeMode="cover" // ✅ FIX 6: Prevents distortion
          />
        ) : (
          <View style={[styles.poster, styles.placeholderPoster]}>
            <Ionicons name="film-outline" size={40} color={Colors.textMuted} />
          </View>
        )}

        {/* Hype Badge */}
        <View style={[styles.hypeBadge, { backgroundColor: getHypeColor(hypeScore) }]}>
          <Text style={styles.hypeText}>🔥 {hypeScore}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {movie.title}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
        {primaryGenre && (
          <View style={styles.genreBadge}>
            <Text style={styles.genreText}>{primaryGenre}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  posterContainer: {
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: POSTER_HEIGHT,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  placeholderPoster: {
    backgroundColor: Colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hypeBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  hypeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  info: {
    padding: INFO_PADDING, // ✅ FIX 1: Uses pre-computed constant
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  date: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginBottom: 6,
  },
  genreBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentLight ?? '#E8F5EF', // ✅ FIX 2: Fallback if undefined
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  genreText: {
    color: Colors.accent,
    fontSize: 10,
    fontFamily: Fonts.semiBold,
  },
});

export default MovieCard;