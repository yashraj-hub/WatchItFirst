import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdbService, TMDB_CONFIG } from '../../services/tmdb';
import MainLayout from '../../layouts/MainLayout';
import { Search as SearchIcon, X, Star, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) { setResults([]); return; }
      setLoading(true);
      try {
        const data = await tmdbService.search(query.trim());
        const filtered = data.results
          .filter(item => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'))
          .sort((a, b) => {
            const dateA = a.release_date || a.first_air_date || '';
            const dateB = b.release_date || b.first_air_date || '';
            return dateB.localeCompare(dateA);
          });
        setResults(filtered);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const year = (item) => (item.release_date || item.first_air_date || '').split('-')[0];

  return (
    <MainLayout>
      <div className="fixed inset-0 z-10 bg-black/80 backdrop-blur-md" />

      <div className="relative z-20 min-h-screen flex flex-col items-center px-4 pt-24 md:pt-32 pb-16">

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl mb-8"
        >
          <div className="relative group">
            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, shows..."
              className="w-full bg-white/5 border border-white/10 focus:border-red-600/60 rounded-2xl py-4 md:py-5 pl-14 pr-24 text-base md:text-lg font-medium text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1.5 text-gray-500 hover:text-white transition-colors"
                  aria-label="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {!query && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600/80 text-gray-400 hover:text-white transition-all"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Results area */}
        <div className="w-full max-w-7xl">
          <AnimatePresence mode="wait">

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4"
              >
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
                ))}
              </motion.div>
            )}

            {!loading && results.length > 0 && (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-5">
                  {results.length} results for &ldquo;{query}&rdquo; — latest first
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                  {results.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      onClick={() => navigate(`/details/${item.id}`)}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10 group-hover:ring-red-500/50 transition-all duration-300 group-hover:scale-105">
                        <img
                          src={`${TMDB_CONFIG.w500}${item.poster_path}`}
                          alt={item.title || item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-[10px] font-bold text-yellow-400">{item.vote_average?.toFixed(1)}</span>
                            <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />{year(item)}
                            </span>
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-tight text-white line-clamp-2 leading-tight">
                            {item.title || item.name}
                          </p>
                        </div>
                        {item.media_type === 'tv' && (
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-600/90 rounded text-[8px] font-black uppercase tracking-wider text-white">
                            TV
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-[10px] md:text-xs font-bold text-gray-400 group-hover:text-white transition-colors line-clamp-1 uppercase tracking-tight">
                        {item.title || item.name}
                      </p>
                      <p className="text-[9px] text-gray-600 font-bold">{year(item)}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24">
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">No results for &ldquo;{query}&rdquo;</p>
              </motion.div>
            )}

            {!loading && query.length < 2 && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24">
                <SearchIcon className="w-10 h-10 text-white/10 mx-auto mb-4" />
                <p className="text-gray-600 text-sm font-bold uppercase tracking-widest">Type to search</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
};

export default Search;
