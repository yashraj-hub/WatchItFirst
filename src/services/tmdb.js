import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const TMDB_CONFIG = {
  original: `${IMAGE_BASE_URL}/original`,
  w500: `${IMAGE_BASE_URL}/w500`,
};

const CACHE_KEY = 'tmdb_cache_v3';
const CACHE_DURATION = 6 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 40;
const CACHE_MAX_BYTES = 2.5 * 1024 * 1024;
const CACHE_ENTRY_SOFT_LIMIT = 200 * 1024;
const NON_PERSISTED_KEYS = new Set([
  'bollywood_sync_data',
  'animation_sync_data',
  'master_sync_data',
]);

const memoryCache = {
  data: {},
  timestamp: Date.now(),
  order: [],
};

// Memoized localStorage parse — only re-parses when the raw string changes
const _lsParseCache = { raw: null, parsed: null };

const requestPromises = new Map();
const syncPromises = new Map();

function isStorageAvailable() {
  try {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function readCacheEnvelope() {
  if (!isStorageAvailable()) return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    // Only JSON.parse if the string actually changed — avoids parsing 2.5MB on every API call
    if (_lsParseCache.raw === raw) return _lsParseCache.parsed;
    _lsParseCache.raw = raw;
    _lsParseCache.parsed = JSON.parse(raw);
    return _lsParseCache.parsed;
  } catch {
    return null;
  }
}

function writeCacheEnvelope(cache) {
  if (!isStorageAvailable()) return false;
  try {
    const serialized = JSON.stringify(cache);
    localStorage.setItem(CACHE_KEY, serialized);
    // Update memoized parse cache so next read doesn't re-parse
    _lsParseCache.raw = serialized;
    _lsParseCache.parsed = cache;
    return true;
  } catch {
    return false;
  }
}

function getCacheSize(cache) {
  try {
    return JSON.stringify(cache).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function normalizeCacheEnvelope(envelope) {
  const normalized = { data: {}, timestamp: Date.now(), order: [] };
  if (!envelope || typeof envelope !== 'object') return normalized;
  if (envelope.data && typeof envelope.data === 'object') normalized.data = { ...envelope.data };
  if (typeof envelope.timestamp === 'number') normalized.timestamp = envelope.timestamp;
  if (Array.isArray(envelope.order)) {
    normalized.order = envelope.order.filter((key) => key in normalized.data);
  } else {
    normalized.order = Object.keys(normalized.data);
  }
  return normalized;
}

function pruneCacheEnvelope(cache) {
  const pruned = normalizeCacheEnvelope(cache);
  while (pruned.order.length > CACHE_MAX_ENTRIES || getCacheSize(pruned) > CACHE_MAX_BYTES) {
    const oldestKey = pruned.order.shift();
    if (!oldestKey) break;
    // Use delete on object property (correct — this is a plain object, not an array)
    delete pruned.data[oldestKey];
  }
  return pruned;
}

function cacheKeyFor(endpoint, params = {}) {
  return `${endpoint}_${JSON.stringify(params)}`;
}

function shouldPersistEntry(endpoint, data) {
  return !NON_PERSISTED_KEYS.has(endpoint) && getCacheSize(data) <= CACHE_ENTRY_SOFT_LIMIT;
}

function getCache() {
  const envelope = normalizeCacheEnvelope(readCacheEnvelope());
  if (Date.now() - envelope.timestamp > CACHE_DURATION) {
    if (isStorageAvailable()) {
      try {
        localStorage.removeItem(CACHE_KEY);
        _lsParseCache.raw = null;
        _lsParseCache.parsed = null;
      } catch { /* ignore */ }
    }
    memoryCache.data = {};
    memoryCache.timestamp = Date.now();
    memoryCache.order = [];
    return {};
  }

  if (Object.keys(envelope.data).length > 0) {
    memoryCache.data = { ...envelope.data, ...memoryCache.data };
    memoryCache.timestamp = Math.max(memoryCache.timestamp, envelope.timestamp);
    memoryCache.order = [...new Set([...envelope.order, ...memoryCache.order])];
  }

  return memoryCache.data;
}

function setCache(endpoint, params, data) {
  const cacheKey = cacheKeyFor(endpoint, params);
  const shouldPersist = shouldPersistEntry(endpoint, data);

  memoryCache.data[cacheKey] = data;
  memoryCache.timestamp = Date.now();
  memoryCache.order = memoryCache.order.filter((key) => key !== cacheKey);
  memoryCache.order.push(cacheKey);

  if (!shouldPersist) return;

  const envelope = normalizeCacheEnvelope(readCacheEnvelope()) ?? {
    data: {},
    timestamp: Date.now(),
    order: [],
  };

  envelope.data[cacheKey] = data;
  envelope.timestamp = Date.now();
  envelope.order = envelope.order.filter((key) => key !== cacheKey);
  envelope.order.push(cacheKey);

  const pruned = pruneCacheEnvelope(envelope);
  writeCacheEnvelope(pruned);
}

async function fetchFromTMDB(endpoint, params = {}, signal = null) {
  const cache = getCache();
  const cacheKey = cacheKeyFor(endpoint, params);

  if (cache[cacheKey]) return cache[cacheKey];

  if (requestPromises.has(cacheKey)) return requestPromises.get(cacheKey);

  const requestPromise = (async () => {
    const queryParams = new URLSearchParams({ api_key: API_KEY, ...params });
    const fetchOptions = signal ? { signal } : {};
    const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`, fetchOptions);
    if (!response.ok) throw new Error(`TMDB API Error: ${response.statusText}`);
    const data = await response.json();
    setCache(endpoint, params, data);
    return data;
  })();

  requestPromises.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    requestPromises.delete(cacheKey);
  }
}

async function runSingletonSync(syncKey, loader) {
  const cache = getCache();
  if (cache[syncKey]) return cache[syncKey];

  if (syncPromises.has(syncKey)) return syncPromises.get(syncKey);

  const syncPromise = (async () => {
    const data = await loader();
    setCache(syncKey, {}, data);
    return data;
  })();

  syncPromises.set(syncKey, syncPromise);

  try {
    return await syncPromise;
  } finally {
    syncPromises.delete(syncKey);
  }
}

// ── Firestore shared cache (6h TTL, shared across all users) ──────────────────
const FS_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

async function getFromFirestoreCache(key) {
  try {
    const snap = await getDoc(doc(db, 'cache', key));
    if (!snap.exists()) return null;
    const { data, cachedAt } = snap.data();
    if (Date.now() - cachedAt > FS_CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

async function saveToFirestoreCache(key, data) {
  try {
    await setDoc(doc(db, 'cache', key), { data, cachedAt: Date.now() });
  } catch {
    // Silently fail — cache is best-effort
  }
}

async function runSingletonSyncWithFirestore(syncKey, loader) {
  // 1. Check memory/localStorage cache first (fastest)
  const cache = getCache();
  if (cache[syncKey]) return cache[syncKey];

  // 2. Deduplicate in-flight requests
  if (syncPromises.has(syncKey)) return syncPromises.get(syncKey);

  const syncPromise = (async () => {
    // 3. Check Firestore shared cache
    const fsData = await getFromFirestoreCache(syncKey);
    if (fsData) {
      setCache(syncKey, {}, fsData); // warm local cache
      return fsData;
    }

    // 4. Fetch from TMDB (only if no cache anywhere)
    const data = await loader();

    // 5. Save to both caches in parallel
    setCache(syncKey, {}, data);
    saveToFirestoreCache(syncKey, data); // fire and forget

    return data;
  })();

  syncPromises.set(syncKey, syncPromise);

  try {
    return await syncPromise;
  } finally {
    syncPromises.delete(syncKey);
  }
}

export const tmdbService = {
  getTrending: (type = 'movie', timeWindow = 'day') =>
    fetchFromTMDB(`/trending/${type}/${timeWindow}`),

  getPopular: (type = 'movie') =>
    fetchFromTMDB(`/${type}/popular`),

  getTopRated: (type = 'movie') =>
    fetchFromTMDB(`/${type}/top_rated`),

  getNowPlaying: () =>
    fetchFromTMDB('/movie/now_playing'),

  getMovieDetails: (id, signal = null) =>
    fetchFromTMDB(`/movie/${id}`, {
      append_to_response: 'external_ids,videos,recommendations,credits,images',
      include_image_language: 'en,null',
    }, signal),

  getTVDetails: (id) =>
    fetchFromTMDB(`/tv/${id}`, {
      append_to_response: 'external_ids,videos,recommendations,credits,images',
      include_image_language: 'en,null',
    }),

  search: (query, type = 'multi') =>
    fetchFromTMDB(`/search/${type}`, { query }),

  searchCollection: (query) =>
    fetchFromTMDB('/search/collection', { query }),

  getCollectionDetails: (id) =>
    fetchFromTMDB(`/collection/${id}`, { append_to_response: 'images', include_image_language: 'en,null' }),

  getMovieCollectionId: (id) =>
    fetchFromTMDB(`/movie/${id}`, { append_to_response: '' }),

  searchEnriched: async (query) => {
    const [searchData, collectionData] = await Promise.all([
      fetchFromTMDB('/search/multi', { query }),
      fetchFromTMDB('/search/collection', { query }),
    ]);

    const items = searchData.results.filter(
      item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv')
    );

    // Fetch full collection details for each matched TMDB collection
    const collectionDetails = await Promise.all(
      collectionData.results.slice(0, 5).map(c =>
        fetchFromTMDB(`/collection/${c.id}`).catch(() => null)
      )
    );

    // For movie results that belong to a collection, fetch their collection id
    const movieIds = items
      .filter(i => i.media_type === 'movie' && !collectionDetails.some(
        c => c?.parts?.some(p => p.id === i.id)
      ))
      .map(i => i.id);

    const movieDetails = await Promise.all(
      movieIds.slice(0, 12).map(id =>
        fetchFromTMDB(`/movie/${id}`).catch(() => null)
      )
    );

    // Build a map: collectionId -> { id, name, parts[] }
    const collectionMap = {};

    // From TMDB collection search
    collectionDetails.filter(Boolean).forEach(col => {
      if (col.parts?.length >= 2) {
        collectionMap[col.id] = {
          id: col.id,
          name: col.name,
          poster_path: col.poster_path,
          parts: col.parts
            .filter(p => p.poster_path)
            .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || '')),
          source: 'tmdb_collection',
        };
      }
    });

    // From belongs_to_collection on individual movie results
    movieDetails.filter(Boolean).forEach(movie => {
      const col = movie.belongs_to_collection;
      if (!col || collectionMap[col.id]) return;
      collectionMap[col.id] = {
        id: col.id,
        name: col.name,
        poster_path: col.poster_path,
        parts: null, // will be enriched below
        source: 'belongs_to',
        seedMovieId: movie.id,
      };
    });

    // Fetch full parts for belongs_to collections we don't have yet
    await Promise.all(
      Object.values(collectionMap)
        .filter(c => c.parts === null)
        .map(async c => {
          const full = await fetchFromTMDB(`/collection/${c.id}`).catch(() => null);
          if (full?.parts?.length >= 2) {
            c.parts = full.parts
              .filter(p => p.poster_path)
              .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
            c.name = full.name;
          } else {
            delete collectionMap[c.id];
          }
        })
    );

    // IDs already in a real collection
    const groupedIds = new Set(
      Object.values(collectionMap).flatMap(c => (c.parts || []).map(p => p.id))
    );

    // Standalone = items not covered by any real collection
    const standalone = items.filter(i => !groupedIds.has(i.id));

    return {
      items,
      collections: Object.values(collectionMap),
      standalone,
    };
  },

  getMoviesByGenre: (genreId, page = 1) =>
    fetchFromTMDB('/discover/movie', { with_genres: genreId, page }),

  getMoviesByCompany: (companyId, page = 1, params = {}) =>
    fetchFromTMDB('/discover/movie', {
      with_companies: companyId,
      page,
      sort_by: 'popularity.desc',
      ...params,
    }),

  getCompanyDetails: (companyId) =>
    fetchFromTMDB(`/company/${companyId}`),

  getGenres: (type = 'movie') =>
    fetchFromTMDB(`/genre/${type}/list`),

  getMovies: (page = 1) =>
    fetchFromTMDB('/discover/movie', { page, sort_by: 'popularity.desc' }),

  getHindiMovies: (page = 1, params = {}) =>
    fetchFromTMDB('/discover/movie', {
      page,
      with_original_language: 'hi',
      sort_by: 'popularity.desc',
      region: 'IN',
      ...params,
    }),

  getBollywoodByGenre: (genreId, page = 1) =>
    tmdbService.getHindiMovies(page, { with_genres: genreId }),

  getBollywoodByReleaseYears: (startYear, endYear, page = 1, params = {}) =>
    fetchFromTMDB('/discover/movie', {
      page,
      with_original_language: 'hi',
      region: 'IN',
      sort_by: 'popularity.desc',
      'primary_release_date.gte': `${startYear}-01-01`,
      'primary_release_date.lte': `${endYear}-12-31`,
      ...params,
    }),

  getAnimationByReleaseYears: (startYear, endYear, page = 1, params = {}) =>
    fetchFromTMDB('/discover/movie', {
      page,
      with_genres: 16,
      sort_by: 'popularity.desc',
      'primary_release_date.gte': `${startYear}-01-01`,
      'primary_release_date.lte': `${endYear}-12-31`,
      ...params,
    }),

  getPersonMovieCredits: (personId) =>
    fetchFromTMDB(`/person/${personId}/movie_credits`),

  getBollywoodSyncData: async (genreIds) => {
    return runSingletonSyncWithFirestore('bollywood_sync_data', async () => {
      const today = new Date().toISOString().split('T')[0];
      const currentYear = new Date().getFullYear();

      const bollywoodStudios = [
        { id: 1569, name: 'Yash Raj Films' },
        { id: 19146, name: 'Dharma Productions' },
        { id: 2343, name: 'Red Chillies Entertainment' },
        { id: 3522, name: 'T-Series' },
        { id: 86699, name: 'Maddock Films' },
        { id: 6808, name: 'Viacom18 Studios' },
      ];

      const timePeriods = [
        { id: 'bollywood-2020s', name: '2020s Bollywood', startYear: 2020, endYear: currentYear, isEra: true },
        { id: 'bollywood-2010s', name: '2010s Bollywood', startYear: 2010, endYear: 2019, isEra: true },
        { id: 'bollywood-2000s', name: '2000s Bollywood', startYear: 2000, endYear: 2009, isEra: true },
        { id: 'bollywood-90s', name: '90s Bollywood', startYear: 1990, endYear: 1999, isEra: true },
        { id: 'bollywood-80s', name: '80s Bollywood', startYear: 1980, endYear: 1989, isEra: true },
        { id: 'bollywood-classics', name: 'Classic Bollywood', startYear: 1950, endYear: 1979, isEra: true },
      ];

      const directors = [{ id: 80387, name: 'Priyadarshan', isDirector: true }];

      const [trending, latest, genresResponse] = await Promise.all([
        tmdbService.getHindiMovies(1),
        tmdbService.getHindiMovies(1, {
          sort_by: 'primary_release_date.desc',
          'primary_release_date.lte': today,
          'vote_count.gte': 5,
        }),
        tmdbService.getGenres(),
      ]);

      const studioPromises = bollywoodStudios.map(async (studio) => {
        try {
          const [data, companyInfo] = await Promise.all([
            tmdbService.getHindiMovies(1, { with_companies: studio.id }),
            tmdbService.getCompanyDetails(studio.id).catch(() => null),
          ]);
          if (!data.results || data.results.length === 0) return null;
          return {
            id: studio.id, name: studio.name, movies: data.results,
            total: data.total_results, logo: companyInfo?.logo_path || null, isStudio: true,
          };
        } catch { return null; }
      });

      const genreMoviesPromises = genreIds.map(async (id) => {
        const pagesData = await Promise.all([1, 2].map(page => tmdbService.getBollywoodByGenre(id, page)));
        const allMovies = pagesData.flatMap(p => p.results);
        const genreName = genresResponse.genres.find(g => g.id === id)?.name;
        return { id, name: genreName, movies: allMovies, total: pagesData[0].total_results };
      });

      const eraPromises = timePeriods.map(async (era) => {
        try {
          const [p1, p2] = await Promise.all([
            tmdbService.getBollywoodByReleaseYears(era.startYear, era.endYear, 1),
            tmdbService.getBollywoodByReleaseYears(era.startYear, era.endYear, 2),
          ]);
          return {
            id: era.id, name: era.name, movies: [...p1.results, ...p2.results],
            total: p1.total_results, isEra: true, startYear: era.startYear, endYear: era.endYear,
          };
        } catch { return null; }
      });

      const directorPromises = directors.map(async (director) => {
        try {
          const credits = await tmdbService.getPersonMovieCredits(director.id);
          const directedMovies = (credits?.crew || [])
            .filter(m => m.job === 'Director' && m.release_date)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
          const seen = new Set();
          const unique = directedMovies.filter(m => seen.has(m.id) ? false : seen.add(m.id));
          return { id: director.id, name: director.name, movies: unique, total: unique.length, isDirector: true };
        } catch { return null; }
      });

      const [studioSectionsRaw, genreSections, eraSections, directorSections] = await Promise.all([
        Promise.all(studioPromises),
        Promise.all(genreMoviesPromises),
        Promise.all(eraPromises),
        Promise.all(directorPromises),
      ]);

      return {
        trending: trending.results.slice(0, 10),
        nowPlaying: latest.results.filter(m => m.backdrop_path).slice(0, 10),
        genreSections: [
          ...studioSectionsRaw.filter(Boolean),
          ...eraSections.filter(Boolean),
          ...directorSections.filter(Boolean),
          ...genreSections,
        ].filter(s => s.movies.length > 0),
      };
    });
  },

  getAnimationSyncData: async () => {
    return runSingletonSyncWithFirestore('animation_sync_data', async () => {
      const today = new Date().toISOString().split('T')[0];

      const studios = [
        { id: 3, name: 'Pixar' },
        { id: 6125, name: 'Disney' },
        { id: 33, name: 'Studio Ghibli' },
        { id: 521, name: 'DreamWorks' },
        { id: 6704, name: 'Illumination' },
        { id: 9993, name: 'Nickelodeon' },
      ];

      const eras = [
        { name: 'Modern Masterpieces', start: '2020', end: today },
        { name: 'The 2010s Era', start: '2010', end: '2019' },
        { name: 'The 2000s Era', start: '2000', end: '2009' },
        { name: '90s Classics', start: '1990', end: '1999' },
        { name: 'Vintage Cartoons', start: '1900', end: '1989' },
      ];

      const [trending] = await Promise.all([
        fetchFromTMDB('/discover/movie', { with_genres: 16, sort_by: 'popularity.desc' }),
      ]);

      const studioPromises = studios.map(async (studio) => {
        try {
          const [data, companyInfo] = await Promise.all([
            fetchFromTMDB('/discover/movie', { with_genres: 16, with_companies: studio.id, sort_by: 'popularity.desc' }),
            tmdbService.getCompanyDetails(studio.id).catch(() => null),
          ]);
          return {
            id: studio.id, name: studio.name, movies: data.results,
            total: data.total_results, logo: companyInfo?.logo_path || null, isStudio: true,
          };
        } catch { return null; }
      });

      const eraPromises = eras.map(async (era) => {
        const data = await fetchFromTMDB('/discover/movie', {
          with_genres: 16,
          'primary_release_date.gte': `${era.start}-01-01`,
          'primary_release_date.lte': era.end.includes('-') ? era.end : `${era.end}-12-31`,
          sort_by: 'popularity.desc',
        });
        return {
          id: era.name,
          name: era.name,
          movies: data.results,
          total: data.total_results,
          isEra: true,
          startYear: era.start,
          endYear: era.end.includes('-') ? era.end.split('-')[0] : era.end,
        };
      });

      const [studioSectionsRaw, eraSections] = await Promise.all([
        Promise.all(studioPromises),
        Promise.all(eraPromises),
      ]);

      return {
        trending: trending.results.slice(0, 10),
        nowPlaying: trending.results.slice(0, 10),
        genreSections: [...studioSectionsRaw.filter(Boolean), ...eraSections].filter(s => s.movies.length > 0),
      };
    });
  },

  findByImdbId: (imdbId) =>
    fetchFromTMDB(`/find/${imdbId}`, { external_source: 'imdb_id' }),

  getExternalIds: (id, type = 'movie') =>
    fetchFromTMDB(`/${type}/${id}/external_ids`),

  getMovieImages: (id) =>
    fetchFromTMDB(`/movie/${id}/images`, { include_image_language: 'en,null,hi' }),

  // ── Recommendation engine methods ─────────────────────────────────────────

  // Similar movies to a given movie id
  getSimilarMovies: (id) =>
    fetchFromTMDB(`/movie/${id}/similar`),

  // TMDB's own recommendation for a movie
  getMovieRecommendations: (id) =>
    fetchFromTMDB(`/movie/${id}/recommendations`),

  // Top-rated by language
  getTopRatedByLanguage: (lang, page = 1) =>
    fetchFromTMDB('/discover/movie', {
      sort_by: 'vote_average.desc',
      with_original_language: lang,
      'vote_count.gte': 200,
      page,
    }),

  // Hidden gems — high rated, low popularity
  getHiddenGems: (lang = null, page = 1) => {
    const params = {
      sort_by: 'vote_average.desc',
      'vote_count.gte': 100,
      'vote_average.gte': 7.5,
      'popularity.lte': 30,
      page,
    };
    if (lang) params.with_original_language = lang;
    return fetchFromTMDB('/discover/movie', params);
  },

  // Award winners — high vote average, lots of votes
  getAwardWinners: (lang = null) => {
    const params = {
      sort_by: 'vote_average.desc',
      'vote_count.gte': 1000,
      'vote_average.gte': 8.0,
    };
    if (lang) params.with_original_language = lang;
    return fetchFromTMDB('/discover/movie', params);
  },

  // Decade classics
  getDecadeMovies: (startYear, endYear, lang = null, page = 1) => {
    const params = {
      sort_by: 'vote_average.desc',
      'vote_count.gte': 200,
      'primary_release_date.gte': `${startYear}-01-01`,
      'primary_release_date.lte': `${endYear}-12-31`,
      page,
    };
    if (lang) params.with_original_language = lang;
    return fetchFromTMDB('/discover/movie', params);
  },

  // Must-watch by genre + language
  getMustWatchByGenre: (genreId, lang = null, page = 1) => {
    const params = {
      with_genres: genreId,
      sort_by: 'vote_average.desc',
      'vote_count.gte': 150,
      page,
    };
    if (lang) params.with_original_language = lang;
    return fetchFromTMDB('/discover/movie', params);
  },

  // Upcoming / releasing soon
  getUpcoming: (lang = null) => {
    const today = new Date().toISOString().split('T')[0];
    const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const params = {
      sort_by: 'popularity.desc',
      'primary_release_date.gte': today,
      'primary_release_date.lte': future,
    };
    if (lang) params.with_original_language = lang;
    return fetchFromTMDB('/discover/movie', params);
  },

  getCollectionDetails: (id) =>
    fetchFromTMDB(`/collection/${id}`, { include_image_language: 'en,null' }),

  getCollectionImages: (id) =>
    fetchFromTMDB(`/collection/${id}/images`),

  getMovieImages: (id) =>
    fetchFromTMDB(`/movie/${id}/images`, { include_image_language: 'en,null' }),

  getFullSyncData: async (genreIds) => {
    return runSingletonSyncWithFirestore('master_sync_data', async () => {
      const globalStudios = [
        { id: 174, name: 'Warner Bros.' },
        { id: 429, name: 'DC Studios' },
        { id: 33, name: 'Universal Pictures' },
        { id: 4, name: 'Paramount' },
        { id: 25, name: '20th Century Studios' },
        { id: 5, name: 'Columbia Pictures' },
        { id: 420, name: 'Marvel Studios' },
      ];

      const [trending, topRated, nowPlaying, genresResponse] = await Promise.all([
        tmdbService.getTrending(),
        tmdbService.getTopRated(),
        tmdbService.getNowPlaying(),
        tmdbService.getGenres(),
      ]);

      const studioPromises = globalStudios.map(async (studio) => {
        try {
          const [data, companyInfo] = await Promise.all([
            fetchFromTMDB('/discover/movie', { with_companies: studio.id, sort_by: 'popularity.desc' }),
            tmdbService.getCompanyDetails(studio.id).catch(() => null),
          ]);
          return {
            id: studio.id, name: studio.name, movies: data.results,
            total: data.total_results, logo: companyInfo?.logo_path || null, isStudio: true,
          };
        } catch { return null; }
      });

      const genreMoviesPromises = genreIds.map(async (id) => {
        const pagesData = await Promise.all([1, 2].map(page => tmdbService.getMoviesByGenre(id, page)));
        const allMovies = pagesData.flatMap(p => p.results);
        const genreName = genresResponse.genres.find(g => g.id === id)?.name;
        return { id, name: genreName, movies: allMovies, total: pagesData[0].total_results };
      });

      const [studioSectionsRaw, genreSections] = await Promise.all([
        Promise.all(studioPromises),
        Promise.all(genreMoviesPromises),
      ]);

      return {
        trending: trending.results,
        topRated: topRated.results,
        nowPlaying: nowPlaying.results,
        genreSections: [...studioSectionsRaw.filter(Boolean), ...genreSections],
      };
    });
  },
};
