import { memo } from 'react';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TMDB_CONFIG, tmdbService } from '../services/tmdb';

const MovieCard = memo(({ movie }) => {
  const navigate = useNavigate();

  const handlePlay = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = await tmdbService.getExternalIds(movie.id, movie.media_type || 'movie');
      if (data.imdb_id) navigate(`/watch/${data.imdb_id}`);
    } catch (err) {
      console.error('Failed to get IMDb ID:', err);
    }
  };

  const handleCardClick = (e) => {
    e.stopPropagation();
    navigate(`/details/${movie.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative flex-shrink-0 cursor-pointer group rounded-lg overflow-hidden aspect-[2/3] w-full bg-[#1a1a1a] ring-1 ring-white/10 hover:scale-105 transition-transform duration-300"
    >
      <img
        src={movie.poster_path ? `${TMDB_CONFIG.w500}${movie.poster_path}` : '/placeholder.svg'}
        alt={movie.title || movie.name}
        className="w-full h-full object-cover transition duration-500 group-hover:opacity-50"
        loading="lazy"
        onError={(e) => { e.target.src = '/placeholder.svg'; }}
      />

      <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black via-black/60 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onPointerDown={handlePlay}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-110 transition active:scale-95 z-20"
          >
            <Play className="w-4 h-4 fill-black text-black ml-0.5" />
          </button>
        </div>
        {movie.vote_average > 0 && (
          <p className="text-[10px] font-bold text-red-500 mb-1">{Math.round(movie.vote_average * 10)}% Match</p>
        )}
        <h3 className="text-xs font-heading truncate uppercase tracking-tight">
          {movie.title || movie.name}
        </h3>
      </div>
    </div>
  );
});

MovieCard.displayName = 'MovieCard';
export default MovieCard;
