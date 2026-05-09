import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { TMDB_CONFIG, tmdbService } from '../services/tmdb';
import MainLayout from '../layouts/MainLayout';
import MovieCard from './MovieCard';

const StudioPage = ({ title, companyId, logoSrc, logoAlt, discoveryParams = {} }) => {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [bgIndex, setBgIndex] = useState(0);
  const [bgMovies, setBgMovies] = useState([]);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [scrolledDown, setScrolledDown] = useState(false);
  const observerTarget = useRef(null);

  const fetchMovies = async (pageNum) => {
    try {
      if (pageNum === 1) {
        try {
          const companyInfo = await tmdbService.getCompanyDetails(companyId);
          if (companyInfo?.logo_path) {
            setCompanyLogo(companyInfo.logo_path);
          }
        } catch {
          // Logo is optional; we keep the page usable without it.
        }
      }

      const data = await tmdbService.getMoviesByCompany(companyId, pageNum, discoveryParams);

      if (!data.results || data.results.length === 0) {
        setHasMore(false);
        return;
      }

      setMovies((prev) => (pageNum === 1 ? data.results : [...prev, ...data.results]));

      if (pageNum === 1) {
        setBgMovies(data.results.filter((movie) => movie.backdrop_path).slice(0, 10));
      }
    } catch (err) {
      console.error(`Failed to fetch ${title} movies:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setCompanyLogo(null);
    fetchMovies(1);
    window.scrollTo(0, 0);
  }, [companyId, discoveryParams]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolledDown(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (bgMovies.length === 0) return;
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgMovies.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [bgMovies]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => {
            const next = prev + 1;
            fetchMovies(next);
            return next;
          });
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, companyId]);

  const resolvedLogo =
    logoSrc ||
    (companyLogo ? `${TMDB_CONFIG.original}${companyLogo}` : null);

  return (
    <MainLayout>
      <div className="relative min-h-screen bg-[#050505] overflow-hidden">
        <div className="fixed inset-0 z-0">
          <AnimatePresence mode="wait">
            {bgMovies.length > 0 && (
              <motion.div
                key={bgMovies[bgIndex].id}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: scrolledDown ? 0.28 : 0.38, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
                className="absolute inset-0"
              >
                <img
                  src={`${TMDB_CONFIG.original}${bgMovies[bgIndex].backdrop_path}`}
                  className="w-full h-full object-cover"
                  alt=""
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div
            className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-700 ${
              scrolledDown
                ? 'from-[#050505]/92 via-[#050505]/55 to-transparent opacity-100'
                : 'from-[#050505]/80 via-[#050505]/28 to-transparent opacity-100'
            }`}
          />
          <div className={`absolute inset-0 transition-colors duration-700 ${scrolledDown ? 'bg-black/16' : 'bg-black/8'}`} />
        </div>

        <div className="relative z-10 pt-32 pb-24 px-4 md:px-16 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-24 flex flex-col items-center text-center"
          >
            {resolvedLogo ? (
              <div className="flex flex-col items-center gap-6">
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={resolvedLogo}
                  alt={logoAlt || title}
                  className="h-24 md:h-36 lg:h-48 w-auto object-contain"
                />
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-[0.6em] text-white opacity-80 mt-2">
                  {title}
                </h1>
              </div>
            ) : (
              <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter italic text-white leading-none">
                {title}
              </h1>
            )}
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12">
            {movies.map((movie, index) => (
              <motion.div
                key={`${movie.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % 10) * 0.05 }}
                className="space-y-4"
              >
                <MovieCard movie={movie} />
                <div className="px-1">
                  <h3 className="text-sm md:text-base font-black truncate uppercase tracking-tight text-white leading-tight">
                    {movie.title || movie.name}
                  </h3>
                  <p className="text-xs font-bold text-gray-500 mt-1">
                    {(movie.release_date || movie.first_air_date)?.split('-')[0]}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div
            ref={observerTarget}
            className="h-20 mt-12 flex items-center justify-center"
          >
            {loading && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-10 h-10 animate-spin text-red-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-600/60">
                  Syncing More Titles
                </span>
              </div>
            )}
            {!hasMore && movies.length > 0 && (
              <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-600">
                End of Discovery
              </span>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudioPage;
