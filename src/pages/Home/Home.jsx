import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import MainLayout from '../../layouts/MainLayout';
import GenreExplorerSection from '../../components/GenreExplorerSection';
import HeroSection from '../../components/HeroSection';
import Top10Section from '../../components/Top10Section';
import { motion, AnimatePresence } from 'framer-motion';
import { useSEO } from '../../hooks/useSEO';

const Home = () => {
  useSEO({
    title: 'Home — Discover Movies & TV Shows',
    description: 'Browse trending movies, top 10 charts, Hollywood studios and more on WatchItFirst.',
    url: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'WatchItFirst Home',
      url: 'https://watchitfirst.onrender.com/',
      description: 'Browse trending movies, top 10 charts, Hollywood studios and more.',
    },
  });
  const genreSections = useSelector((state) => state.categories.genreSections);
  const trending = useSelector((state) => state.categories.trending);
  const nowPlaying = useSelector((state) => state.categories.nowPlaying);
  const status = useSelector((state) => state.categories.status);

  const [heroMovies, setHeroMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (nowPlaying.length > 0 && heroMovies.length === 0) {
      setHeroMovies(nowPlaying.slice(0, 5));
      setLoading(false);
      setTimeout(() => setShowContent(true), 100);
    }
  }, [nowPlaying]);

  return (
    <MainLayout>
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          {loading || status === 'loading' ? (
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
                <Top10Section title="Global Top 10 Spotlight" movies={trending} />
                <div className="relative mt-8 md:mt-12">
                  {genreSections.filter(s => s.isStudio).map((section) => (
                    <GenreExplorerSection key={section.id} section={section} />
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

export default Home;
