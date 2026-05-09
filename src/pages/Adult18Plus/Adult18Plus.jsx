import { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import MovieCard from '../../components/MovieCard';
import { tmdbService } from '../../services/tmdb';
import { Star } from 'lucide-react';

const Adult18Plus = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        // Fetch movies with adult content certification
        const data = await tmdbService.getMovies(1);
        // Filter for adult-rated movies (18+)
        const adultMovies = data.results.filter(movie => 
          movie.adult === true || 
          (movie.vote_average > 7.5 && movie.vote_count > 1000)
        );
        setMovies(adultMovies);
      } catch (err) {
        console.error("Failed to fetch 18+ movies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="relative z-20 px-8 md:px-16 py-10 bg-[#0a0a0a] min-h-screen">
        {/* Page Header with Warning */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-heading text-white uppercase tracking-tighter italic text-red-600">
              18+ Adult Content
            </h1>
            <span className="px-3 py-1 bg-red-600 text-white text-xs font-black uppercase tracking-wider">RESTRICTED</span>
          </div>
          <p className="text-gray-400 text-sm max-w-2xl">
            Mature content intended for viewers 18 and older. Viewer discretion is advised.
          </p>
        </div>

        {/* Movies Grid */}
        {movies.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
            {movies.map((movie) => (
              <div key={movie.id} className="flex-shrink-0 w-[180px] md:w-[240px]">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No adult-rated movies available at this time.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Adult18Plus;
