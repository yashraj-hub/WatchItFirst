import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DiscoveryAnimation = ({ movies, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationDuration, setAnimationDuration] = useState(6000); // 6 seconds total
  const [speed, setSpeed] = useState(200); // Initial interval speed in ms

  // Filter movies that have a logo or fallback to title
  const displayMovies = useMemo(() => {
    return movies
      .sort(() => Math.random() - 0.5)
      .slice(0, 40); // Take 40 random movies
  }, [movies]);

  useEffect(() => {
    if (displayMovies.length === 0) {
      onFinish();
      return;
    }

    let startTime = Date.now();
    let timeoutId;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / animationDuration;

      if (progress >= 1) {
        onFinish();
        return;
      }

      // High speed roulette
      let currentInterval = progress < 0.8 ? 80 : 150;

      setCurrentIndex(prev => (prev + 1) % displayMovies.length);
      timeoutId = setTimeout(tick, currentInterval);
    };

    timeoutId = setTimeout(tick, speed);

    return () => clearTimeout(timeoutId);
  }, [displayMovies, animationDuration, onFinish]);

  const currentMovie = displayMovies[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Liquid/Matter Background Circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 2.8], 
              opacity: [0, 0.25, 0],
            }}
            transition={{ 
              duration: 7, 
              repeat: Infinity, 
              delay: i * 1.4,
              ease: "easeOut" 
            }}
            className="absolute w-[450px] h-[450px] bg-white/20 rounded-full blur-2xl shadow-[0_0_50px_rgba(255,255,255,0.08)]"
          />
        ))}
        
        {/* Subtle Static Background Glow */}
        <div className="absolute w-[700px] h-[700px] bg-white/[0.03] rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        {currentMovie && (
          <motion.div
            key={currentMovie.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
            className="relative w-full max-w-4xl px-8 flex flex-col items-center justify-center h-48"
          >
            {currentMovie.logo_url ? (
              <img 
                src={currentMovie.logo_url} 
                alt={currentMovie.title} 
                className="max-w-full max-h-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              />
            ) : (
              <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter text-center">
                {currentMovie.title || currentMovie.name}
              </h1>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discovery Label */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-4">
        <div className="text-white/30 font-black text-[10px] uppercase tracking-[1em]">Discovering...</div>
      </div>
    </motion.div>
  );
};

export default DiscoveryAnimation;
