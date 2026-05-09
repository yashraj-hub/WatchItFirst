import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { TMDB_CONFIG } from '../services/tmdb';
import StudioLogo from './StudioLogo';

const HeroSlideContent = ({ movie, isActive, showContent }) => {
  const trailer = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const logo = movie.images?.logos?.find(l => l.iso_639_1 === 'en' || !l.iso_639_1);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setShowVideo(false);
      return;
    }
    // Reveal the video after 5 seconds
    const timer = setTimeout(() => setShowVideo(true), 5000);
    return () => clearTimeout(timer);
  }, [isActive]);

  return (
    <div className="relative h-full w-full">
      {/* Video Background: mount only after the slide has stayed active long enough */}
      {trailer && isActive && showVideo && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/30 z-10" />
          <iframe
            className="absolute inset-0 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.78vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&fs=0&autohide=1&loop=1&playlist=${trailer.key}&start=1`}
            allow="autoplay; encrypted-media"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            aria-hidden="true"
            tabIndex={-1}
            title="Trailer"
          />
        </div>
      )}

      {/* Poster Background (Covers video for first 5 sec) */}
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: showVideo ? 0 : 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute inset-0 z-20 pointer-events-none"
      >
        <img src={`${TMDB_CONFIG.original}${movie.backdrop_path}`} className="w-full h-full object-cover" alt="" />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-end pb-32 md:pb-48 pl-4 md:pl-16 pr-4 md:pr-16">
        {isActive && showContent && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
            className="max-w-4xl"
          >
            {logo ? (
              <img 
                src={`${TMDB_CONFIG.original}${logo.file_path}`} 
                alt={movie.title || movie.name}
                className="h-20 md:h-24 lg:h-32 w-auto object-contain mb-6"
              />
            ) : (
              <h1 className="text-5xl md:text-4xl lg:text-5xl xl:text-6xl font-heading text-white mb-3 tracking-tighter uppercase leading-[0.9]">
                {movie.title || movie.name}
              </h1>
            )}

            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-300 uppercase tracking-wide">
              <span className="text-white font-bold">
                {(movie.release_date || movie.first_air_date)?.split('-')[0]}
              </span>
              <span>·</span>
              <span>{movie.original_language?.toUpperCase()}</span>
              {movie.runtime && (
                <>
                  <span>·</span>
                  <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                </>
              )}
              {movie.vote_average > 0 && (
                <>
                  <span>·</span>
                  <span className="text-white font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-red-600 text-red-600" />
                    {movie.vote_average.toFixed(1)}
                  </span>
                </>
              )}
              {movie.status && (
                <>
                  <span>·</span>
                  <span>{movie.status}</span>
                </>
              )}
            </div>

            <p className="text-xs md:text-sm text-gray-200 mb-4 md:mb-6 leading-relaxed font-medium max-w-3xl opacity-90 pr-0 md:pr-32 line-clamp-3 md:line-clamp-none">
              {movie.overview}
            </p>

            {movie.production_companies?.filter(c => c.logo_path).length > 0 && (
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-4">
                {movie.production_companies.filter(c => c.logo_path).map(company => (
                  <StudioLogo
                    key={company.id}
                    id={company.id}
                    logoPath={company.logo_path}
                    name={company.name}
                    className="h-5 md:h-6 w-auto object-contain"
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HeroSlideContent;
