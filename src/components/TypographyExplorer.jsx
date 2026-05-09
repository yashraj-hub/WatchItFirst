import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

const TypographyExplorer = ({ sections, isBollywood = false }) => {
  const navigate = useNavigate();

  // Filter only the standard genres (non-studio sections)
  const genres = useMemo(() => sections.filter(s => !s.isStudio), [sections]);

  // Generate stable styles for each genre
  const genreStyles = useMemo(() => {
    const sizes = [
      'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'
    ];
    const weights = ['font-light', 'font-normal', 'font-medium', 'font-bold', 'font-extrabold', 'font-black'];
    
    return genres.map((genre, index) => ({
      id: genre.id,
      size: sizes[Math.floor(Math.random() * sizes.length)],
      weight: weights[Math.floor(Math.random() * weights.length)],
      italic: Math.random() > 0.7,
      opacity: 0.4 + Math.random() * 0.6, // Random opacity between 0.4 and 1.0
      tracking: Math.random() > 0.5 ? 'tracking-tighter' : 'tracking-widest',
      margin: Math.floor(Math.random() * 2) + 1, // Reduced margin
    }));
  }, [genres]);

  return (
    <div className="px-4 md:px-16 py-12 md:py-20 bg-black border-t border-white/5 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* The "Brick" Container */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0 text-center leading-[0.9] md:leading-[0.8]">
          {genres.map((genre, index) => {
            const style = genreStyles[index];
            return (
              <motion.span
                key={genre.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: style.opacity }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.02 }}
                onClick={() => navigate(`/movies?genreId=${genre.id}&genreName=${genre.name}${isBollywood ? '&lang=hi&pageType=bollywood' : ''}`)}
                className={`
                  inline-block
                  cursor-pointer 
                  uppercase 
                  transition-all 
                  duration-300 
                  hover:!opacity-100 
                  hover:text-red-600 
                  hover:scale-110
                  hover:z-10
                  text-white
                  ${style.size} 
                  ${style.weight}
                  ${style.italic ? 'italic' : ''}
                  ${style.tracking}
                  px-2
                `}
                style={{ 
                  marginTop: `${style.margin}px`,
                  marginBottom: `${style.margin}px`
                }}
              >
                {genre.name}
              </motion.span>
            );
          })}
        </div>
      </div>
      
      {/* Decorative vertical line */}
      <div className="mt-32 flex justify-center">
        <div className="w-px h-24 bg-gradient-to-b from-red-600 to-transparent opacity-20" />
      </div>
    </div>
  );
};

export default TypographyExplorer;
