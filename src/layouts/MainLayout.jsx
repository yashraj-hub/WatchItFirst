import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, Search, Video, Sparkles, Menu, X, Star, Film, Compass, Zap, Bookmark, Clock, Shield, LogOut } from 'lucide-react';
import { fetchCategories, fetchPageGenres, selectPageGenres } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import DiscoveryAnimation from '../components/DiscoveryAnimation';
import { tmdbService } from '../services/tmdb';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/firebase';

const Navbar = ({ onDiscoveryTrigger, isAdmin }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const { user, signOut } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);
  const genreSections = useSelector((state) => state.categories.genreSections);
  const status = useSelector((state) => state.categories.status);
  const bollywoodGenres = useSelector(selectPageGenres('bollywood'));
  const animationGenres = useSelector(selectPageGenres('animation'));
  const bollywoodGenresLoading = useSelector((state) => state.pageGenres.loading.bollywood);
  const animationGenresLoading = useSelector((state) => state.pageGenres.loading.animation);

  const queryParams = new URLSearchParams(location.search);
  const pageTypeParam = queryParams.get('pageType');

  const isBollywoodPage = location.pathname.startsWith('/bollywood') || pageTypeParam === 'bollywood';
  const isAnimationPage = location.pathname.startsWith('/animation') || pageTypeParam === 'animation';

  const isRecommendationsPage = location.pathname === '/recommendations';

  const pageType = isBollywoodPage ? 'bollywood' : isAnimationPage ? 'animation' : 'default';
  const [selectedZone, setSelectedZone] = useState(pageType);
  const englishGenres = useMemo(() => genreSections.filter(s => !s.isStudio), [genreSections]);
  const categories = (selectedZone === 'bollywood' && !isRecommendationsPage) ? bollywoodGenres : (selectedZone === 'animation' && !isRecommendationsPage) ? animationGenres : englishGenres;

  const categoriesLoading =
    (!isRecommendationsPage && selectedZone === 'bollywood' && bollywoodGenresLoading) ||
    (!isRecommendationsPage && selectedZone === 'animation' && animationGenresLoading);
  const pageLabel = isRecommendationsPage 
    ? 'English Categories'
    : selectedZone === 'bollywood'
      ? 'Bollywood Categories'
      : selectedZone === 'animation'
        ? 'Animation Categories'
        : 'English Categories';

  const navLinkClass = 'text-[11px] uppercase tracking-[0.2em] font-semibold text-gray-300 hover:text-white transition-all duration-300';
  const categoryLinkClass = 'block rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300 transition-all duration-300 hover:border-red-500/50 hover:bg-red-600/10 hover:text-white';

  const handleGenreClick = (genre) => {
    setShowCategories(false);
    setMobileOpen(false);
    const params = new URLSearchParams({ genreId: String(genre.id), genreName: genre.name });
    if (genre.isStudio) params.set('isStudio', 'true');
    if (genre.isEra) {
      params.set('isEra', 'true');
      if (genre.startYear) params.set('startYear', String(genre.startYear));
      if (genre.endYear) params.set('endYear', String(genre.endYear));
    }
    if (genre.isDirector) params.set('isDirector', 'true');
    if (selectedZone === 'bollywood') { params.set('lang', 'hi'); params.set('pageType', 'bollywood'); }
    else if (selectedZone === 'animation') { params.set('pageType', 'animation'); }
    navigate(`/movies?${params.toString()}`);
  };

  const categoryPanel = categoriesLoading && !categories?.length ? (
    <div className="py-8 flex items-center justify-center text-[10px] uppercase tracking-[0.2em] text-gray-500">Loading...</div>
  ) : categories?.length ? (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 py-2">
      {categories.map((genre) => (
        <button 
          key={genre.id} 
          type="button" 
          onClick={() => handleGenreClick(genre)} 
          className="text-left text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400 hover:text-white transition-colors duration-200 py-1"
        >
          {genre.name}
        </button>
      ))}
    </div>
  ) : (
    <div className="py-8 flex items-center justify-center text-[10px] uppercase tracking-[0.2em] text-gray-500">No categories available.</div>
  );

  useEffect(() => {
    if (user) getUserProfile(user.uid).then(p => setUserAvatar(p?.avatar || null));
  }, [user, location.pathname]);

  useEffect(() => {
    const handler = (e) => setUserAvatar(e.detail);
    window.addEventListener('avatar-updated', handler);
    return () => window.removeEventListener('avatar-updated', handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchCategories());
  }, [status, dispatch]);

  useEffect(() => {
    if (pageType !== 'default') dispatch(fetchPageGenres(pageType));
  }, [pageType, dispatch]);

  useEffect(() => {
    if (selectedZone !== 'default') dispatch(fetchPageGenres(selectedZone));
  }, [selectedZone, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowCategories(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-[100] px-4 md:px-12 py-3 flex items-center justify-between transition-all duration-300 ${
          scrolled || mobileOpen ? 'bg-black shadow-2xl' : 'bg-gradient-to-b from-black/80 via-black/20 to-transparent'
        }`}
      >
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase hover:text-red-600 transition-colors duration-300">
            WatchItFirst
          </Link>
        </div>

        {/* Desktop nav - Segmented Switcher & Categories */}
        <div className="hidden md:flex items-center gap-4">
          {/* Zone Switcher (Segmented Pill) */}
          <div className="relative flex bg-white/5 border border-white/10 rounded-full p-1 h-10 items-center backdrop-blur-md">
            {/* Sliding Background - Red Pill covering full text */}
            <motion.div
              className="absolute rounded-full h-8 bg-gradient-to-r from-red-600 to-red-700 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
              initial={false}
              animate={{
                x: selectedZone === 'bollywood' ? 0 : selectedZone === 'default' ? 95 : 190,
                width: 95,
                opacity: isRecommendationsPage ? 0 : 1,
                scale: isRecommendationsPage ? 0.8 : 1
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            
            {[
              { id: 'bollywood', label: 'Bollywood', path: '/bollywood' },
              { id: 'default', label: 'Hollywood', path: '/' },
              { id: 'animation', label: 'Animation', path: '/animation' },
            ].map((zone) => (
              <motion.button
                key={zone.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedZone(zone.id);
                  navigate(zone.path);
                }}
                className={`relative z-10 px-0 text-[10px] font-black uppercase tracking-wider transition-colors duration-500 w-[95px] ${
                  (selectedZone === zone.id && !isRecommendationsPage) ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {zone.label}
              </motion.button>
            ))}
          </div>

          {/* Categories Dropdown */}
          <div ref={dropdownRef} className="relative" onMouseEnter={() => setShowCategories(true)} onMouseLeave={() => setShowCategories(false)}>
            <motion.button
              type="button"
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              onClick={() => setShowCategories(p => !p)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-tight text-gray-400 hover:text-white transition-all duration-300 h-9 backdrop-blur-sm"
              aria-haspopup="menu"
              aria-expanded={showCategories}
            >
              <Sparkles className={`w-3 h-3 transition-transform duration-500 ${showCategories ? 'rotate-180 text-red-500' : ''}`} />
              Categories
              <ChevronDown className={`w-3 h-3 transition-transform duration-500 ${showCategories ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {showCategories && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-[calc(100%+12px)] z-50 w-[340px] rounded-2xl border border-white/10 bg-black/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden" 
                  role="menu"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">{pageLabel}</h3>
                    <motion.button 
                      whileHover={{ x: 3, color: '#fff' }}
                      type="button" 
                      onClick={() => { setShowCategories(false); navigate(selectedZone === 'bollywood' ? '/bollywood' : selectedZone === 'animation' ? '/animation' : '/movies'); }} 
                      className="text-[9px] font-bold uppercase tracking-widest text-gray-600 transition-colors"
                    >
                      View All →
                    </motion.button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-10 gap-y-3">
                    {categories?.map((genre) => (
                      <motion.button 
                        key={genre.id} 
                        whileHover={{ x: 5, color: '#fff' }}
                        type="button" 
                        onClick={() => handleGenreClick(genre)} 
                        className="text-left text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500 transition-all duration-200 py-1"
                      >
                        {genre.name}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Link 
                to="/recommendations" 
                className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300 ${
                  location.pathname === '/recommendations' 
                    ? 'bg-red-600 border-red-500 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)]' 
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title="Recommendations"
              >
                <Compass className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.85 }}
              onClick={onDiscoveryTrigger}
              className="relative flex items-center justify-center w-9 h-9 rounded-full bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 transition-all duration-300 overflow-visible"
              title="Surprise Me!"
            >
              {/* Outer slow pulse */}
              <motion.span
                className="absolute inset-0 rounded-full bg-yellow-400/10"
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Middle pulse */}
              <motion.span
                className="absolute inset-0 rounded-full bg-yellow-400/15"
                animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              />
              {/* Border ring */}
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-yellow-400/60"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
              />
              {/* Zap icon — strike animation */}
              <motion.div
                animate={{
                  rotate: [0, -15, 15, -8, 8, 0],
                  scale: [1, 1.3, 0.9, 1.2, 1],
                }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
              >
                <Zap
                  className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(250,204,21,1)) drop-shadow(0 0 16px rgba(250,204,21,0.6))',
                  }}
                />
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Link to="/search" className="text-gray-300 hover:text-white transition-all duration-300">
            <Search className="w-5 h-5" />
          </Link>

          <div ref={profileRef} className="hidden md:flex items-center gap-3 relative">
            <div
              ref={profileRef}
              className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-white/40 cursor-pointer transition-all flex-shrink-0"
              onClick={() => setProfileOpen(p => !p)}
            >
              {userAvatar ? (
                <img src={userAvatar} alt="avatar" className="w-full h-full object-cover bg-white/10" />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-[calc(100%+10px)] w-44 bg-black/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden z-[110]"
                >
                  <button onClick={() => { setProfileOpen(false); navigate('/my-list'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                    <Bookmark className="w-4 h-4 text-red-500" /> My List
                  </button>
                  <button onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-all border-t border-white/5">
                    <Star className="w-4 h-4 text-gray-500" /> Profile
                  </button>
                  {isAdmin && (
                    <button onClick={() => { setProfileOpen(false); navigate('/admin'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-red-400 hover:text-white hover:bg-red-600/10 transition-all border-t border-white/5">
                      <Shield className="w-4 h-4 text-red-500" /> Admin
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      setProfileOpen(false);
                      await signOut();
                      navigate('/auth');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-all border-t border-white/5"
                  >
                    <LogOut className="w-4 h-4 text-gray-500" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-1.5 text-gray-300 hover:text-white transition-colors"
            onClick={() => setMobileOpen(p => !p)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[98] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="fixed top-0 right-0 h-full w-[80vw] max-w-xs z-[99] bg-[#0a0a0a] border-l border-white/10 flex flex-col md:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
                <span className="text-sm font-black uppercase tracking-widest text-white">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col px-5 py-6 gap-1">
                <div className="py-4 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Switch Zone</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { key: 'bollywood', label: 'Bollywood' },
                      { key: 'default', label: 'Hollywood' },
                      { key: 'animation', label: 'Animation' },
                    ].map((zone) => (
                      <button
                        key={zone.key}
                        onClick={() => {
                          setSelectedZone(zone.key);
                          navigate(zone.key === 'default' ? '/' : `/${zone.key}`);
                          setMobileOpen(false);
                        }}
                        className={`text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition ${
                          selectedZone === zone.key ? 'bg-white text-black' : 'bg-white/5 text-gray-400'
                        }`}
                      >
                        {zone.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Link to="/recommendations" onClick={() => setMobileOpen(false)} className="py-4 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white border-b border-white/5 flex items-center gap-2">
                  <Star className="w-4 h-4" /> For You
                </Link>

                <Link to="/my-list" onClick={() => setMobileOpen(false)} className="py-4 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white border-b border-white/5 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-red-500" /> My List
                </Link>

                <button
                  onClick={() => setMobileCatsOpen(p => !p)}
                  className="py-4 text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white border-b border-white/5 flex items-center justify-between w-full"
                >
                  <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" />Categories</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileCatsOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {mobileCatsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {categoriesLoading ? (
                        <div className="py-4 text-[10px] uppercase tracking-[0.2em] text-gray-500">Loading...</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 py-4">
                          {categories?.map((genre) => (
                            <button key={genre.id} onClick={() => handleGenreClick(genre)} className="text-left px-3 py-2 rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              {genre.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [discoveryLogos, setDiscoveryLogos] = useState([]);
  const typeaheadRef = useRef({ value: '', timer: null, opened: false });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (user === undefined) return; // still loading
    if (user === null) navigate('/auth');
  }, [user]);

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (!isDesktop) return;

    const isEditableTarget = (target) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    };

    const resetBuffer = () => {
      typeaheadRef.current.value = '';
      typeaheadRef.current.opened = false;
      if (typeaheadRef.current.timer) {
        window.clearTimeout(typeaheadRef.current.timer);
        typeaheadRef.current.timer = null;
      }
    };

    const handleGlobalType = (e) => {
      if (location.pathname.startsWith('/watch')) return;
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;
      if (e.key.length !== 1 || /\s/.test(e.key)) return;

      const nextQuery = `${typeaheadRef.current.value}${e.key}`;
      typeaheadRef.current.value = nextQuery;

      if (typeaheadRef.current.timer) window.clearTimeout(typeaheadRef.current.timer);
      typeaheadRef.current.timer = window.setTimeout(resetBuffer, 800);

      navigate('/search', {
        state: { initialQuery: nextQuery },
        replace: typeaheadRef.current.opened || location.pathname === '/search',
      });

      typeaheadRef.current.opened = true;
    };

    window.addEventListener('keydown', handleGlobalType);
    return () => {
      window.removeEventListener('keydown', handleGlobalType);
      resetBuffer();
    };
  }, [location.pathname, navigate]);
  
  // Get all movies from categories state for the roulette
  const genreSections = useSelector((state) => state.categories.genreSections);
  const bollywoodCache = useSelector(selectPageGenres('bollywood'));
  const animationCache = useSelector(selectPageGenres('animation'));

  const allMovies = useMemo(() => {
    const movieMap = new Map();
    const addMovies = (list) => {
      list?.forEach(section => {
        section.movies?.forEach(m => movieMap.set(m.id, m));
      });
    };
    addMovies(genreSections);
    addMovies(bollywoodCache);
    addMovies(animationCache);
    return Array.from(movieMap.values());
  }, [genreSections, bollywoodCache, animationCache]);

  const handleDiscoveryTrigger = async () => {
    if (allMovies.length === 0) return;
    
    // Pick 20 random movies to fetch logos for
    const shuffled = [...allMovies].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 20);
    
    // Fetch logos in parallel
    const logoPromises = selected.map(async (movie) => {
      try {
        const images = await tmdbService.getMovieImages(movie.id);
        const logo = images.logos?.find(l => l.iso_639_1 === 'en' || l.iso_639_1 === null);
        return logo ? { ...movie, logo_url: `https://image.tmdb.org/t/p/original${logo.file_path}` } : null;
      } catch {
        return null;
      }
    });
    
    const results = await Promise.all(logoPromises);
    const validLogos = results.filter(Boolean);
    
    if (validLogos.length > 0) {
      setDiscoveryLogos(validLogos);
      setShowDiscovery(true);
    } else {
      // Fallback if no logos found (just start animation with text or posters if needed, 
      // but user wants logos so we should try to find some)
      setShowDiscovery(true);
    }
  };

  const handleDiscoveryFinish = (movie) => {
    setShowDiscovery(false);
    setDiscoveryLogos([]);
    if (movie?.id) {
      navigate(`/details/${movie.id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-red-600 selection:text-white flex flex-col">
      <AnimatePresence>
        {showDiscovery && (
          <DiscoveryAnimation 
            movies={discoveryLogos.length > 0 ? discoveryLogos : allMovies} 
            onFinish={handleDiscoveryFinish} 
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          key={location.pathname} 
          onDiscoveryTrigger={handleDiscoveryTrigger}
          isAdmin={isAdmin}
        />
        <main className="flex-1 bg-[#0a0a0a]">{children}</main>
        <footer className="px-4 md:px-12 py-8 border-t border-white/5 bg-black">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <Link to="/" className="text-xl font-heading tracking-tighter text-white uppercase font-bold hover:text-red-600 transition-colors duration-300">WatchItFirst</Link>
            <p className="text-xs text-gray-600">© 2026 WatchItFirst. Powered by TMDB.</p>
            <div className="flex items-center gap-5">
              <Link to="/" className="text-[11px] uppercase tracking-widest text-gray-600 hover:text-white transition-colors">Home</Link>
              <Link to="/bollywood" className="text-[11px] uppercase tracking-widest text-gray-600 hover:text-white transition-colors">Bollywood</Link>
              <Link to="/animation" className="text-[11px] uppercase tracking-widest text-gray-600 hover:text-white transition-colors">Animation</Link>
              <Link to="/recommendations" className="text-[11px] uppercase tracking-widest text-gray-600 hover:text-white transition-colors">For You</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
