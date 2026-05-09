import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdbService, TMDB_CONFIG } from '../../services/tmdb';
import MainLayout from '../../layouts/MainLayout';
import { Search as SearchIcon, X, Star, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NOISE_KEYWORDS = ['making of', 'documentary', 'unauthorized', 'repackaged', 'soundtrack', 'tribute', 'parody', 'fan film', 'trailer', 'behind the scenes'];

const year = (item) => (item.release_date || item.first_air_date || '').split('-')[0];

const typeLabel = (item) => item.media_type === 'tv' ? 'TV' : 'Movie';

// Fallback: group standalone items by shared title prefix (for TV shows / unmatched)
function groupByTitlePrefix(items) {
  const groups = {};
  const standalone = [];

  const findPrefix = (title) => {
    const words = title.split(/\s+/).filter(w => w.length > 1);
    for (let i = Math.min(3, words.length); i >= 1; i--) {
      const prefix = words.slice(0, i).join(' ');
      if (prefix.length < 3) continue;
      const matches = items.filter(m =>
        (m.title || m.name || '').toLowerCase().startsWith(prefix.toLowerCase())
      );
      if (matches.length >= 2) return prefix;
    }
    return '';
  };

  items.forEach(item => {
    const name = (item.title || item.name || '').toLowerCase();
    const isNoise = NOISE_KEYWORDS.some(kw => name.includes(kw));
    const isMainline = item.popularity > 10 || item.vote_count > 50;
    const prefix = !isNoise && isMainline ? findPrefix(item.title || item.name || '') : '';

    if (prefix) {
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(item);
    } else {
      standalone.push(item);
    }
  });

  const grouped = Object.entries(groups)
    .filter(([, items]) => items.length >= 2)
    .map(([name, items]) => ({
      id: name,
      name,
      parts: [...items].sort((a, b) =>
        (a.release_date || a.first_air_date || '').localeCompare(b.release_date || b.first_air_date || '')
      ),
      source: 'title_prefix',
    }));

  // Items that ended up in a single-item group go to standalone
  const groupedIds = new Set(grouped.flatMap(g => g.parts.map(p => p.id)));
  const finalStandalone = [...standalone, ...items.filter(i => !groupedIds.has(i.id) && !standalone.find(s => s.id === i.id))];

  return { grouped, standalone: finalStandalone };
}

const PartBadge = ({ index }) => (
  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shadow-lg z-10">
    <span className="text-[9px] font-black text-white">{index + 1}</span>
  </div>
);

const MovieCard = ({ item, onClick, index, showPart }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.92 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.03 }}
    onClick={onClick}
    className="group cursor-pointer flex-shrink-0 w-36 md:w-44"
  >
    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-red-500/50 transition-all duration-400 group-hover:scale-[1.03] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
      <img
        src={`${TMDB_CONFIG.w500}${item.poster_path}`}
        alt={item.title || item.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {showPart && <PartBadge index={index} />}
      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10">
        <span className="text-[8px] font-black text-gray-300 uppercase">{typeLabel(item)}</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-black text-white">{item.vote_average?.toFixed(1)}</span>
        </div>
        <button className="w-full py-1.5 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest translate-y-3 group-hover:translate-y-0 transition-transform duration-400">
          Details
        </button>
      </div>
    </div>
    <h3 className="mt-2 text-[10px] font-black uppercase tracking-tight text-gray-400 group-hover:text-white transition-colors line-clamp-1">
      {item.title || item.name}
    </h3>
    <p className="text-[9px] font-bold text-gray-600 mt-0.5 uppercase tracking-widest">{year(item)}</p>
  </motion.div>
);

const CollectionGroup = ({ group, navigate }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-red-600 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)]">
        <Layers className="w-4 h-4 text-white" />
      </div>
      <div>
        <h2 className="text-base font-black uppercase tracking-tighter text-white leading-none">
          {group.name}
        </h2>
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
          {group.source === 'tmdb_collection' || group.source === 'belongs_to'
            ? `Official Collection • ${group.parts.length} Parts • Release Order`
            : `Series • ${group.parts.length} Parts`}
        </p>
      </div>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-0.5">
      {group.parts.map((item, i) => (
        <MovieCard
          key={item.id}
          item={item}
          index={i}
          showPart={group.source === 'tmdb_collection' || group.source === 'belongs_to'}
          onClick={() => navigate(`/details/${item.id}`)}
        />
      ))}
    </div>
  </div>
);

const Search = () => {
  const [query, setQuery] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [searchResult, setSearchResult] = useState(null); // { collections, standalone, items }
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Autocomplete suggestion from first result
  useEffect(() => {
    const items = searchResult?.items || [];
    if (query.trim().length >= 2 && items.length > 0) {
      const title = items[0].title || items[0].name || '';
      if (title.toLowerCase().startsWith(query.toLowerCase())) {
        setSuggestion(query + title.slice(query.length));
      } else {
        setSuggestion('');
      }
    } else {
      setSuggestion('');
    }
  }, [query, searchResult]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSearchResult(null);
        return;
      }
      setLoading(true);
      try {
        const data = await tmdbService.searchEnriched(query.trim());
        setSearchResult(data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      setQuery(suggestion);
    }
  };

  // Apply filter + fallback prefix grouping on standalone
  const { collections, standalone } = (() => {
    if (!searchResult) return { collections: [], standalone: [] };

    const filteredStandalone = searchResult.standalone;
    const filteredCollections = searchResult.collections;

    // Apply prefix grouping on remaining standalone items
    const { grouped: prefixGroups, standalone: finalStandalone } = groupByTitlePrefix(filteredStandalone);

    return {
      collections: [...filteredCollections, ...prefixGroups],
      standalone: finalStandalone.sort((a, b) =>
        (b.release_date || b.first_air_date || '').localeCompare(a.release_date || a.first_air_date || '')
      ),
    };
  })();

  const totalFound = searchResult?.items?.length ?? 0;
  const hasResults = collections.length > 0 || standalone.length > 0;

  return (
    <MainLayout>
      <div className="fixed inset-0 z-10 bg-[#050505]" />
      <div className="fixed inset-0 z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-20 min-h-screen flex flex-col items-center px-4 pt-24 md:pt-32 pb-16">

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-3xl mb-8"
        >
          <div className="relative group">
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-600 transition-colors" />

            {suggestion && (
              <div className="absolute left-16 top-1/2 -translate-y-1/2 text-base md:text-lg font-medium text-gray-700 pointer-events-none select-none">
                {suggestion}
              </div>
            )}

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search movies, shows, franchises..."
              className="w-full bg-white/5 border border-white/10 focus:border-red-600/40 rounded-3xl py-5 md:py-6 pl-16 pr-24 text-base md:text-lg font-medium text-white placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-red-600/10 transition-all backdrop-blur-xl"
            />

            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full bg-white/10 hover:bg-red-600 text-white transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {suggestion && (
              <div className="absolute top-[calc(100%+10px)] left-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest animate-pulse">
                Press <span className="text-red-500">TAB</span> to complete
              </div>
            )}
          </div>
        </motion.div>



        {/* Results */}
        <div className="w-full max-w-7xl">
          <AnimatePresence mode="wait">

            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                ))}
              </motion.div>
            )}

            {!loading && hasResults && (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">

                {/* Collections / Franchise Groups */}
                {collections.map((group) => (
                  <CollectionGroup key={group.id} group={group} navigate={navigate} />
                ))}

                {/* Standalone Results */}
                {standalone.length > 0 && (
                  <div className="space-y-5">
                    {collections.length > 0 && (
                      <div className="flex items-center gap-3 border-t border-white/5 pt-8">
                        <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
                          <SearchIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <h2 className="text-base font-black uppercase tracking-tighter text-white">More Results</h2>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-5">
                      {standalone.map((item, i) => (
                        <MovieCard
                          key={item.id}
                          item={item}
                          index={i}
                          showPart={false}
                          onClick={() => navigate(`/details/${item.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {!loading && query.length >= 2 && searchResult && !hasResults && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-32">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                  <X className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-2">No results found</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Nothing matched &ldquo;{query}&rdquo;</p>
              </motion.div>
            )}

            {!loading && query.length < 2 && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-32">
                <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-600/20 shadow-[0_0_50px_rgba(220,38,38,0.1)]">
                  <SearchIcon className="w-10 h-10 text-red-600 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-3">Ready to explore?</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Type a title, franchise, or series above</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
};

export default Search;
