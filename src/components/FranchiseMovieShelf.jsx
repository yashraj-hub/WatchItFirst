import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectFade } from 'swiper/modules';
import { tmdbService, TMDB_CONFIG } from '../services/tmdb';
import { MARVEL_LOGO_SRC } from '../data/franchiseMovies';
import MovieCard from './MovieCard';

const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const pickBestMatch = (results, movie) => {
  if (!results?.length) return null;

  if (movie.year) {
    const yearMatch = results.find((item) => item.release_date?.startsWith(String(movie.year)));
    if (yearMatch) return yearMatch;
  }

  const exactTitle = results.find((item) => normalize(item.title || item.name || '') === normalize(movie.title));
  return exactTitle || results[0];
};

const FranchiseMovieShelf = ({ title, logoSrc, logoAlt, movies, subtitle, navigateTo }) => {
  const navigate = useNavigate();
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMarvel = title.toLowerCase().includes('marvel');

  const featuredList = useMemo(() => movies.slice(0, 8), [movies]);
  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  useEffect(() => {
    if (featuredMovies.length > 0) return;

    let cancelled = false;

    const loadFeatured = async () => {
      setLoading(true);
      try {
        const resolved = await Promise.all(
          featuredList.map(async (movie) => {
            try {
              const searchResult = await tmdbService.search(movie.title, 'movie');
              const match = pickBestMatch(searchResult.results, movie);
              return match ? { ...match, displayTitle: movie.title } : null;
            } catch {
              return null;
            }
          })
        );

        if (!cancelled) {
          setFeaturedMovies(resolved.filter(Boolean));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFeatured();

    return () => {
      cancelled = true;
    };
  }, [featuredList, featuredMovies.length]);

  const cards = featuredMovies.length > 0 ? featuredMovies : featuredList;
  const movieChunks = [];
  for (let i = 0; i < cards.length; i += 5) {
    movieChunks.push(cards.slice(i, i + 5));
  }

  const resolvedLogoSrc =
    logoSrc || (isMarvel ? MARVEL_LOGO_SRC : null);

  return (
    <section className="relative w-full px-4 md:px-16 pt-14 pb-8 md:pt-16 md:pb-10 bg-black">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div
          className="flex items-center gap-6 md:gap-10 group/title cursor-pointer"
          onClick={() => navigate(navigateTo || `/search?q=${encodeURIComponent(title.replace(/\s+(Studios|Universe)$/i, ''))}`)}
        >
          <div className="flex items-center gap-4 md:gap-6">
            {resolvedLogoSrc ? (
              <img
                src={resolvedLogoSrc}
                alt={logoAlt || title}
                className="h-12 md:h-16 w-auto max-w-[220px] object-contain"
              />
            ) : (
              <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-none group-hover/title:text-red-600 transition-colors duration-300">
                {title}
              </h2>
            )}
            <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-[0.4em] opacity-40 group-hover/title:opacity-100 transition-opacity whitespace-nowrap">
              {movies.length.toLocaleString()} Titles <ChevronRight className="inline-block w-3 h-3 ml-2 mb-0.5" />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className={`slider-prev-${slug} w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-600 hover:border-red-600 text-white transition-all active:scale-90 shadow-2xl`} type="button">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className={`slider-next-${slug} w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-600 hover:border-red-600 text-white transition-all active:scale-90 shadow-2xl`} type="button">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {subtitle && (
        <p className="text-sm md:text-base text-gray-400 max-w-3xl leading-relaxed mb-5 md:mb-6">
          {subtitle}
        </p>
      )}

      <div className="relative">
        <Swiper
          modules={[Navigation, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          navigation={{
            prevEl: `.slider-prev-${slug}`,
            nextEl: `.slider-next-${slug}`,
          }}
          speed={800}
          slidesPerView={1}
          className="w-full"
        >
          {movieChunks.map((chunk, index) => (
            <SwiperSlide key={index}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {chunk.map((movie) => (
                  <div key={movie.id} className="w-full">
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>
            </SwiperSlide>
          ))}
          {loading && (
            <div className="absolute bottom-4 right-4 z-50">
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </Swiper>
      </div>

    </section>
  );
};

export default FranchiseMovieShelf;
