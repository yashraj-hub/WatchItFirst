import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Bookmark, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '../../layouts/MainLayout';
import { TMDB_CONFIG, tmdbService } from '../../services/tmdb';
import { getMyList, toggleMyList } from '../../hooks/useUserData';
import { useSEO } from '../../hooks/useSEO';

const MyList = () => {
  const [list, setList] = useState(() => getMyList());
  const navigate = useNavigate();

  useSEO({
    title: 'My List — Saved Movies',
    description: 'Your personal saved movies and TV shows collection on WatchItFirst.',
    url: '/my-list',
  });

  useEffect(() => {
    setList(getMyList());
  }, []);

  const handlePlay = async (e, movie) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = await tmdbService.getExternalIds(movie.id, movie.media_type || 'movie');
      if (data.imdb_id) navigate(`/watch/${data.imdb_id}`);
    } catch {}
  };

  const handleRemove = (e, movie) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMyList(movie);
    setList(getMyList());
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
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-red-500/50 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                      <img
                        src={movie.poster_path ? `${TMDB_CONFIG.w500}${movie.poster_path}` : '/placeholder.svg'}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                        <div className="flex gap-2 mb-2">
                          <button
                            onPointerDown={(e) => handlePlay(e, movie)}
                            className="flex-1 py-1.5 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-black" /> Play
                          </button>
                          <button
                            onPointerDown={(e) => handleRemove(e, movie)}
                            className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
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
        </div>
      </div>
    </MainLayout>
  );
};

export default MyList;
