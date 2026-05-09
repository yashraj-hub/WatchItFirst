import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdbService, TMDB_CONFIG } from '../../services/tmdb';
import MainLayout from '../../layouts/MainLayout';
import MovieCard from '../../components/MovieCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, Play, Star } from 'lucide-react';

// ── Watch history ─────────────────────────────────────────────────────────────
const HISTORY_KEY = 'wif_watch_history';
const getHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
};
export const addToHistory = (movie) => {
  try {
    const h = getHistory().filter(m => m.id !== movie.id);
    h.unshift({ id: movie.id, genre_ids: movie.genre_ids || [], title: movie.title || movie.name, ts: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 30)));
  } catch { /* ignore */ }
};

// ── Top genre from history ────────────────────────────────────────────────────
const getTopGenre = (fallback = 28) => {
  const ids = getHistory().flatMap(m => m.genre_ids || []);
  if (!ids.length) return fallback;
  return ids.sort((a, b) =>
    ids.filter(g => g === b).length - ids.filter(g => g === a).length
  )[0];
};

// ── Row ───────────────────────────────────────────────────────────────────────
const RecoRow = ({ title, movies, badge }) => {
  if (!movies?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mb-14"
    >
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-base md:text-2xl font-black uppercase tracking-tighter text-white">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-red-600/20 text-red-400 border border-red-600/30">
            {badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-gray-700 ml-auto flex-shrink-0" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
        {movies.slice(0, 14).map(m => <MovieCard key={m.id} movie={m} />)}
      </div>
    </motion.div>
  );
};

// ── Top 5 Picks section ──────────────────────────────────────────────────────
const Top5Picks = ({ movies }) => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const picks = movies?.slice(0, 5) || [];
  if (!picks.length) return null;
  const hero = picks[active];

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % picks.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [picks.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-14"
    >
      <div className="flex items-center gap-3 mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 flex items-center gap-2">
          <Sparkles className="w-3 h-3" /> Top Picks For You
        </p>
      </div>

      {/* Single card that cycles every 5s */}
      <div
        className="relative w-full h-[42vh] md:h-[58vh] rounded-2xl overflow-hidden cursor-pointer group"
        onClick={() => navigate(`/details/${hero.id}`)}
      >
        {/* Background crossfade */}
        <AnimatePresence mode="sync">
          <motion.img
            key={hero.id}
            src={`${TMDB_CONFIG.original}${hero.backdrop_path || hero.poster_path}`}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            alt={hero.title}
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />

        {/* Rank watermark */}
        <div className="absolute top-4 left-5 md:top-6 md:left-8 select-none pointer-events-none">
          <span className="text-7xl md:text-9xl font-black italic text-white/10 leading-none">
            {active + 1}
          </span>
        </div>

        {/* Progress dots */}
        <div className="absolute top-4 right-4 flex gap-1.5">
          {picks.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setActive(i); }}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === active ? 'w-6 bg-red-500' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={hero.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-0 left-0 p-5 md:p-8"
          >
            <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none mb-2">
              {hero.title || hero.name}
            </h2>
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center gap-1 text-yellow-400 text-xs font-black">
                <Star className="w-3 h-3 fill-yellow-400" />{hero.vote_average?.toFixed(1)}
              </span>
              <span className="text-gray-400 text-xs">{(hero.release_date || '').split('-')[0]}</span>
            </div>
            <p className="hidden md:block text-sm text-gray-300 max-w-lg line-clamp-2 mb-4">{hero.overview}</p>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/details/${hero.id}`); }}
              className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Watch Now
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ── Featured hero (kept as fallback) ─────────────────────────────────────────
const FeaturedCard = ({ movie }) => {
  const navigate = useNavigate();
  if (!movie) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full h-[38vh] md:h-[52vh] rounded-2xl overflow-hidden mb-12 cursor-pointer group"
      onClick={() => navigate(`/details/${movie.id}`)}
    >
      <img
        src={`${TMDB_CONFIG.original}${movie.backdrop_path || movie.poster_path}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        alt={movie.title}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 p-5 md:p-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-2 flex items-center gap-2">
          <Sparkles className="w-3 h-3" /> Top Pick For You
        </p>
        <h1 className="text-2xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none mb-2 md:mb-3">
          {movie.title || movie.name}
        </h1>
        <p className="hidden md:block text-sm text-gray-300 max-w-xl line-clamp-2 mb-5">{movie.overview}</p>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/details/${movie.id}`); }}
          className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Watch Now
        </button>
      </div>
    </motion.div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="space-y-10">
    <div className="w-full h-[42vh] md:h-[58vh] rounded-2xl bg-white/5 animate-pulse mb-14" />
    {[1, 2, 3].map(i => (
      <div key={i}>
        <div className="h-5 w-48 bg-white/5 rounded animate-pulse mb-5" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
          {Array.from({ length: 7 }).map((_, j) => (
            <div key={j} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ── Fetch logic per tab ───────────────────────────────────────────────────────
async function fetchEnglish() {
  const topGenre = getTopGenre(28);
  const [trending, awards, gems, d2010s, d2000s, forYou, upcoming, topRated] = await Promise.all([
    tmdbService.getTrending(),
    tmdbService.getAwardWinners(null),
    tmdbService.getHiddenGems(null),
    tmdbService.getDecadeMovies(2010, 2019, null),
    tmdbService.getDecadeMovies(2000, 2009, null),
    tmdbService.getMustWatchByGenre(topGenre, null),
    tmdbService.getUpcoming(null),
    tmdbService.getTopRatedByLanguage('en'),
  ]);
  return {
    featured: trending.results?.[0],
    topPicks: [...(awards.results || []), ...(trending.results || [])]
      .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i).slice(0, 5),
    rows: [
      { title: 'Trending Now', movies: trending.results },
      { title: 'Award Winners', badge: 'Critically Acclaimed', movies: awards.results },
      { title: 'Hidden Gems', badge: 'Underrated', movies: gems.results },
      { title: 'Best of 2010s', movies: d2010s.results },
      { title: 'Best of 2000s', movies: d2000s.results },
      { title: 'Based On Your Taste', badge: 'For You', movies: forYou.results },
      { title: 'Coming Soon', badge: 'Upcoming', movies: upcoming.results },
      { title: 'Top Rated English', movies: topRated.results },
    ],
  };
}

async function fetchBollywood() {
  const topGenre = getTopGenre(18);
  const [trending, awards, gems, d2010s, d2000s, forYou, upcoming, topRated] = await Promise.all([
    tmdbService.getHindiMovies(1),
    tmdbService.getAwardWinners('hi'),
    tmdbService.getHiddenGems('hi'),
    tmdbService.getDecadeMovies(2010, 2019, 'hi'),
    tmdbService.getDecadeMovies(2000, 2009, 'hi'),
    tmdbService.getMustWatchByGenre(topGenre, 'hi'),
    tmdbService.getUpcoming('hi'),
    tmdbService.getTopRatedByLanguage('hi'),
  ]);
  return {
    featured: trending.results?.[0],
    topPicks: [...(awards.results || []), ...(trending.results || [])]
      .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i).slice(0, 5),
    rows: [
      { title: 'Trending Bollywood', movies: trending.results },
      { title: 'Award Winners', badge: 'Critically Acclaimed', movies: awards.results },
      { title: 'Hidden Gems', badge: 'Underrated', movies: gems.results },
      { title: 'Best of 2010s', movies: d2010s.results },
      { title: 'Best of 2000s', movies: d2000s.results },
      { title: 'Based On Your Taste', badge: 'For You', movies: forYou.results },
      { title: 'Coming Soon', badge: 'Upcoming', movies: upcoming.results },
      { title: 'Top Rated Bollywood', movies: topRated.results },
    ],
  };
}

async function fetchAnimation() {
  const [popular, topRated, modern, d2010s, d2000s, d90s] = await Promise.all([
    tmdbService.getMoviesByGenre(16, 1),
    tmdbService.getMustWatchByGenre(16, null),
    tmdbService.getDecadeMovies(2020, new Date().getFullYear(), null),
    tmdbService.getDecadeMovies(2010, 2019, null),
    tmdbService.getDecadeMovies(2000, 2009, null),
    tmdbService.getDecadeMovies(1990, 1999, null),
  ]);
  const anim = r => (r.results || []).filter(m => m.genre_ids?.includes(16));
  return {
    featured: anim(popular)[0],
    topPicks: [...anim(topRated), ...anim(popular)]
      .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i).slice(0, 5),
    rows: [
      { title: 'Trending Animation', movies: anim(popular) },
      { title: 'All-Time Classics', badge: 'Must Watch', movies: anim(topRated) },
      { title: 'Modern Masterpieces (2020s)', movies: anim(modern) },
      { title: 'Golden Era (2010s)', movies: anim(d2010s) },
      { title: 'Nostalgic Picks (2000s)', movies: anim(d2000s) },
      { title: '90s Cartoons', movies: anim(d90s) },
    ],
  };
}

const FETCHERS = { english: fetchEnglish, bollywood: fetchBollywood, animation: fetchAnimation };
const TABS = ['english', 'bollywood', 'animation'];

// ── Page ──────────────────────────────────────────────────────────────────────
const Recommendations = () => {
  const [activeTab, setActiveTab] = useState('english');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const fetched = useRef(new Set());

  const load = async (tab) => {
    if (fetched.current.has(tab)) return;
    fetched.current.add(tab);
    setLoading(true);
    try {
      const result = await FETCHERS[tab]();
      setData(prev => ({ ...prev, [tab]: result }));
    } catch (err) {
      console.error('Reco fetch error:', err);
      fetched.current.delete(tab); // allow retry
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load('english'); }, []);
  useEffect(() => { load(activeTab); }, [activeTab]);

  const current = data[activeTab];
  const isLoading = loading && !current;

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#080808] pt-20 md:pt-24 pb-20 px-4 md:px-16">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 mb-1 flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Curated For You
          </p>
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white leading-none">
            Recommendations
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-10 border-b border-white/5">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 md:px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? 'text-white border-red-600'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Skeleton />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Top5Picks movies={current?.topPicks} />
              {current?.rows?.map((row, i) => (
                <RecoRow key={i} title={row.title} movies={row.movies} badge={row.badge} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
};

export default Recommendations;
