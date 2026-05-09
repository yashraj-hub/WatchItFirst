import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { tmdbService } from '../../services/tmdb';
import MainLayout from '../../layouts/MainLayout';
import GenreExplorerSection from '../../components/GenreExplorerSection';
import HeroSection from '../../components/HeroSection';
import Top10Section from '../../components/Top10Section';
import { motion, AnimatePresence } from 'framer-motion';
import { useSEO } from '../../hooks/useSEO';

const Bollywood = () => {
  useSEO({
    title: 'Bollywood Movies — Hindi Films',
    description: 'Explore the best Bollywood and Hindi movies by studio, era and genre on WatchItFirst. From classic hits to modern blockbusters.',
    url: '/bollywood',
  });
  const status = useSelector((state) => state.categories.status);

  const [trending, setTrending] = useState([]);
  const [heroMovies, setHeroMovies] = useState([]);
  const [pageSections, setPageSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await tmdbService.getBollywoodSyncData([28, 12, 35, 80, 18, 10751, 14, 27, 878, 53, 10749]);
        setTrending(data.trending);
        setHeroMovies(data.nowPlaying.slice(0, 5));
        setPageSections(data.genreSections);
        setTimeout(() => { setLoading(false); setTimeout(() => setShowContent(true), 500); }, 800);
      } catch (err) {
        console.error('Failed to fetch bollywood data:', err);
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <MainLayout>
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          {loading || (status === 'loading' && !heroMovies.length) ? (
            <div className="h-screen w-full bg-black flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <HeroSection movies={heroMovies} showContent={showContent} />

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 50 }}
                transition={{ duration: 1 }}
                className="relative z-20 pt-12 pb-10 -mt-40"
              >
                <Top10Section title="Bollywood Top 10 Trending" movies={trending} />
                <div className="relative mt-8 md:mt-12">
                  {pageSections.filter(s => s.isStudio).map((section) => (
                    <GenreExplorerSection key={section.id} section={section} isBollywood={true} />
                  ))}
                  {pageSections.filter(s => s.isEra).map((section) => (
                    <GenreExplorerSection key={section.id} section={section} isBollywood={true} />
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </MainLayout>
  );
};

export default Bollywood;
