import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Info, Maximize } from 'lucide-react';
import { tmdbService } from '../../services/tmdb';
import { saveContinueWatching } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

const Watch = () => {
  const { imdbId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [logoPath, setLogoPath] = useState(null);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    tmdbService.findByImdbId(imdbId)
      .then(async data => {
        const result = data?.movie_results?.[0] || data?.tv_results?.[0];
        const mediaType = data?.movie_results?.[0] ? 'movie' : 'tv';
        if (result) {
          setTitle(result.title || result.name);
          // Fetch logo
          try {
            const images = await tmdbService.getMovieImages(result.id);
            const logo = images?.logos?.find(l => l.iso_639_1 === 'en') || images?.logos?.[0];
            if (logo) setLogoPath(logo.file_path);
          } catch {}
          if (user) {
            saveContinueWatching(user.uid, {
              id: result.id,
              title: result.title || result.name,
              poster_path: result.poster_path,
              release_date: result.release_date || result.first_air_date,
              vote_average: result.vote_average,
              media_type: mediaType,
              imdb_id: imdbId,
            });
          }
        }
      })
      .catch(() => {});
  }, [imdbId]);

  // Auto fullscreen + landscape on mobile
  useEffect(() => {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (!isMobile) return;

    const enterFullscreenLandscape = async () => {
      try {
        const el = containerRef.current;
        if (el?.requestFullscreen) await el.requestFullscreen();
        else if (el?.webkitRequestFullscreen) await el.webkitRequestFullscreen();

        // Lock orientation to landscape after fullscreen
        if (screen.orientation?.lock) {
          await screen.orientation.lock('landscape');
        }
      } catch {
        // Browser may block without user gesture — handled by manual button below
      }
    };

    // Small delay to let the page render first
    const timer = setTimeout(enterFullscreenLandscape, 600);
    return () => {
      clearTimeout(timer);
      // Unlock orientation when leaving
      try { screen.orientation?.unlock?.(); } catch {}
    };
  }, []);

  const handleManualFullscreen = async () => {
    try {
      const el = containerRef.current;
      if (el?.requestFullscreen) await el.requestFullscreen();
      else if (el?.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      if (screen.orientation?.lock) await screen.orientation.lock('landscape');
    } catch {}
  };

  const playerUrl = `https://streamimdb.ru/embed/movie/${imdbId}`;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      {/* Top Header */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 p-2 hover:bg-white/10 rounded-full transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
          </button>
          <div className="flex flex-col justify-center">
            {logoPath ? (
              <img
                src={`https://image.tmdb.org/t/p/original${logoPath}`}
                alt={title}
                className="h-7 md:h-9 w-auto object-contain object-left drop-shadow-lg"
              />
            ) : (
              <h1 className="text-sm font-semibold uppercase opacity-80">{title || 'Loading...'}</h1>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Manual fullscreen button — visible on mobile */}
          <button
            onClick={handleManualFullscreen}
            className="md:hidden p-2.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            title="Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Player */}
      <div ref={containerRef} className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="relative w-full h-full max-w-[1920px] mx-auto overflow-hidden">
          <iframe
            ref={iframeRef}
            src={playerUrl}
            className="absolute inset-0 w-full h-full border-none"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            title="Movie Player"
          />
        </div>
      </div>
    </div>
  );
};

export default Watch;
