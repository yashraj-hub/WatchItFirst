import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectFade } from 'swiper/modules';
import { tmdbService } from '../services/tmdb';
import StudioLogo from './StudioLogo';
import MovieCard from './MovieCard';

const GenreExplorerSection = ({ section, isBollywood = false }) => {
  const navigate = useNavigate();
  const [localMovies, setLocalMovies] = useState(section.movies);
  const [page, setPage] = useState(3);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  const isAnimationPage = useMemo(() => window.location.pathname.includes('animation'), []);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const chunkSize = isMobile ? 4 : 5;
  const movieChunks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < localMovies.length; i += chunkSize) {
      chunks.push(localMovies.slice(i, i + chunkSize));
    }
    return chunks;
  }, [localMovies, chunkSize]);

  const slug = useMemo(() =>
    section.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
    [section.name]
  );

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      let data;
      if (section.isStudio) {
        data = isBollywood
          ? await tmdbService.getHindiMovies(nextPage, { with_companies: section.id })
          : await tmdbService.getMoviesByCompany(section.id, nextPage, isAnimationPage ? { with_genres: 16 } : {});
      } else if (section.isEra && isBollywood) {
        data = await tmdbService.getBollywoodByReleaseYears(section.startYear, section.endYear, nextPage);
      } else if (section.isDirector) {
        return;
      } else {
        data = isBollywood
          ? await tmdbService.getBollywoodByGenre(section.id, nextPage)
          : await tmdbService.getMoviesByGenre(section.id, nextPage);
      }

      if (!data.results?.length) {
        setHasMore(false);
      } else {
        const newMovies = (!isBollywood && !isAnimationPage)
          ? data.results.filter(m => !m.genre_ids.includes(16))
          : data.results;
        setLocalMovies(prev => [...prev, ...newMovies]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleTitleClick = () => {
    const params = new URLSearchParams({ genreId: String(section.id), genreName: section.name });
    if (isBollywood) { params.set('lang', 'hi'); params.set('pageType', 'bollywood'); }
    if (section.isStudio) params.set('isStudio', 'true');
    if (isAnimationPage && !isBollywood) params.set('pageType', 'animation');
    if (section.isEra) { params.set('isEra', 'true'); params.set('startYear', String(section.startYear)); params.set('endYear', String(section.endYear)); }
    if (section.isDirector) params.set('isDirector', 'true');
    navigate(`/movies?${params.toString()}`);
  };

  return (
    <div className="relative w-full px-4 md:px-16 py-16 bg-black">
      <div className="flex items-center justify-between mb-8">
        <div
          className="flex items-center gap-4 md:gap-8 cursor-pointer group/title"
          onClick={handleTitleClick}
        >
          <div className="flex flex-col gap-2">
            {section.isStudio && (section.logo || section.id === 429) ? (
              <StudioLogo
                id={section.id}
                logoPath={section.logo || null}
                name={section.name}
                className="h-12 md:h-16 w-auto object-contain"
              />
            ) : (
              <h2 className="text-2xl md:text-4xl lg:text-6xl font-black uppercase italic tracking-tighter text-white leading-none group-hover/title:text-red-600 transition-colors duration-300">
                {section.name}
              </h2>
            )}
          </div>
          {section.total && (
            <span className="text-sm font-bold text-gray-500 uppercase tracking-[0.4em] opacity-40 group-hover/title:opacity-100 transition-opacity">
              {section.total.toLocaleString()} Titles <ChevronRight className="inline-block w-4 h-4 ml-1 mb-0.5" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button className={`slider-prev-${slug} w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-600 hover:border-red-600 text-white transition-all active:scale-90`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className={`slider-next-${slug} w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-600 hover:border-red-600 text-white transition-all active:scale-90`}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative">
        <Swiper
          modules={[Navigation, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          navigation={{ prevEl: `.slider-prev-${slug}`, nextEl: `.slider-next-${slug}` }}
          onSlideChange={(swiper) => { if (swiper.activeIndex >= movieChunks.length - 2) loadMore(); }}
          speed={800}
          slidesPerView={1}
          className="w-full"
        >
          {movieChunks.map((chunk, index) => (
            <SwiperSlide key={index}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
                {chunk.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {loadingMore && (
          <div className="absolute bottom-4 right-4 z-50">
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default GenreExplorerSection;
