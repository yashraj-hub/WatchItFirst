import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { tmdbService, TMDB_CONFIG } from '../services/tmdb';

const FranchiseExplorer = () => {
  const navigate = useNavigate();
  const [franchiseData, setFranchiseData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Legendary collection IDs and representative movie IDs for fallback
  const collections = useMemo(() => [
    { id: 1241, movie_id: 671, name: 'Harry Potter', query: 'Harry Potter' },
    { id: 119, movie_id: 120, name: 'Lord of the Rings', query: 'Lord of the Rings' },
    { id: 10, movie_id: 11, name: 'Star Wars', query: 'Star Wars' },
    { id: 131239, movie_id: 299534, name: 'Avengers', query: 'Avengers' },
    { id: 328, movie_id: 329, name: 'Jurassic Park', query: 'Jurassic Park' },
    { id: 87096, movie_id: 19995, name: 'Avatar', query: 'Avatar' },
    { id: 645, movie_id: 37724, name: 'James Bond', query: 'James Bond' },
    { id: 263, movie_id: 155, name: 'The Dark Knight', query: 'The Dark Knight' },
    { id: 295, movie_id: 58, name: 'Pirates of the Caribbean', query: 'Pirates of the Caribbean' },
    { id: 9485, movie_id: 385687, name: 'Fast & Furious', query: 'Fast & Furious' },
    { id: 8650, movie_id: 1858, name: 'Transformers', query: 'Transformers' },
    { id: 531241, movie_id: 557, name: 'Spider-Man', query: 'Spider-Man' },
    { id: 121938, movie_id: 49051, name: 'The Hobbit', query: 'The Hobbit' },
  ], []);

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const results = await Promise.all(
          collections.map(async (c) => {
            try {
              // 1. Try Collection Images
              let images = await tmdbService.getCollectionImages(c.id);
              let logo = images.logos?.find(l => l.iso_639_1 === 'en' || !l.iso_639_1);

              // 2. Fallback to representative Movie Images if collection logo is missing
              if (!logo && c.movie_id) {
                const movieImages = await tmdbService.getMovieImages(c.movie_id);
                logo = movieImages.logos?.find(l => l.iso_639_1 === 'en' || !l.iso_639_1);
              }
              
              return {
                ...c,
                logoPath: logo ? logo.file_path : null,
                // Random styles for the brick
                scale: 0.8 + Math.random() * 0.4,
                opacity: 0.3 + Math.random() * 0.4,
                margin: Math.floor(Math.random() * 20) - 10,
                rotate: Math.floor(Math.random() * 6) - 3,
              };
            } catch (err) {
              console.warn(`Failed to fetch logo for ${c.name}`, err);
              return {
                ...c,
                logoPath: null,
                scale: 1,
                opacity: 0.5,
                margin: 0,
                rotate: 0
              };
            }
          })
        );
        setFranchiseData(results);
      } catch (err) {
        console.error("Failed to fetch franchise logos", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogos();
  }, [collections]);

  if (loading) return null;

  return (
    <div className="px-4 md:px-16 py-32 bg-black border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-16">
          {franchiseData.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: item.opacity }}
              whileHover={{ 
                opacity: 1, 
                scale: 1.2, 
                rotate: 0,
                filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))' 
              }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.05 }}
              onClick={() => navigate(`/search?q=${encodeURIComponent(item.query)}`)}
              className="cursor-pointer transition-all duration-500"
              style={{ 
                marginTop: `${item.margin}px`,
                transform: `rotate(${item.rotate}deg) scale(${item.scale})`
              }}
            >
              {item.logoPath ? (
                <img 
                  src={`${TMDB_CONFIG.original}${item.logoPath}`} 
                  alt={item.name}
                  className="h-10 md:h-16 lg:h-24 w-auto object-contain"
                />
              ) : (
                <span className="text-xl md:text-3xl font-black uppercase tracking-tighter italic text-white/30 hover:text-red-600 transition-colors">
                  {item.name}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FranchiseExplorer;
