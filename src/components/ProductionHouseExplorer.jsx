import { useEffect, useMemo, useRef, useState } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { TMDB_CONFIG, tmdbService } from '../services/tmdb';
import StudioLogo from './StudioLogo';

const PAGE_SIZE = 20;

const sourceMeta = {
  hollywood: { label: 'Hollywood' },
  bollywood: { label: 'Bollywood' },
  animation: { label: 'Animation' },
};

const ProductionHouseExplorer = () => {
  const navigate = useNavigate();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSource, setActiveSource] = useState('hollywood');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sourceBackgrounds, setSourceBackgrounds] = useState({});
  const [sourceBackgroundIndex, setSourceBackgroundIndex] = useState({});
  const sentinelRef = useRef(null);

  const filteredHouses = useMemo(() => {
    const list = houses.filter((house) => house.source === activeSource);

    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [houses, activeSource]);

  const filteredLength = filteredHouses.length;
  const activeBackgrounds = sourceBackgrounds[activeSource] || [];
  const activeBackgroundIndex = sourceBackgroundIndex[activeSource] || 0;
  const activeBackground = activeBackgrounds[activeBackgroundIndex] || activeBackgrounds[0] || null;

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        const data = await tmdbService.getProductionHouseCatalog();
        if (!alive) return;
        setHouses(data.houses || []);
      } catch (err) {
        if (!alive) return;
        console.error('Failed to load production houses:', err);
        setError('Unable to load production houses right now.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeSource]);

  useEffect(() => {
    let alive = true;

    const loadBackgrounds = async () => {
      if (!filteredHouses.length || sourceBackgrounds[activeSource]?.length) return;

      try {
        const candidates = filteredHouses.slice(0, 5);
        const pool = [];

        for (const house of candidates) {
          try {
            const [topRated, popular] = await Promise.all([
              tmdbService.getMoviesByCompany(house.id, 1, {
                sort_by: 'vote_average.desc',
                'vote_count.gte': 50,
              }),
              tmdbService.getMoviesByCompany(house.id, 1, {
                sort_by: 'popularity.desc',
              }),
            ]);

            const candidateMovies = [
              ...(topRated?.results || []),
              ...(popular?.results || []),
            ];

            for (const movie of candidateMovies) {
              const image = movie.backdrop_path || movie.poster_path;
              if (!image) continue;
              if (pool.some((item) => item.id === movie.id)) continue;
              pool.push({
                id: movie.id,
                image,
                title: movie.title || movie.name || house.name,
                houseName: house.name,
              });
              if (pool.length >= 8) break;
            }
            if (pool.length >= 8) break;
          } catch {
            // Try the next house in this source.
          }
        }

        if (!alive || pool.length === 0) return;
        setSourceBackgrounds((prev) => ({
          ...prev,
          [activeSource]: pool,
        }));
      } catch (err) {
        console.error('Failed to load background image:', err);
      }
    };

    loadBackgrounds();

    return () => {
      alive = false;
    };
  }, [activeSource, filteredHouses, sourceBackgrounds]);

  useEffect(() => {
    setSourceBackgroundIndex((prev) => ({
      ...prev,
      [activeSource]: 0,
    }));
  }, [activeSource]);

  useEffect(() => {
    const pool = sourceBackgrounds[activeSource] || [];
    if (pool.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setSourceBackgroundIndex((prev) => {
        const current = prev[activeSource] || 0;
        return {
          ...prev,
          [activeSource]: (current + 1) % pool.length,
        };
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [activeSource, sourceBackgrounds]);

  useEffect(() => {
    if (!sentinelRef.current || loading || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredLength));
        }
      },
      { rootMargin: '250px 0px', threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filteredLength, loading, error]);

  const visibleHouses = filteredHouses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredHouses.length;

  const handleHouseClick = (house) => {
    const params = new URLSearchParams({
      genreId: String(house.id),
      genreName: house.name,
      isStudio: 'true',
    });

    if (house.source === 'bollywood') {
      params.set('lang', 'hi');
      params.set('pageType', 'bollywood');
    } else if (house.source === 'animation') {
      params.set('pageType', 'animation');
    } else {
      params.set('pageType', 'default');
    }

    navigate(`/movies?${params.toString()}`);
  };

  return (
    <section className="relative min-h-screen overflow-hidden px-4 md:px-16 py-12 md:py-16">
      <div className="pointer-events-none fixed inset-0 z-0">
        <AnimatePresence mode="wait">
              {activeBackground ? (
                <motion.div
                  key={`${activeSource}-${activeBackground.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
                  <motion.img
                    src={`${TMDB_CONFIG.original}${activeBackground.image}`}
                    alt=""
                    initial={{ scale: 1.06 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 6, ease: 'easeOut' }}
                    className="h-full w-full object-cover opacity-65"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.18)_24%,rgba(0,0,0,0.78)_68%,rgba(0,0,0,0.98)_100%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_36%,rgba(0,0,0,0.4)_100%)]" />
                </motion.div>
              ) : (
                <motion.div
                  key="fallback"
                  initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-b from-black via-[#050505] to-[#050505]"
            />
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10">
        <div className="mb-10 rounded-[2rem] border border-white/10 bg-black/22 p-5 md:p-7 backdrop-blur-[1px] shadow-[0_14px_32px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.38em] text-red-500 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                Browse by Studio
              </p>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-none drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)]">
                Production Houses
              </h1>
            </div>

            <div className="flex justify-end">
              <div className="relative flex h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-1.5 backdrop-blur-md">
                <motion.div
                  className="absolute h-7 rounded-full bg-gradient-to-r from-red-600 to-red-700 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                  initial={false}
                  animate={{
                    x: activeSource === 'hollywood' ? 0 : activeSource === 'bollywood' ? 101 : 202,
                    width: 94,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />

                {[
                  { id: 'hollywood', label: 'Hollywood' },
                  { id: 'bollywood', label: 'Bollywood' },
                  { id: 'animation', label: 'Animation' },
                ].map((source) => (
                  <motion.button
                    key={source.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveSource(source.id)}
                    className={`relative z-10 w-[94px] px-2 text-center text-[10px] font-black uppercase tracking-[0.12em] transition-colors duration-500 ${
                      activeSource === source.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {source.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-red-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600/60">
                Loading Studios
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-gray-400">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {visibleHouses.map((house, index) => (
                <motion.button
                  key={`${house.source}-${house.id}-${index}`}
                  type="button"
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleHouseClick(house)}
                  className="group flex min-h-[120px] flex-col items-center justify-center px-2 py-2 text-left transition-all duration-300"
                >
                  <div className="flex flex-1 items-center justify-center py-3">
                    <StudioLogo
                      id={house.id}
                      logoPath={house.logo}
                      name={house.name}
                      className="max-h-14 w-auto object-contain opacity-95 transition-opacity duration-300 group-hover:opacity-100"
                      forceInvert
                    />
                  </div>
                </motion.button>
              ))}
            </div>

            <div ref={sentinelRef} className="h-20" />
            {hasMore && (
              <div className="pb-6 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-600/80" />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ProductionHouseExplorer;
