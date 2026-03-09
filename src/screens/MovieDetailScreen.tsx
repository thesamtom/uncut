import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Movie, MovieDetails, WatchProviderResult } from '../types/movie';
import {
  getMovieDetails,
  getPosterUrl,
  getBackdropUrl,
  getProfileUrl,
  getLogoUrl,
  calculateHypeScore,
  getPersonMovieCredits,
  getWatchProviders,
} from '../services/tmdbApi';
import CountdownTimer from '../components/CountdownTimer';
import TrailerPlayer from '../components/TrailerPlayer';
import HypeScoreBadge from '../components/HypeScoreBadge';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing, Fonts } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  unifiedIsFavorite,
  unifiedAddFavorite,
  unifiedRemoveFavorite,
} from '../services/supabase';


const { width } = Dimensions.get('window');

type RouteParams = {
  MovieDetail: { movieId: number };
};

type RootStackParamList = {
  HomeTabs: undefined;
  MovieDetail: { movieId: number };
};

const MovieDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'MovieDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { movieId } = route.params;
  const { user } = useAuth();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Watchlist state
  const [isFav, setIsFav] = useState(false);

  // You Might Like (crew filmography)
  const [crewPicks, setCrewPicks] = useState<Movie[]>([]);

  // Where to Watch
  const [watchProviders, setWatchProviders] = useState<WatchProviderResult | null>(null);
  const [providersFetched, setProvidersFetched] = useState(false);

  useEffect(() => {
    fetchMovie();
    checkFavorite();
  }, [movieId, user]);

  useEffect(() => {
    if (movie) {
      fetchCrewPicks();
      fetchWatchProviders();
    }
  }, [movie]);

  const fetchMovie = async () => {
    try {
      setLoading(true);
      const details = await getMovieDetails(movieId);
      setMovie(details);
    } catch (err) {
      console.error('Failed to fetch movie details:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const result = await unifiedIsFavorite(user?.id ?? null, movieId);
      setIsFav(result);
    } catch {}
  };

  const fetchCrewPicks = async () => {
    if (!movie) return;
    try {
      const director = movie.credits?.crew?.find((c) => c.job === 'Director');
      const topCast = movie.credits?.cast?.slice(0, 3) || [];
      const personIds: number[] = [];
      if (director) personIds.push(director.id);
      topCast.forEach((c) => personIds.push(c.id));

      const allCredits = await Promise.all(
        personIds.map((id) => getPersonMovieCredits(id).catch(() => ({ cast: [], crew: [] }))),
      );

      const seen = new Set<number>([movieId]);
      const picks: Movie[] = [];

      // Director's top movies first
      if (director && allCredits[0]) {
        const directorMovies = allCredits[0].crew
          .filter((m) => m.id !== movieId && m.poster_path && m.vote_count > 50)
          .sort((a, b) => b.vote_average - a.vote_average);
        for (const m of directorMovies) {
          if (!seen.has(m.id) && picks.length < 2) {
            seen.add(m.id);
            picks.push(m);
          }
        }
      }

      // Top cast movies
      const castStartIdx = director ? 1 : 0;
      for (let i = castStartIdx; i < allCredits.length && picks.length < 6; i++) {
        const actorMovies = allCredits[i].cast
          .filter((m) => m.id !== movieId && m.poster_path && m.vote_count > 50)
          .sort((a, b) => b.vote_average - a.vote_average);
        for (const m of actorMovies) {
          if (!seen.has(m.id) && picks.length < 6) {
            seen.add(m.id);
            picks.push(m);
          }
        }
      }

      setCrewPicks(picks);
    } catch {}
  };

  const fetchWatchProviders = async () => {
    try {
      const region = (await AsyncStorage.getItem('preferred_region')) || 'IN';
      const providers = await getWatchProviders(movieId, region);
      setWatchProviders(providers);
    } catch {}
    setProvidersFetched(true);
  };

  // ─── Watchlist Toggle ─────────────────────────────────

  const toggleWatchlist = async () => {
    try {
      if (isFav) {
        await unifiedRemoveFavorite(user?.id ?? null, movieId);
        setIsFav(false);
      } else {
        await unifiedAddFavorite(user?.id ?? null, movieId);
        setIsFav(true);
      }
    } catch (err) {
      console.error('Failed to toggle watchlist:', err);
    }
  };

  // ─── Navigate to related movie ────────────────────────

  const handleRelatedMoviePress = useCallback((relatedMovie: Movie) => {
    navigation.push('MovieDetail', { movieId: relatedMovie.id });
  }, [navigation]);

  if (loading || !movie) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const posterUri = getPosterUrl(movie.poster_path);
  const backdropUri = getBackdropUrl(movie.backdrop_path);
  const hypeScore = calculateHypeScore(movie);
  const releaseDate = new Date(movie.release_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const genres = movie.genres?.map((g) => g.name).join(' • ') || '';
  const cast = movie.credits?.cast?.slice(0, 10) || [];
  const videos = movie.videos?.results || [];
  const director = movie.credits?.crew?.find((c) => c.job === 'Director');
  const isUpcoming = new Date(movie.release_date) > new Date();

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Backdrop */}
      <View style={styles.backdropContainer}>
        {backdropUri ? (
          <Image source={{ uri: backdropUri }} style={styles.backdrop} />
        ) : (
          <View style={[styles.backdrop, { backgroundColor: Colors.surface }]} />
        )}
        <View style={styles.backdropOverlay} />

        {/* Poster + Title overlay */}
        <View style={styles.heroContent}>
          {posterUri && (
            <Image source={{ uri: posterUri }} style={styles.poster} />
          )}
          <View style={styles.heroInfo}>
            <Text style={styles.title}>{movie.title}</Text>
            {movie.tagline ? (
              <Text style={styles.tagline}>"{movie.tagline}"</Text>
            ) : null}
            <Text style={styles.genres}>{genres}</Text>
            {movie.runtime && (
              <Text style={styles.runtime}>{movie.runtime} min</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Watchlist Button */}
        <TouchableOpacity
          style={[styles.favoriteButton, isFav && styles.favoriteButtonActive]}
          onPress={toggleWatchlist}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={20}
            color={isFav ? '#FFFFFF' : Colors.accent}
          />
          <Text style={[styles.favoriteText, isFav && styles.favoriteTextActive]}>
            {isFav ? 'In Watchlist' : 'Add to Watchlist'}
          </Text>
        </TouchableOpacity>

        {/* Release Date + Countdown */}
        <View style={styles.section}>
          <Text style={styles.releaseDate}>{releaseDate}</Text>
          <CountdownTimer releaseDate={movie.release_date} />
        </View>

        {/* Hype Score */}
        <View style={styles.section}>
          <HypeScoreBadge score={hypeScore} size="large" />
        </View>

        {/* Trailer */}
        {videos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trailer</Text>
            <TrailerPlayer videoKey={videos[0].key} title={videos[0].name} />
          </View>
        )}

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overview}>{movie.overview || 'No description available.'}</Text>
        </View>

        {/* Director */}
        {director && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Director</Text>
            <Text style={styles.directorName}>{director.name}</Text>
          </View>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cast.map((person) => {
                const profileUri = getProfileUrl(person.profile_path);
                return (
                  <View key={person.id} style={styles.castCard}>
                    {profileUri ? (
                      <Image source={{ uri: profileUri }} style={styles.castImage} />
                    ) : (
                      <View style={[styles.castImage, styles.castPlaceholder]}>
                        <Ionicons name="person" size={24} color={Colors.textMuted} />
                      </View>
                    )}
                    <Text style={styles.castName} numberOfLines={1}>{person.name}</Text>
                    <Text style={styles.castCharacter} numberOfLines={1}>{person.character}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Where to Watch */}
        {providersFetched && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where to Watch</Text>
            {watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy) ? (
              <>
                {watchProviders.flatrate && watchProviders.flatrate.length > 0 && (
                  <View style={styles.providerGroup}>
                    <Text style={styles.providerLabel}>Stream</Text>
                    <View style={styles.providerRow}>
                      {watchProviders.flatrate.map((p) => (
                        <ProviderBadge key={p.provider_id} name={p.provider_name} logoPath={p.logo_path} />
                      ))}
                    </View>
                  </View>
                )}
                {watchProviders.rent && watchProviders.rent.length > 0 && (
                  <View style={styles.providerGroup}>
                    <Text style={styles.providerLabel}>Rent</Text>
                    <View style={styles.providerRow}>
                      {watchProviders.rent.map((p) => (
                        <ProviderBadge key={p.provider_id} name={p.provider_name} logoPath={p.logo_path} />
                      ))}
                    </View>
                  </View>
                )}
                {watchProviders.buy && watchProviders.buy.length > 0 && (
                  <View style={styles.providerGroup}>
                    <Text style={styles.providerLabel}>Buy</Text>
                    <View style={styles.providerRow}>
                      {watchProviders.buy.map((p) => (
                        <ProviderBadge key={p.provider_id} name={p.provider_name} logoPath={p.logo_path} />
                      ))}
                    </View>
                  </View>
                )}
                {watchProviders.link && (
                  <TouchableOpacity onPress={() => Linking.openURL(watchProviders.link!)} activeOpacity={0.7}>
                    <Text style={styles.providerLink}>View all options on TMDB {'\u2192'}</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={styles.providerUnavailable}>
                This movie is not available for streaming, rent, or purchase in your region.
              </Text>
            )}
          </View>
        )}

        {/* You Might Like */}
        {crewPicks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>You Might Like</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {crewPicks.map((item) => (
                <RelatedMovieCard key={item.id} movie={item} onPress={handleRelatedMoviePress} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            <DetailItem label="Status" value={movie.status} />
            <DetailItem label="Language" value={movie.original_language?.toUpperCase()} />
            {movie.budget > 0 && (
              <DetailItem label="Budget" value={`$${(movie.budget / 1_000_000).toFixed(0)}M`} />
            )}
            {movie.revenue > 0 && (
              <DetailItem label="Revenue" value={`$${(movie.revenue / 1_000_000).toFixed(0)}M`} />
            )}
            <DetailItem label="Rating" value={`${movie.vote_average.toFixed(1)} / 10`} />
            <DetailItem label="Votes" value={movie.vote_count.toLocaleString()} />
          </View>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </View>
    </ScrollView>
  );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const ProviderBadge: React.FC<{ name: string; logoPath: string }> = ({ name, logoPath }) => {
  const logo = getLogoUrl(logoPath);
  return (
    <View style={styles.providerBadge}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.providerLogo} />
      ) : (
        <View style={[styles.providerLogo, { backgroundColor: Colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="tv-outline" size={16} color={Colors.textMuted} />
        </View>
      )}
      <Text style={styles.providerName} numberOfLines={1}>{name}</Text>
    </View>
  );
};

const RelatedMovieCard: React.FC<{ movie: Movie; onPress: (m: Movie) => void }> = ({ movie, onPress }) => {
  const poster = getPosterUrl(movie.poster_path);
  return (
    <TouchableOpacity style={styles.relatedCard} onPress={() => onPress(movie)} activeOpacity={0.8}>
      {poster ? (
        <Image source={{ uri: poster }} style={styles.relatedPoster} />
      ) : (
        <View style={[styles.relatedPoster, styles.relatedPosterPlaceholder]}>
          <Ionicons name="film-outline" size={24} color={Colors.textMuted} />
        </View>
      )}
      <Text style={styles.relatedTitle} numberOfLines={2}>{movie.title}</Text>
      {movie.release_date ? (
        <Text style={styles.relatedYear}>
          {new Date(movie.release_date).getFullYear()}
        </Text>
      ) : null}
    </TouchableOpacity>
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
  backdropContainer: {
    position: 'relative',
    height: 360,
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  heroContent: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  poster: {
    width: 110,
    height: 165,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroInfo: {
    flex: 1,
    paddingBottom: Spacing.xs,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: Fonts.extraBold,
    marginBottom: 4,
  },
  tagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  genres: {
    color: Colors.accentLight,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  runtime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  favoriteText: {
    color: Colors.accent,
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginLeft: Spacing.sm,
  },
  favoriteTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.sm,
  },
  releaseDate: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  overview: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },
  directorName: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  castCard: {
    width: 80,
    marginRight: Spacing.md,
    alignItems: 'center',
  },
  castImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 6,
  },
  castPlaceholder: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  castName: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  castCharacter: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: Spacing.md,
  },
  detailLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  detailValue: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },
  // Related Movie Cards
  relatedCard: {
    width: 110,
    marginRight: Spacing.md,
  },
  relatedPoster: {
    width: 110,
    height: 165,
    borderRadius: BorderRadius.md,
    marginBottom: 6,
  },
  relatedPosterPlaceholder: {
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedTitle: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.textPrimary,
  },
  relatedYear: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  // Where to Watch
  providerGroup: {
    marginBottom: Spacing.sm,
  },
  providerLabel: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  providerBadge: {
    alignItems: 'center',
    width: 64,
  },
  providerLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginBottom: 4,
  },
  providerName: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  providerLink: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.accent,
    marginTop: Spacing.sm,
  },
  providerUnavailable: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});

export default MovieDetailScreen;
