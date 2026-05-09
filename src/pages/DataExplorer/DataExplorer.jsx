import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdbService } from '../../services/tmdb';

const DataExplorer = () => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [sections, setSections] = useState({}); // { genreId: { movies: [], page: 1, loading: false, total: 0 } }
  const [bollywood, setBollywood] = useState({ movies: [], page: 1, loading: false, total: 0 });
  const [globalLoading, setGlobalLoading] = useState(true);

  const targetGenreIds = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];

  const handleTitleClick = async (movie) => {
    try {
      const data = await tmdbService.getExternalIds(movie.id);
      if (data.imdb_id) {
        navigate(`/watch/${data.imdb_id}`);
      } else {
        alert("IMDb ID not found for this movie.");
      }
    } catch (err) {
      console.error("Failed to get IMDb ID:", err);
    }
  };

  useEffect(() => {
    const initExplorer = async () => {
      try {
        setGlobalLoading(true);
        const genresResponse = await tmdbService.getGenres();
        const filteredGenres = genresResponse.genres.filter(g => targetGenreIds.includes(g.id));
        setGenres(filteredGenres);

        // Initialize sections
        const initialSections = {};
        for (const g of filteredGenres) {
          initialSections[g.id] = { movies: [], page: 1, loading: true, total: 0 };
        }
        setSections(initialSections);

        // Fetch first page for each genre
        const genrePromises = filteredGenres.map(async (g) => {
          const data = await tmdbService.getMoviesByGenre(g.id, 1);
          return { id: g.id, movies: data.results, total: data.total_results };
        });

        // Fetch first page for Bollywood
        const bollywoodData = await tmdbService.getHindiMovies(1);
        setBollywood(prev => ({ 
          ...prev, 
          movies: bollywoodData.results, 
          total: bollywoodData.total_results,
          loading: false 
        }));

        const genreResults = await Promise.all(genrePromises);
        setSections(prev => {
          const updated = { ...prev };
          genreResults.forEach(res => {
            updated[res.id] = { 
              movies: res.movies, 
              total: res.total,
              page: 1, 
              loading: false 
            };
          });
          return updated;
        });

      } catch (err) {
        console.error("Init Explorer Error:", err);
      } finally {
        setGlobalLoading(false);
      }
    };
    initExplorer();
  }, []);

  const loadMoreGenre = async (genreId) => {
    const section = sections[genreId];
    if (section.loading) return;

    setSections(prev => ({
      ...prev,
      [genreId]: { ...prev[genreId], loading: true }
    }));

    try {
      const nextPage = section.page + 1;
      const data = await tmdbService.getMoviesByGenre(genreId, nextPage);
      setSections(prev => ({
        ...prev,
        [genreId]: {
          ...prev[genreId],
          movies: [...prev[genreId].movies, ...data.results],
          page: nextPage,
          loading: false
        }
      }));
    } catch (err) {
      console.error("Load More Genre Error:", err);
      setSections(prev => ({
        ...prev,
        [genreId]: { ...prev[genreId], loading: false }
      }));
    }
  };

  const loadMoreBollywood = async () => {
    if (bollywood.loading) return;
    setBollywood(prev => ({ ...prev, loading: true }));

    try {
      const nextPage = bollywood.page + 1;
      const data = await tmdbService.getHindiMovies(nextPage);
      setBollywood(prev => ({
        ...prev,
        movies: [...prev.movies, ...data.results],
        page: nextPage,
        loading: false
      }));
    } catch (err) {
      console.error("Load More Bollywood Error:", err);
      setBollywood(prev => ({ ...prev, loading: false }));
    }
  };

  const sortMoviesByYear = (movies) => {
    return [...movies].sort((a, b) => {
      const yearA = a.release_date?.split('-')[0] || '0';
      const yearB = b.release_date?.split('-')[0] || '0';
      return yearB.localeCompare(yearA);
    });
  };

  if (globalLoading) return <div className="p-10 font-mono text-black bg-white h-screen">Loading full movie archive...</div>;

  return (
    <div className="p-10 font-mono text-black bg-white min-h-screen">
      <h1 className="text-4xl font-bold mb-10 border-b-2 border-black pb-4">MOVIE DATA ARCHIVE</h1>

      {/* Bollywood Section */}
      <section className="mb-20">
        <div className="flex items-baseline gap-4 mb-6">
          <h2 className="text-2xl font-bold bg-black text-white p-2 inline-block uppercase">BOLLYWOOD / HINDI CINEMA</h2>
          <span className="text-gray-500 font-bold text-sm">TOTAL RECORDS: {bollywood.total.toLocaleString()}</span>
        </div>
        <div className="space-y-1 mb-6">
          {sortMoviesByYear(bollywood.movies).map((m, idx) => (
            <div key={`${m.id}-${idx}`} className="flex gap-4 border-b border-gray-100 py-1 group">
              <span className="text-gray-400 w-8 text-xs self-center">#{idx + 1}</span>
              <span className="font-bold w-16">[{m.release_date?.split('-')[0] || '????'}]</span>
              <span 
                onClick={() => handleTitleClick(m)}
                className="font-bold cursor-pointer hover:text-red-600 hover:underline transition-colors"
              >
                {m.title}
              </span>
              <span className="text-gray-400 text-[10px] ml-auto self-center">ID: {m.id}</span>
            </div>
          ))}
        </div>
        <button 
          onClick={loadMoreBollywood}
          disabled={bollywood.loading}
          className="px-4 py-2 border-2 border-black font-bold hover:bg-black hover:text-white transition uppercase text-sm"
        >
          {bollywood.loading ? "Loading..." : "Load More Bollywood Data"}
        </button>
      </section>

      {/* Genre Sections */}
      {genres.map(genre => {
        const section = sections[genre.id] || { movies: [], loading: false, total: 0 };
        return (
          <section key={genre.id} className="mb-20">
            <div className="flex items-baseline gap-4 mb-6">
              <h2 className="text-2xl font-bold border-l-8 border-black pl-4 uppercase">{genre.name}</h2>
              <span className="text-gray-500 font-bold text-sm">TAG: {genre.id} // TOTAL: {section.total.toLocaleString()}</span>
            </div>
            <div className="space-y-1 mb-6">
              {sortMoviesByYear(section.movies).map((m, idx) => (
                <div key={`${m.id}-${idx}`} className="flex gap-4 border-b border-gray-100 py-1 group">
                  <span className="text-gray-400 w-8 text-xs self-center">#{idx + 1}</span>
                  <span className="font-bold w-16">[{m.release_date?.split('-')[0] || '????'}]</span>
                  <span 
                    onClick={() => handleTitleClick(m)}
                    className="font-bold cursor-pointer hover:text-red-600 hover:underline transition-colors"
                  >
                    {m.title}
                  </span>
                  <span className="text-gray-400 text-[10px] ml-auto self-center">ID: {m.id}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => loadMoreGenre(genre.id)}
              disabled={section.loading}
              className="px-4 py-2 border-2 border-black font-bold hover:bg-black hover:text-white transition uppercase text-sm"
            >
              {section.loading ? "Loading..." : `Load More ${genre.name} Data`}
            </button>
          </section>
        );
      })}

      <footer className="mt-40 pt-10 border-t-4 border-black text-center font-bold text-sm uppercase">
        End of Document // White Mode Data Archive // All Rights Reserved
      </footer>
    </div>
  );
};

export default DataExplorer;

