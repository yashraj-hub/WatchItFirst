import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tmdbService } from './services/tmdb';

const targetGenreIds = [28, 12, 35, 80, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];
const bollywoodGenreIds = [28, 12, 35, 80, 18, 10751, 14, 27, 878, 53, 10749];

// ── Main categories (home page) ──────────────────────────────────────────────
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const masterData = await tmdbService.getFullSyncData(targetGenreIds);
      const filteredGenreSections = masterData.genreSections.map(section => {
        let movies = section.movies;
        if (section.id !== 16 && section.id !== 99) {
          movies = movies.filter(m => !m.genre_ids.includes(16));
        }
        return { ...section, movies };
      });
      return {
        genreSections: filteredGenreSections,
        trending: masterData.trending,
        topRated: masterData.topRated,
        nowPlaying: masterData.nowPlaying,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
  {
    condition: (_, { getState }) => getState().categories.status === 'idle',
  }
);

// ── Page-specific genres for navbar dropdown ─────────────────────────────────
export const fetchPageGenres = createAsyncThunk(
  'pageGenres/fetch',
  async (pageType, { rejectWithValue }) => {
    try {
      if (pageType === 'bollywood') {
        const data = await tmdbService.getBollywoodSyncData(bollywoodGenreIds);
        return { pageType, genres: data.genreSections.filter(s => !s.isStudio) };
      }
      if (pageType === 'animation') {
        const data = await tmdbService.getAnimationSyncData();
        return { pageType, genres: data.genreSections.filter(s => !s.isStudio) };
      }
      return { pageType: 'default', genres: [] }; // default uses genreSections from categories
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
  {
    // Only fetch if we don't already have this pageType cached
    condition: (pageType, { getState }) => {
      const { pageGenres } = getState();
      return !pageGenres.cache[pageType];
    },
  }
);

// ── Slices ────────────────────────────────────────────────────────────────────
const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    genreSections: [],
    trending: [],
    topRated: [],
    nowPlaying: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.genreSections = action.payload.genreSections;
        state.trending = action.payload.trending;
        state.topRated = action.payload.topRated;
        state.nowPlaying = action.payload.nowPlaying;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

const pageGenresSlice = createSlice({
  name: 'pageGenres',
  initialState: {
    cache: {},   // { bollywood: [...], animation: [...] }
    loading: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPageGenres.pending, (state, action) => {
        state.loading[action.meta.arg] = true;
      })
      .addCase(fetchPageGenres.fulfilled, (state, action) => {
        const { pageType, genres } = action.payload;
        state.cache[pageType] = genres;
        state.loading[action.meta.arg] = false;
      })
      .addCase(fetchPageGenres.rejected, (state, action) => {
        state.loading[action.meta.arg] = false;
      });
  },
});

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectGenreSections = (state) => state.categories.genreSections;
export const selectTrending = (state) => state.categories.trending;
export const selectTopRated = (state) => state.categories.topRated;
export const selectNowPlaying = (state) => state.categories.nowPlaying;
export const selectCategoriesStatus = (state) => state.categories.status;
export const selectPageGenres = (pageType) => (state) => state.pageGenres.cache[pageType];

const store = configureStore({
  reducer: {
    categories: categoriesSlice.reducer,
    pageGenres: pageGenresSlice.reducer,
  },
});

export default store;
