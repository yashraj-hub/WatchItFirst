import { useReducer, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdbService, TMDB_CONFIG } from '../../services/tmdb';
import MainLayout from '../../layouts/MainLayout';
import MovieCard from '../../components/MovieCard';
import { Play, Star, Clock, Calendar, Globe, Award, ChevronRight, Users, ArrowLeft, Bookmark, BookmarkCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { saveToMyList, removeFromMyList, isInMyList, saveContinueWatching } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useSEO } from '../../hooks/useSEO';

const initialDetailsState = {
  movie: null,
  loading: true,
  showTrailer: false,
};

function detailsReducer(state, action) {
  switch (action.type) {
    case 'start':
      return { ...state, loading: true, showTrailer: false };
    case 'loaded':
      return { ...state, movie: action.movie };
    case 'showTrailer':
      return { ...state, showTrailer: true };
    case 'loadedComplete':
      return { ...state, loading: false };
    default:
      return state;
  }
}

const MovieDetails = () => {
  const { id } = useParams();
  const [state, dispatch] = useReducer(detailsReducer, initialDetailsState);
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { movie, loading, showTrailer } = state;

  useEffect(() => {
    if (!user) return;
    isInMyList(user.uid, id).then(setSaved);
  }, [user, id]);

  useEffect(() => {
    dispatch({ type: 'start' });
    window.scrollTo(0, 0);

    tmdbService.getMovieDetails(id)
      .then(data => dispatch({ type: 'loaded', movie: data }))
      .catch(err => console.error('Failed to fetch details:', err))
      .finally(() => dispatch({ type: 'loadedComplete' }));

    const timer = setTimeout(() => dispatch({ type: 'showTrailer' }), 5000);
    return () => clearTimeout(timer);
  }, [id]);


  // All hooks must be called before any conditional return
  const director = movie?.credits?.crew?.find(p => p.job === 'Director');
  const topCast = movie?.credits?.cast?.slice(0, 10);

  useSEO({
    title: movie ? `${movie.title} (${movie.release_date?.split('-')[0]})` : 'Movie Details',
    description: movie?.overview || 'Watch on WatchItFirst.',
    image: movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    url: `/details/${id}`,
    jsonLd: movie ? {
      '@context': 'https://schema.org',
      '@type': 'Movie',
      name: movie.title,
      description: movie.overview,
      datePublished: movie.release_date,
      image: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      aggregateRating: movie.vote_average > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: movie.vote_average.toFixed(1),
        bestRating: '10',
        ratingCount: movie.vote_count,
      } : undefined,
      director: director ? { '@type': 'Person', name: director.name } : undefined,
      actor: topCast?.slice(0, 5).map(p => ({ '@type': 'Person', name: p.name })),
      genre: movie.genres?.map(g => g.name),
      duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    } : undefined,
  });

  const handlePlay = () => {
    if (movie?.external_ids?.imdb_id) {
      if (user) {
        saveContinueWatching(user.uid, {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          media_type: 'movie',
          imdb_id: movie.external_ids.imdb_id,
        });
      }
      navigate(`/watch/${movie.external_ids.imdb_id}`);
    } else {
      alert('IMDb ID not found.');
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    if (saved) {
      await removeFromMyList(user.uid, movie.id);
      setSaved(false);
    } else {
      await saveToMyList(user.uid, {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        media_type: 'movie',
      });
      setSaved(true);
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const writers = movie?.credits?.crew?.filter(p => p.job === 'Writer' || p.job === 'Screenplay')?.slice(0, 3);
  const logoPath = movie?.images?.logos?.[0]?.file_path;
  const trailerKey = movie?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key;
  const recommendations = movie?.recommendations?.results?.slice(0, 12) || [];
  const productionCompanies = movie?.production_companies?.filter(c => c.logo_path) || [];

  return (
    <MainLayout>
      <div className="relative h-[50vh] overflow-hidden">
        <img src={`${TMDB_CONFIG.original}${movie?.poster_path}`} className="absolute inset-0 w-full h-full object-cover" alt="" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-16 left-4 md:top-20 md:left-12 z-20 w-9 h-9 rounded-full bg-black/40 border border-white/10 text-gray-300 hover:text-white hover:bg-black/70 transition-all backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {trailerKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showTrailer ? 1 : 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 pointer-events-none"
          >
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&showinfo=0&rel=0`}
              className="absolute w-[300%] h-[300%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              allow="autoplay"
              title="trailer"
            />
          </motion.div>
        )}

        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            {logoPath ? (
              <img src={`${TMDB_CONFIG.original}${logoPath}`} alt={movie?.title} className="max-h-24 md:max-h-36 mx-auto object-contain drop-shadow-2xl" />
            ) : (
              <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic text-white drop-shadow-2xl text-center px-4">
                {movie?.title}
              </h1>
            )}
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 bg-black px-4 md:px-16 lg:px-24 py-14 space-y-14">

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">{movie?.title}</h1>
            <button onClick={handlePlay} className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform active:scale-95 shadow-xl">
              <Play className="w-5 h-5 fill-black text-black ml-0.5" />
            </button>
            <button
              onClick={handleBookmark}
              className={`flex-shrink-0 w-12 h-12 rounded-full border flex items-center justify-center hover:scale-110 transition-transform active:scale-95 ${
                saved ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-white/5 border-white/10 text-gray-400 hover:border-red-500/50'
              }`}
              title={saved ? 'Remove from My List' : 'Add to My List'}
            >
              {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-gray-400">
            <span className="flex items-center gap-1.5 text-yellow-400"><Star className="w-4 h-4 fill-yellow-400" />{movie?.vote_average?.toFixed(1)}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-red-500" />{movie?.release_date?.split('-')[0]}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-red-500" />{movie?.runtime} min</span>
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-red-500" />{movie?.spoken_languages?.[0]?.english_name || 'N/A'}</span>
            <span className="px-2 py-0.5 border border-white/10 text-gray-400 text-xs uppercase tracking-widest rounded">{movie?.status}</span>
          </div>
          <p className="mt-3 text-xs uppercase tracking-widest text-gray-600 font-bold">{movie?.genres?.map(g => g.name).join(' · ')}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-3 flex items-center gap-2">Synopsis <ChevronRight className="w-3 h-3" /></h2>
          <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-4xl">{movie?.overview}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid md:grid-cols-2 gap-8 border-t border-white/5 pt-10">
          {director && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Director</p>
              <p className="text-xl font-black text-white italic">{director.name}</p>
            </div>
          )}
          {writers?.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Writers</p>
              <p className="text-xl font-black text-white italic">{writers.map(w => w.name).join(', ')}</p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-6 flex items-center gap-2">Top Cast <Users className="w-3 h-3" /></h2>
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
            {topCast?.map(person => (
              <button key={person.id} type="button" onClick={() => navigate(`/movies?personId=${person.id}&personName=${encodeURIComponent(person.name)}`)} className="flex-shrink-0 w-24 group text-center focus:outline-none">
                <div className="aspect-square rounded-full overflow-hidden mb-2 ring-2 ring-white/5 group-hover:ring-red-600 transition-all grayscale group-hover:grayscale-0">
                  <img src={person.profile_path ? `${TMDB_CONFIG.w500}${person.profile_path}` : 'https://via.placeholder.com/300x300?text=?'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={person.name} />
                </div>
                <p className="text-xs font-black text-white line-clamp-1">{person.name}</p>
                <p className="text-[9px] font-bold text-gray-500 line-clamp-1 uppercase tracking-tighter mt-0.5">{person.character}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {productionCompanies.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-6">Production</h2>
            <div className="flex flex-wrap items-center gap-8">
              {productionCompanies.map(company => (
                <div key={company.id} className="group">
                  <img src={`${TMDB_CONFIG.w500}${company.logo_path}`} alt={company.name} className="h-8 md:h-10 object-contain opacity-50 group-hover:opacity-100 transition-opacity duration-300" style={{ filter: 'invert(1)' }} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-3 gap-8 py-10 border-y border-white/5">
          {[
            { label: 'Budget', value: movie?.budget > 0 ? `$${(movie.budget / 1e6).toFixed(1)}M` : 'N/A' },
            { label: 'Revenue', value: movie?.revenue > 0 ? `$${(movie.revenue / 1e6).toFixed(1)}M` : 'N/A' },
            { label: 'Popularity', value: Math.round(movie?.popularity), icon: <Award className="w-4 h-4 text-red-500" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
              <p className="font-bold flex items-center gap-1.5">{icon}{value}</p>
            </div>
          ))}
        </motion.div>

        {recommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-8">More Like This</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
              {recommendations.map(m => <MovieCard key={m.id} movie={m} />)}
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
};

export default MovieDetails;
