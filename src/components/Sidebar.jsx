import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Video, Sparkles, Star, Film, LayoutGrid, Search } from 'lucide-react';
import { fetchPageGenres, selectPageGenres } from '../store';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const genreSections = useSelector((state) => state.categories.genreSections);
  const bollywoodGenres = useSelector(selectPageGenres('bollywood'));
  const animationGenres = useSelector(selectPageGenres('animation'));
  const bollywoodGenresLoading = useSelector((state) => state.pageGenres.loading.bollywood);
  const animationGenresLoading = useSelector((state) => state.pageGenres.loading.animation);

  const queryParams = new URLSearchParams(location.search);
  const pageTypeParam = queryParams.get('pageType');

  const isBollywoodPage = location.pathname.startsWith('/bollywood') || pageTypeParam === 'bollywood';
  const isAnimationPage = location.pathname.startsWith('/animation') || pageTypeParam === 'animation';

  const initialZone = isBollywoodPage ? 'bollywood' : isAnimationPage ? 'animation' : 'default';
  const [selectedZone, setSelectedZone] = useState(initialZone);

  // Sync selectedZone with URL changes
  useEffect(() => {
    setSelectedZone(initialZone);
  }, [initialZone]);

  const englishGenres = useMemo(() => genreSections.filter(s => !s.isStudio), [genreSections]);
  
  const categories = useMemo(() => {
    if (selectedZone === 'bollywood') return bollywoodGenres;
    if (selectedZone === 'animation') return animationGenres;
    return englishGenres;
  }, [selectedZone, bollywoodGenres, animationGenres, englishGenres]);

  const categoriesLoading =
    (selectedZone === 'bollywood' && bollywoodGenresLoading) ||
    (selectedZone === 'animation' && animationGenresLoading);

  useEffect(() => {
    if (selectedZone !== 'default') {
      dispatch(fetchPageGenres(selectedZone));
    }
  }, [selectedZone, dispatch]);

  const handleGenreClick = (genre) => {
    const params = new URLSearchParams({ genreId: String(genre.id), genreName: genre.name });
    if (genre.isStudio) params.set('isStudio', 'true');
    if (genre.isEra) {
      params.set('isEra', 'true');
      if (genre.startYear) params.set('startYear', String(genre.startYear));
      if (genre.endYear) params.set('endYear', String(genre.endYear));
      params.set('pageType', selectedZone === 'bollywood' ? 'bollywood' : selectedZone === 'animation' ? 'animation' : 'default');
    }
    if (genre.isDirector) params.set('isDirector', 'true');
    if (selectedZone === 'bollywood') { params.set('lang', 'hi'); params.set('pageType', 'bollywood'); }
    else if (selectedZone === 'animation') { params.set('pageType', 'animation'); }
    navigate(`/movies?${params.toString()}`);
  };

  const zones = [
    { id: 'bollywood', label: 'Bollywood', icon: <Video className="w-4 h-4" />, path: '/bollywood' },
    { id: 'default', label: 'Hollywood', icon: <Film className="w-4 h-4" />, path: '/' },
    { id: 'animation', label: 'Animation', icon: <Sparkles className="w-4 h-4" />, path: '/animation' },
  ];

  return (
    <aside className="hidden lg:flex w-64 h-screen fixed left-0 top-0 bg-[#070707] border-r border-white/5 flex-col z-[110] overflow-hidden">
      {/* Logo Area */}
      <div className="p-8">
        <Link to="/" className="text-2xl font-black tracking-tighter text-white uppercase hover:text-red-600 transition-colors duration-300">
          WatchItFirst
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-8 space-y-8">
        {/* Zone Selector */}
        <div>
          <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-500 mb-4 px-3">Zones</p>
          <div className="space-y-1">
            {zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => {
                  setSelectedZone(zone.id);
                  navigate(zone.path);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 group ${
                  selectedZone === zone.id
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`transition-transform duration-300 ${selectedZone === zone.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {zone.icon}
                </span>
                {zone.label}
              </button>
            ))}
          </div>
        </div>

        {/* For You */}
        <div>
          <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-500 mb-4 px-3">Personalized</p>
          <Link
            to="/recommendations"
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 group ${
              location.pathname === '/recommendations'
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Star className={`w-4 h-4 transition-transform duration-300 ${location.pathname === '/recommendations' ? 'text-yellow-500 scale-110' : 'group-hover:scale-110 group-hover:text-yellow-500'}`} />
            For You
          </Link>
        </div>

        {/* Categories */}
        <div>
          <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-500 mb-4 px-3">
            {selectedZone === 'bollywood' ? 'Bollywood' : selectedZone === 'animation' ? 'Animation' : 'English'} Categories
          </p>
          {categoriesLoading ? (
            <div className="px-3 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-4 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {categories?.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreClick(genre)}
                  className="text-left px-3 py-2 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 uppercase tracking-widest"
                >
                  {genre.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Area */}
      <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
        <Link to="/search" className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-red-600 transition-all duration-300">
          <Search className="w-4 h-4" />
          Search
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
