import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Bookmark, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../../layouts/MainLayout';
import { TMDB_CONFIG, tmdbService } from '../../services/tmdb';
import { getMyList, removeFromMyList } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useSEO } from '../../hooks/useSEO';

const MyList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useSEO({ title: 'My List — Saved Movies', url: '/my-list' });

  useEffect(() => {
    if (!user) return;
    getMyList(user.uid).then(data => {
      setList(data);
      setLoading(false);
    });
  }, [user]);

  const handlePlay = async (e, movie) => {
    e.stopPropagation();
    try {
      const data = await tmdbService.getExternalIds(movie.id, movie.media_type || 'movie');
      if (data.imdb_id) navigate(`/watch/${data.imdb_id}`);
    } catch {}
  };

  const handleRemove = async (e, movie) => {
    e.stopPropagation();
    await removeFromMyList(user.uid, movie.id);
    setList(prev => prev.filter(m => String(m.id) !== String(movie.id)));
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#050505] px-4 md:px-12 pt-28 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-red-600 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white">My List</h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{list.length} Saved</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {list.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                    <Bookmark className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-2">Nothing saved yet</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                    Hover any movie card and click the bookmark icon to save it here
                  </p>
                </motion.div>
              ) : (
                <motion.div key="grid" className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-5">
                  {list.map((movie, i) => (
                    <motion.div
                      key={movie.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.03 } }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      onClick={() => navigate(`/details/${movie.id}`)}
                      className="group cursor-pointer relative aspect-[2/3]"
                    >
                      <div className="rounded-2xl overflow-hidden w-full h-full bg-white/5 border border-white/10 group-hover:border-red-500/50 transition-all duration-300 group-hover:scale-[1.03]">
                        <img
                          src={movie.poster_path ? `${TMDB_CONFIG.w500}${movie.poster_path}` : '/placeholder.svg'}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      {/* Hover buttons outside overflow-hidden */}
                      <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ zIndex: 50 }}>
                        <button
                          onClick={(e) => handlePlay(e, movie)}
                          className="flex-1 py-1.5 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-black" /> Play
                        </button>
                        <button
                          onClick={(e) => handleRemove(e, movie)}
                          className="w-8 h-8 rounded-xl bg-red-600/80 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-tight text-gray-400 group-hover:text-white transition-colors line-clamp-1">
                        {movie.title}
                      </p>
                      <p className="text-[9px] font-bold text-gray-600 mt-0.5 uppercase tracking-widest">
                        {(movie.release_date || '').split('-')[0]}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MyList;
