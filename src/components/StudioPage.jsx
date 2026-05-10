import { useEffect, useRef, useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { TMDB_CONFIG, tmdbService } from '../services/tmdb';
import MainLayout from '../layouts/MainLayout';
import MovieCard from './MovieCard';
import { useNavigate } from 'react-router-dom';

const StudioPage = ({ title, companyId, logoSrc, logoAlt, discoveryParams = {} }) => {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [companyLogo, setCompanyLogo] = useState(null);
  const observerTarget = useRef(null);
  const navigate = useNavigate();

  const fetchMovies = async (pageNum) => {
    try {
      if (pageNum === 1) {
        try {
          const companyInfo = await tmdbService.getCompanyDetails(companyId);
          if (companyInfo?.logo_path) setCompanyLogo(companyInfo.logo_path);
        } catch {}
      }
      const data = await tmdbService.getMoviesByCompany(companyId, pageNum, discoveryParams);
      if (!data.results || data.results.length === 0) { setHasMore(false); return; }
      setMovies(prev => pageNum === 1 ? data.results : [...prev, ...data.results]);
    } catch (err) {
      console.error(`Failed to fetch ${title} movies:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMovies([]); setPage(1); setHasMore(true); setLoading(true); setCompanyLogo(null);
    fetchMovies(1);
    window.scrollTo(0, 0);
  }, [companyId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => { const next = prev + 1; fetchMovies(next); return next; });
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loading, companyId]);

  const resolvedLogo = logoSrc || (companyLogo ? `${TMDB_CONFIG.original}${companyLogo}` : null);

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#050505]">

        {/* Hero header — clean dark, no bg bleed */}
        <div className="relative pt-24 pb-12 px-4 md:px-16 border-b border-white/5">
          {/* Back btn */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-20 left-4 md:left-8 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-end gap-8 max-w-7xl mx-auto">
            {/* Logo box — fixed size, dark bg always */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0 w-48 h-28 md:w-64 md:h-36 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-6"
            >
              {resolvedLogo ? (
                <img
                  src={resolvedLogo}
                  alt={logoAlt || title}
                  className="max-h-16 max-w-[160px] w-auto h-auto object-contain"
                />
              ) : (
                <span className="text-2xl font-black uppercase tracking-tighter text-white">{title}</span>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col gap-2 text-center md:text-left"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">Production House</p>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">
                {title}
              </h1>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                {loading ? 'Loading...' : `${movies.length}+ Movies`}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Movie grid */}
        <div className="px-4 md:px-16 py-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6">
            {movies.map((movie, index) => (
              <motion.div
                key={`${movie.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % 12) * 0.04 }}
                className="space-y-3"
              >
                <MovieCard movie={movie} />
                <div>
                  <h3 className="text-xs font-black truncate uppercase tracking-tight text-white leading-tight">
                    {movie.title || movie.name}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-600 mt-0.5">
                    {(movie.release_date || movie.first_air_date)?.split('-')[0]}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div ref={observerTarget} className="h-20 mt-12 flex items-center justify-center">
            {loading && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-600/60">Loading More</span>
              </div>
            )}
            {!hasMore && movies.length > 0 && (
              <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-600">End of Collection</span>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default StudioPage;
