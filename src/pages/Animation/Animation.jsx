import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { tmdbService } from '../../services/tmdb';
import MainLayout from '../../layouts/MainLayout';
import GenreExplorerSection from '../../components/GenreExplorerSection';
import HeroSection from '../../components/HeroSection';
import Top10Section from '../../components/Top10Section';
import { motion, AnimatePresence } from 'framer-motion';

const Animation = () => {
  const status = useSelector((state) => state.categories.status);

  const [trending, setTrending] = useState([]);
  const [heroMovies, setHeroMovies] = useState([]);
  const [pageSections, setPageSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await tmdbService.getAnimationSyncData();
        setTrending(data.trending);
        setHeroMovies(data.nowPlaying.slice(0, 5));
        setPageSections(data.genreSections);
        setTimeout(() => { setLoading(false); setTimeout(() => setShowContent(true), 100); }, 800);
      } catch (err) {
        console.error('Failed to fetch animation data:', err);
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
                <Top10Section title="Top Trending Animation" movies={trending} />
                <div className="relative mt-8 md:mt-12">
                  {pageSections.filter(s => s.isStudio).map((section) => (
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

export default Animation;
