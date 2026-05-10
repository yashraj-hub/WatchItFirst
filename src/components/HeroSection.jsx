import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Navigation, Autoplay } from 'swiper/modules';
import HeroSlideContent from './HeroSlideContent';
import useHeroSlider from '../hooks/useHeroSlider';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';

const HeroSection = ({ movies, showContent }) => {
  const navigate = useNavigate();
  const { enriched, heroIndex, setHeroIndex, swiperInstance, setSwiperInstance } = useHeroSlider(movies);

  const handleSlideClick = () => {
    const current = enriched[heroIndex];
    if (current?.id) navigate(`/details/${current.id}`);
  };

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-[#0a0a0a] cursor-pointer"
      onClick={handleSlideClick}
    >
      <Swiper
        modules={[EffectFade, Navigation, Autoplay]}
        effect="fade"
        loop={true}
        autoplay={{ delay: 15000, disableOnInteraction: false }}
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
    </div>
  );
};

export default HeroSection;
