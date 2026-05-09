import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import 'swiper/css';
import 'swiper/css/navigation';

const MovieRow = ({ title, movies, totalCount }) => {
  return (
    <div className="space-y-6 mb-16">
      <div className="flex items-center justify-between px-4 md:px-16">
        <div className="flex items-baseline gap-4">
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">
            {title}
          </h2>
          {totalCount && (
            <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
              {totalCount.toLocaleString()} Titles
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button className={`row-prev-${title.replace(/\s+/g, '-')} w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all active:scale-90`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className={`row-next-${title.replace(/\s+/g, '-')} w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all active:scale-90`}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="relative px-4 md:px-16">
        <Swiper
          modules={[Navigation]}
          navigation={{
            prevEl: `.row-prev-${title.replace(/\s+/g, '-')}`,
            nextEl: `.row-next-${title.replace(/\s+/g, '-')}`,
          }}
          slidesPerView={2}
          spaceBetween={16}
          breakpoints={{
            640: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 4, spaceBetween: 24 },
            1280: { slidesPerView: 5, spaceBetween: 30 },
          }}
          className="!overflow-visible"
        >
          {movies?.map((movie) => (
            <SwiperSlide key={movie.id}>
              <div className="w-full">
                <MovieCard movie={movie} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default MovieRow;
