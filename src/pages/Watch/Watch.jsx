import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Info } from 'lucide-react';
import { tmdbService } from '../../services/tmdb';

const Watch = () => {
  const { imdbId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');

  useEffect(() => {
    tmdbService.findByImdbId(imdbId)
      .then(data => {
        const result = data?.movie_results?.[0] || data?.tv_results?.[0];
        if (result) {
          setTitle(result.title || result.name);
        }
      })
      .catch(() => {});
  }, [imdbId]);

  const playerUrl = `https://streamimdb.ru/embed/movie/${imdbId}`;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      {/* Top Header - Minimal & Floating */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 p-2 hover:bg-white/10 rounded-full transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-300 mb-0.5">Now Playing</span>
            <h1 className="text-sm font-semibold uppercase opacity-80">{title || 'Loading...'}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Player Area - Full Screen Cinematic */}
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="relative w-full h-full max-w-[1920px] mx-auto overflow-hidden">
          <iframe
            src={playerUrl}
            className="absolute inset-0 w-full h-full border-none"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title="Movie Player"
          />
        </div>
      </div>
    </div>
  );
};

export default Watch;
