import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Navigation } from 'swiper/modules';
import HeroSlideContent from './HeroSlideContent';
import HeroLogoPagination from './HeroLogoPagination';
import useHeroSlider from '../hooks/useHeroSlider';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';

const HeroSection = ({ movies, showContent }) => {
  const navigate = useNavigate();
  const { enriched, heroIndex, setHeroIndex, swiperInstance, setSwiperInstance } = useHeroSlider(movies);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a0a0a]">
      <Swiper
        modules={[EffectFade, Navigation]}
        effect="fade"
        loop={true}
        onSwiper={setSwiperInstance}
        onSlideChange={(swiper) => setHeroIndex(swiper.realIndex)}
        className="h-full w-full hero-swiper"
      >
        {enriched.map((movie) => (
          <SwiperSlide key={movie.id}>
            {({ isActive }) => (
              <HeroSlideContent movie={movie} isActive={isActive} showContent={showContent} />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      <HeroLogoPagination
        movies={enriched}
        activeIndex={heroIndex}
        onSelect={(index) => swiperInstance?.slideToLoop(index)}
        onDoubleClick={(id) => navigate(`/details/${id}`)}
      />
    </div>
  );
};

export default HeroSection;
