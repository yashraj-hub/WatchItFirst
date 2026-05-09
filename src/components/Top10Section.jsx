import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import { TMDB_CONFIG } from '../services/tmdb';

import 'swiper/css';
import 'swiper/css/effect-fade';

const Top10Card = ({ movie, rank }) => {
  const navigate = useNavigate();
  return (
    <div className="relative group py-2">
      <div
        className="relative rounded-lg overflow-hidden bg-[#1a1a1a] ring-1 ring-white/10 transition-all duration-300 group-hover:scale-105 group-hover:z-20 cursor-pointer"
        onClick={() => navigate(`/details/${movie.id}`)}
      >
        <img
          src={`${TMDB_CONFIG.w500}${movie.poster_path}`}
          alt={movie.title || movie.name}
          className="w-full aspect-[2/3] object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <p className="text-[10px] font-bold text-red-600 mb-1">{Math.round(movie.vote_average * 10)}% Match</p>
          <h3 className="text-xs font-heading uppercase truncate text-white">{movie.title || movie.name}</h3>
        </div>
      </div>
      <div className="absolute -bottom-3 -right-1 md:-bottom-6 md:-right-4 z-30 pointer-events-none select-none">
        <span className="text-7xl md:text-8xl font-heading font-black leading-none italic text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] opacity-90">
          {rank}
        </span>
      </div>
    </div>
  );
};

const Top10Section = ({ title, movies }) => {
  const top10 = movies.slice(0, 10);
  const chunks = [top10.slice(0, 5), top10.slice(5, 10)];

  return (
    <div className="px-4 md:px-16">
      <div className="flex items-center justify-end -mb-4 md:-mb-10 relative z-10 pointer-events-none">
        <h2 className="text-2xl md:text-6xl font-black text-white uppercase tracking-tighter italic text-right leading-none">
          {title}
        </h2>
      </div>

      {/* Mobile: fade auto */}
      <div className="block md:hidden pt-8 pb-12">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          slidesPerView={1}
          loop={true}
          className="!overflow-visible"
        >
          {top10.map((movie, i) => (
            <SwiperSlide key={movie.id} className="py-2">
              <Top10Card movie={movie} rank={i + 1} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Desktop: 5-card grid */}
      <div className="hidden md:block overflow-visible relative">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          slidesPerView={1}
          loop={true}
          className="!overflow-visible pt-8 pb-12"
        >
          {chunks.map((chunk, ci) => (
            <SwiperSlide key={ci} className="overflow-visible">
              <div className="grid grid-cols-5 gap-6">
                {chunk.map((movie, i) => (
                  <Top10Card key={movie.id} movie={movie} rank={ci * 5 + i + 1} />
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default Top10Section;
