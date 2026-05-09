import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectFade } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const CategorySlider = ({ title, movies, total }) => {
  // Chunk movies into groups of 5
  const movieChunks = [];
  for (let i = 0; i < movies.length; i += 5) {
    movieChunks.push(movies.slice(i, i + 5));
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return (
    <div className="mb-20 group/row px-4 md:px-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-baseline gap-4 md:gap-6">
          <h2 className="text-3xl md:text-5xl lg:text-7xl font-black uppercase italic tracking-tighter text-white/90 group-hover/row:text-red-600 transition-colors duration-300">
            {title}
          </h2>
          {total && (
            <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-[0.3em] opacity-60">
              {total.toLocaleString()} Titles
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
          <button className={`slider-prev-${slug} w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center hover:bg-red-600 hover:border-red-600 text-white transition-all active:scale-90`}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button className={`slider-next-${slug} w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center hover:bg-red-600 hover:border-red-600 text-white transition-all active:scale-90`}>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="px-0">
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
          allowTouchMove={true}
          className="overflow-visible"
        >
          {movieChunks.map((chunk, index) => (
            <SwiperSlide key={index}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {chunk.map((movie) => (
                  <div key={movie.id} className="w-full">
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default CategorySlider;
