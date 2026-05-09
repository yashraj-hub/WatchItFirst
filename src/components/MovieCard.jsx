import { memo, useState, useEffect } from 'react';
import { Play, Bookmark, BookmarkCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TMDB_CONFIG, tmdbService } from '../services/tmdb';
import { useAuth } from '../context/AuthContext';
import { saveToMyList, removeFromMyList, isInMyList } from '../services/firebase';

const MovieCard = memo(({ movie }) => {
  const navigate = useNavigate();
  const { user, checkCanPlay } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    isInMyList(user.uid, movie.id).then(setSaved);
  }, [user, movie.id]);

  const handlePlay = async (e) => {
    e.stopPropagation();
    const canPlay = await checkCanPlay();
    if (!canPlay) { alert('Your session has been ended. Please log in again.'); return; }
    try {
      const data = await tmdbService.getExternalIds(movie.id, movie.media_type || 'movie');
      if (data.imdb_id) navigate(`/watch/${data.imdb_id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!user) {
      console.warn('No user yet, cannot save');
      return;
    }
    try {
      if (saved) {
        await removeFromMyList(user.uid, movie.id);
        setSaved(false);
      } else {
        await saveToMyList(user.uid, {
          id: movie.id,
          title: movie.title || movie.name,
          poster_path: movie.poster_path,
          release_date: movie.release_date || movie.first_air_date,
          vote_average: movie.vote_average,
          media_type: movie.media_type || 'movie',
        });
        setSaved(true);
      }
    } catch (err) {
      console.error('Bookmark failed:', err);
    }
  };

  return (
    <div className="relative flex-shrink-0 w-full aspect-[2/3] group">
      {/* Poster */}
      <div
        onClick={() => navigate(`/details/${movie.id}`)}
        className="cursor-pointer rounded-lg overflow-hidden w-full h-full bg-[#1a1a1a] ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105"
      >
        <img
          src={movie.poster_path ? `${TMDB_CONFIG.w500}${movie.poster_path}` : '/placeholder.svg'}
          alt={movie.title || movie.name}
          className="w-full h-full object-cover group-hover:opacity-60 transition-opacity duration-300"
          loading="lazy"
          onError={(e) => { e.target.src = '/placeholder.svg'; }}
        />
      </div>

      {/* Bookmark button */}
      <button
        onClick={handleBookmark}
        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-xl border transition-all duration-200 opacity-0 group-hover:opacity-100 ${
          saved ? 'bg-red-600 border-red-500 text-white !opacity-100' : 'bg-black/80 border-white/30 text-white'
        }`}
        style={{ zIndex: 100 }}
      >
        {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      </button>

      {/* Play button */}
      <button
        onClick={handlePlay}
        className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200"
        style={{ zIndex: 100 }}
      >
        <Play className="w-4 h-4 fill-black text-black ml-0.5" />
      </button>

      {movie.vote_average > 0 && (
        <div className="absolute bottom-3 left-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ zIndex: 100 }}>
          <span className="text-[10px] font-bold text-red-400">{Math.round(movie.vote_average * 10)}%</span>
        </div>
      )}
    </div>
  );
});

MovieCard.displayName = 'MovieCard';
export default MovieCard;
