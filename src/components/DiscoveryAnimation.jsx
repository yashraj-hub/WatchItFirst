import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';

const DiscoveryAnimation = ({ movies, onFinish }) => {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('fast');
  const [glowColor, setGlowColor] = useState('255,255,255');
  const elapsedRef = useRef(0);
  const canvasRef = useRef(null);
  const completedRef = useRef(false);
  const currentMovieRef = useRef(null);
  const totalDuration = 4000;

  const displayMovies = useMemo(() => {
    const base = [...movies].sort(() => Math.random() - 0.5).slice(0, 20);
    return [...base, ...base, ...base];
  }, [movies]);

  useEffect(() => {
    if (displayMovies.length === 0) { onFinish(); return; }
    if (completedRef.current) return;
    
    completedRef.current = false;
    elapsedRef.current = 0;
    
    let timeoutId;

    const tick = (interval) => {
      elapsedRef.current += interval;
      const progress = elapsedRef.current / totalDuration;

      if (progress >= 1) {
        if (completedRef.current) return;
        completedRef.current = true;
        setPhase('locked');
        const finalMovie = currentMovieRef.current || displayMovies[0];
        timeoutId = setTimeout(() => {
          onFinish(finalMovie);
        }, 900);
        return;
      }

      let next;
      if (progress < 0.5) { next = 100; setPhase('fast'); }
      else if (progress < 0.8) { next = 100 + ((progress - 0.5) / 0.3) * 350; setPhase('slowing'); }
      else { next = 450 + ((progress - 0.8) / 0.2) * 600; setPhase('slowing'); }

      setIndex(prev => (prev + 1) % displayMovies.length);
      timeoutId = setTimeout(() => tick(next), next);
    };

    timeoutId = setTimeout(() => tick(100), 100);
    return () => clearTimeout(timeoutId);
  }, [displayMovies, onFinish]);

  const get = (offset) => displayMovies[(index + offset + displayMovies.length) % displayMovies.length];
  const prev = get(-1);
  const curr = get(0);
  const next = get(1);

  // Track the current movie for when the animation completes
  useEffect(() => {
    currentMovieRef.current = curr;
  }, [curr]);

  useEffect(() => {
    if (!curr?.logo_url) {
      setGlowColor('255,255,255');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = curr.logo_url;

    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvasRef.current = canvas;
      const ctx = canvas.getContext('2d');
      const width = 80;
      const height = 80;
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const data = ctx.getImageData(0, 0, width, height).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 50) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }

        if (count > 0) {
          setGlowColor(`${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)}`);
        } else {
          setGlowColor('255,255,255');
        }
      } catch {
        setGlowColor('255,255,255');
      }
    };

    img.onerror = () => setGlowColor('255,255,255');
  }, [curr?.logo_url]);

  const speed = phase === 'fast' ? 0.06 : phase === 'slowing' ? 0.2 : 0.5;

  const LogoOrText = ({ movie, size, opacity, glow }) => {
    if (!movie) return null;
    return movie.logo_url ? (
      <img
        src={movie.logo_url}
        alt={movie.title}
        className="object-contain"
        style={{
          maxHeight: size,
          maxWidth: '100%',
          opacity,
          filter: glow
            ? `drop-shadow(0 0 24px rgba(${glowColor},0.8)) drop-shadow(0 0 50px rgba(${glowColor},0.4))`
            : `drop-shadow(0 0 6px rgba(${glowColor},0.15))`,
          transition: `all ${speed}s ease`,
        }}
      />
    ) : (
      <p
        className="font-black uppercase tracking-tighter text-center leading-none"
        style={{
          fontSize: size * 0.4,
          color: `rgba(${glowColor},${opacity})`,
          textShadow: glow ? `0 0 30px rgba(${glowColor},0.6)` : 'none',
          transition: `all ${speed}s`,
        }}
      >
        {movie.title || movie.name}
      </p>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(${glowColor},0.14) 0%, transparent 65%)` }}
      />

      {/* Rings */}
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="absolute rounded-full border border-white/5"
          animate={{ scale: [0.5, 2.5], opacity: [0.3, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: 'easeOut' }}
          style={{ width: 500, height: 500 }}
        />
      ))}

      {/* Three logos centered */}
      <div className="flex items-center justify-center gap-12 w-full px-8">

        {/* Left logo */}
        <div className="flex items-center justify-center" style={{ width: 180, height: 80 }}>
          <LogoOrText movie={prev} size={60} opacity={0.2} glow={false} />
        </div>

        {/* Center logo — bigger & brighter */}
        <div className="flex items-center justify-center" style={{ width: 280, height: 120 }}>
          <LogoOrText movie={curr} size={100} opacity={1} glow={phase === 'locked'} />
        </div>

        {/* Right logo */}
        <div className="flex items-center justify-center" style={{ width: 180, height: 80 }}>
          <LogoOrText movie={next} size={60} opacity={0.2} glow={false} />
        </div>

      </div>

      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-32 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #050505 20%, transparent)' }} />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-32 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #050505 20%, transparent)' }} />

      {/* Progress bar */}
      <div className="absolute bottom-16 w-40 h-px bg-white/10 rounded-full overflow-hidden">
        <motion.div className="h-full bg-white/40 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: phase === 'locked' ? '100%' : '80%' }}
          transition={{ duration: 4, ease: 'easeInOut' }}
        />
      </div>

      {/* Label */}
      <div className="absolute bottom-10 flex justify-center w-full">
        <motion.p
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[9px] font-black uppercase tracking-[0.5em] text-white/40"
        >
          {phase === 'locked' ? 'Found' : 'Discovering'}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default DiscoveryAnimation;
