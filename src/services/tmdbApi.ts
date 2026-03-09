import axios from 'axios';
import { Movie, MovieDetails, TMDBResponse, Genre, WatchProviderResult } from '../types/movie';

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const api = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: 'en-US',
  },
});

// Image URL helpers
export const getImageUrl = (path: string | null, size: string = 'w500'): string | null => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

export const getPosterUrl = (path: string | null): string | null => getImageUrl(path, 'w500');
export const getBackdropUrl = (path: string | null): string | null => getImageUrl(path, 'w780');
export const getProfileUrl = (path: string | null): string | null => getImageUrl(path, 'w185');
export const getLogoUrl = (path: string | null): string | null => getImageUrl(path, 'w92');

// Fetch upcoming movies
export const getUpcomingMovies = async (page: number = 1): Promise<TMDBResponse<Movie>> => {
  const response = await api.get<TMDBResponse<Movie>>('/movie/upcoming', {
    params: { page },
  });
  return response.data;
};

// Fetch popular movies (for hype/trending)
export const getPopularMovies = async (page: number = 1): Promise<TMDBResponse<Movie>> => {
  const response = await api.get<TMDBResponse<Movie>>('/movie/popular', {
    params: { page },
  });
  return response.data;
};

// Fetch movie details with credits and videos
export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
  const response = await api.get<MovieDetails>(`/movie/${movieId}`, {
    params: {
      append_to_response: 'credits,videos',
    },
  });
  return response.data;
};

// Search movies
export const searchMovies = async (query: string, page: number = 1): Promise<TMDBResponse<Movie>> => {
  const response = await api.get<TMDBResponse<Movie>>('/search/movie', {
    params: { query, page },
  });
  return response.data;
};

// Fetch genre list
export const getGenres = async (): Promise<Genre[]> => {
  const response = await api.get<{ genres: Genre[] }>('/genre/movie/list');
  return response.data.genres;
};

// Discover movies with filters
export const discoverMovies = async (params: {
  page?: number;
  with_genres?: string;
  primary_release_year?: number;
  with_original_language?: string;
  sort_by?: string;
}): Promise<TMDBResponse<Movie>> => {
  const response = await api.get<TMDBResponse<Movie>>('/discover/movie', {
    params: {
      sort_by: 'popularity.desc',
      'primary_release_date.gte': new Date().toISOString().split('T')[0],
      ...params,
    },
  });
  return response.data;
};

// Calculate hype score (0–100) from TMDB popularity + vote data
export const calculateHypeScore = (movie: Movie): number => {
  const popularityScore = Math.min(movie.popularity / 100, 1) * 60;
  const voteScore = (movie.vote_average / 10) * 30;
  const voteCountBonus = Math.min(movie.vote_count / 1000, 1) * 10;
  return Math.round(Math.min(popularityScore + voteScore + voteCountBonus, 100));
};

// Fetch watch providers for a movie in a specific region
export const getWatchProviders = async (
  movieId: number,
  region: string = 'IN',
): Promise<WatchProviderResult | null> => {
  const response = await api.get(`/movie/${movieId}/watch/providers`);
  const results = response.data?.results;
  return results?.[region] ?? null;
};

// Fetch movie credits for a person (actor/director filmography)
export const getPersonMovieCredits = async (
  personId: number,
): Promise<{ cast: Movie[]; crew: Movie[] }> => {
  const response = await api.get(`/person/${personId}/movie_credits`);
  return response.data;
};
