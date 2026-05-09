import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { TMDB_CONFIG } from '../services/tmdb';

const HeroLogoPagination = ({ movies, activeIndex, onSelect, onDoubleClick }) => {
  const [swiper, setSwiper] = useState(null);

  useEffect(() => {
    if (swiper) {
      swiper.slideTo(activeIndex);
    }
  }, [activeIndex, swiper]);

  return (
    <div className="hidden md:block absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 h-[250px] md:h-[300px] lg:h-[350px] w-10 md:w-14 lg:w-20">
      <Swiper
        direction="vertical"
        slidesPerView={5}
        centeredSlides={true}
        onSwiper={setSwiper}
        speed={1000}
        className="h-full w-full logo-pagination-swiper !overflow-visible"
      >
        {movies.map((movie, index) => {
          const logo = movie.images?.logos?.find(l => l.iso_639_1 === 'en' || !l.iso_639_1);
          const isActive = activeIndex === index;
          const isNear = Math.abs(activeIndex - index) === 1;
          
          return (
            <SwiperSlide key={movie.id} className="!flex items-center justify-end">
              <motion.div
                whileHover={{ scale: 1.1, x: -3 }}
                onClick={() => onSelect(index)}
                onDoubleClick={() => onDoubleClick(movie.id)}
                transition={{ type: "spring", stiffness: 250, damping: 25 }}
                className={`cursor-pointer transition-all duration-700 w-full p-1 md:p-1.5 rounded-lg flex items-center justify-center ${
                  isActive 
                    ? 'bg-white/10 border border-white/15 shadow-[0_0_12px_rgba(255,255,255,0.1)] opacity-100 scale-100' 
                    : isNear
                      ? 'opacity-40 grayscale-[50%] scale-90'
                      : 'opacity-15 grayscale scale-75'
                }`}
              >
                {logo ? (
                  <img 
                    src={`${TMDB_CONFIG.original}${logo.file_path}`} 
                    alt={movie.title || movie.name}
                    className="w-full h-4 md:h-5 lg:h-6 object-contain"
                  />
                ) : (
                  <span className="text-[5px] md:text-[6px] font-black uppercase tracking-tighter text-white truncate block text-right">
                    {movie.title || movie.name}
                  </span>
                )}
              </motion.div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default HeroLogoPagination;
