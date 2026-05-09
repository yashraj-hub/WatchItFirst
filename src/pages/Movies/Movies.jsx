import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tmdbService, TMDB_CONFIG } from '../../services/tmdb';
import MainLayout from '../../layouts/MainLayout';
import MovieCard from '../../components/MovieCard';
import { Loader2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DC_LOGO_SRC = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/DC_Studios_logo.svg/1280px-DC_Studios_logo.svg.png';
const MARVEL_LOGO_SRC = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Marvel_Logo.svg/500px-Marvel_Logo.svg.png';
const ANIMATION_STUDIO_IDS = new Set([3, 6125, 33, 521, 6704, 9993]);

const Movies = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const genreId = searchParams.get('genreId');
  const genreName = searchParams.get('genreName');
  const personId = searchParams.get('personId');
  const personName = searchParams.get('personName');
  const lang = searchParams.get('lang');
  const pageType = searchParams.get('pageType');
  const isStudio = searchParams.get('isStudio') === 'true';
  const isEra = searchParams.get('isEra') === 'true';
  const isDirector = searchParams.get('isDirector') === 'true';
  const startYear = searchParams.get('startYear');
  const endYear = searchParams.get('endYear');

  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [studioLogo, setStudioLogo] = useState(null);
  const [scrolledDown, setScrolledDown] = useState(false);
  const isPerson = Boolean(personId);
  const pageTitle = isPerson ? personName : genreName;
  
  // Background Slideshow State
  const [bgIndex, setBgIndex] = useState(0);
  const [bgMovies, setBgIndexMovies] = useState([]);

  // Infinite Scroll Ref
  const observerTarget = useRef(null);
  const normalizedGenreName = String(genreName || '').toLowerCase();
  const isDCStudio = isStudio && normalizedGenreName.includes('dc');
  const isMarvelStudio = isStudio && normalizedGenreName.includes('marvel');
  const isAnimationStudio = isStudio && ANIMATION_STUDIO_IDS.has(Number(genreId));
  const getFallbackRoute = () => {
    if (pageType === 'animation' || window.location.pathname.includes('animation')) {
      return '/animation';
    }
    if (pageType === 'bollywood' || lang === 'hi' || isEra || isDirector) {
      return '/bollywood';
    }
    return '/';
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(getFallbackRoute());
  };

  const fetchMovies = async (pageNum) => {
    try {
      let data;
      const isAnimationPage =
        pageType === 'animation' ||
        window.location.pathname.includes('animation') ||
        isAnimationStudio;
      if (isEra) {
        if (pageType === 'animation') {
          data = await tmdbService.getAnimationByReleaseYears(startYear, endYear, pageNum);
        } else {
          data = await tmdbService.getBollywoodByReleaseYears(startYear, endYear, pageNum);
        }
      } else if (personId) {
        if (pageNum === 1) {
          try {
            const credits = await tmdbService.getPersonMovieCredits(personId);
            const castMovies = (credits?.cast || [])
              .filter((movie) => movie.release_date || movie.first_air_date)
              .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            const uniqueMovies = [];
            const seenIds = new Set();
            for (const movie of castMovies) {
              if (seenIds.has(movie.id)) continue;
              seenIds.add(movie.id);
              uniqueMovies.push(movie);
            }
            data = { results: uniqueMovies, total_results: uniqueMovies.length };
          } catch (e) {
            console.error('Actor credits fetch error', e);
            data = { results: [], total_results: 0 };
          }
        } else {
          data = { results: [], total_results: 0 };
        }
      } else if (isDirector) {
        if (pageNum === 1) {
          try {
            const credits = await tmdbService.getPersonMovieCredits(genreId);
            const directedMovies = (credits?.crew || [])
              .filter((movie) => movie.job === 'Director' && movie.release_date)
              .sort((a, b) => (b.popularity || 0) - (a.popularity || 0) || (b.release_date || '').localeCompare(a.release_date || ''));
            const uniqueMovies = [];
            const seenIds = new Set();
            for (const movie of directedMovies) {
              if (seenIds.has(movie.id)) continue;
              seenIds.add(movie.id);
              uniqueMovies.push(movie);
            }
            data = { results: uniqueMovies, total_results: uniqueMovies.length };
          } catch (e) {
            console.error('Director credits fetch error', e);
            data = { results: [], total_results: 0 };
          }
        } else {
          data = { results: [], total_results: 0 };
        }
      } else if (isStudio) {
        // Fetch studio logo if it's the first page
        if (pageNum === 1) {
          try {
            const companyInfo = await tmdbService.getCompanyDetails(genreId);
            if (companyInfo.logo_path) setStudioLogo(companyInfo.logo_path);
          } catch (e) { console.error("Logo fetch error", e); }
        }

        if (lang === 'hi') {
          data = await tmdbService.getHindiMovies(pageNum, { with_companies: genreId });
        } else {
          data = await tmdbService.getMoviesByCompany(
            genreId,
            pageNum,
            isAnimationPage ? { with_genres: 16 } : {}
          );
        }
      } else if (genreId) {
        if (lang === 'hi') {
          data = await tmdbService.getBollywoodByGenre(genreId, pageNum);
        } else {
          data = await tmdbService.getMoviesByGenre(genreId, pageNum);
        }
      } else {
        if (lang === 'hi') {
          data = await tmdbService.getHindiMovies(pageNum);
        } else {
          data = await tmdbService.getMovies(pageNum);
        }
      }
      
      if (!data.results || data.results.length === 0) {
        setHasMore(false);
      } else {
        let filtered = data.results;
        if (!isAnimationPage && genreId !== '16') {
          filtered = filtered.filter(m => !m.genre_ids.includes(16));
        }
        setMovies(prev => pageNum === 1 ? filtered : [...prev, ...filtered]);
        
        if (pageNum === 1) {
          setBgIndexMovies(filtered.filter(m => m.backdrop_path).slice(0, 5));
        }
      }
    } catch (err) {
      console.error("Failed to fetch movies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setStudioLogo(null);
    fetchMovies(1);
    window.scrollTo(0, 0);
  }, [genreId, lang, pageType, isStudio, isDirector, isEra, startYear, endYear]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolledDown(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Infinite Scroll Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => {
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
  }, [hasMore, loading]);

  // Slideshow Timer
  useEffect(() => {
    if (bgMovies.length === 0) return;
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % bgMovies.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [bgMovies]);

  return (
    <MainLayout>
      <div className="relative min-h-screen bg-[#050505] overflow-hidden">
        <button
          type="button"
          onClick={handleBack}
          className="fixed left-4 top-16 md:left-6 md:top-20 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/90 backdrop-blur-md transition hover:bg-white/15 hover:text-white"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Cinematic Background Slideshow */}
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
            {studioLogo || isDCStudio || isMarvelStudio || isAnimationStudio ? (
              <div className="flex flex-col items-center">
                <motion.img 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={
                    isMarvelStudio
                      ? MARVEL_LOGO_SRC
                      : isAnimationStudio && studioLogo
                        ? `${TMDB_CONFIG.original}${studioLogo}`
                      : studioLogo
                        ? `${TMDB_CONFIG.original}${studioLogo}`
                        : DC_LOGO_SRC
                  } 
                  alt={pageTitle}
                  className="h-28 md:h-40 lg:h-52 w-auto object-contain"
                />
              </div>
            ) : isDirector ? (
              <h1 className="text-4xl md:text-8xl font-black uppercase tracking-tighter italic text-white leading-none">
                {pageTitle || 'Director'}
              </h1>
            ) : (
              <h1 className="text-5xl md:text-9xl font-black uppercase tracking-tighter italic text-white leading-none">
                {pageTitle || 'Archive'}
              </h1>
            )}
          </motion.div>

          {/* Movie Grid */}
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

          {/* Infinite Scroll Trigger */}
          <div 
            ref={observerTarget} 
            className="h-20 mt-12 flex items-center justify-center"
          >
            {loading && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-10 h-10 animate-spin text-red-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-600/60">Syncing More Titles</span>
              </div>
            )}
            {!hasMore && movies.length > 0 && (
              <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-600">End of Discovery</span>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Movies;
