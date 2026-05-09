import { useState, useEffect, useRef } from 'react';
import { tmdbService } from '../services/tmdb';

const useHeroSlider = (movies) => {
  const [heroDetails, setHeroDetails] = useState({});
  const [heroIndex, setHeroIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const fetchingRef = useRef(new Set());

  useEffect(() => {
    if (!movies.length) return;
    const toFetch = [heroIndex, (heroIndex + 1) % movies.length].filter(
      i => movies[i] && !heroDetails[movies[i].id] && !fetchingRef.current.has(movies[i].id)
    );
    toFetch.forEach(async (i) => {
      const movie = movies[i];
      fetchingRef.current.add(movie.id);
      try {
        const details = await tmdbService.getMovieDetails(movie.id);
        setHeroDetails(prev => ({ ...prev, [movie.id]: { ...movie, ...details } }));
      } catch { } finally {
        fetchingRef.current.delete(movie.id);
      }
    });
  }, [heroIndex, movies]);

  const enriched = movies.map(m => heroDetails[m.id] || m);

  return { enriched, heroIndex, setHeroIndex, swiperInstance, setSwiperInstance };
};

export default useHeroSlider;
