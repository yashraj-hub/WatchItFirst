import { useNavigate } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TMDB_CONFIG } from '../services/tmdb';
import { removeFromContinueWatching } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

const ContinueWatching = ({ items, onRemove }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleRemove = async (e, id) => {
    e.stopPropagation();
    if (user) await removeFromContinueWatching(user.uid, id);
    onRemove(id);
  };

  if (!items.length) return null;

  return (
    <div className="px-4 md:px-12 py-8">
      <p className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-500 mb-5">Continue Watching</p>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        <AnimatePresence>
          {items.map((movie) => (
            <motion.div
              key={movie.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={() => navigate(`/watch/${movie.imdb_id}`)}
              className="relative flex-shrink-0 w-36 md:w-44 cursor-pointer group"
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-red-500/50 transition-all duration-300 group-hover:scale-[1.03]">
                <img
                  src={movie.poster_path ? `${TMDB_CONFIG.w500}${movie.poster_path}` : '/placeholder.svg'}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xl">
                    <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                  <div className="h-full bg-red-600 w-1/3" />
                </div>
                <button
                  onClick={(e) => handleRemove(e, movie.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  style={{ zIndex: 10 }}
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
              <p className="mt-2 text-[10px] font-black uppercase tracking-tight text-gray-400 group-hover:text-white transition-colors line-clamp-1">
                {movie.title}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ContinueWatching;
