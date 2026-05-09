import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, Search, Video, Sparkles, Menu, X, Star } from 'lucide-react';
import { fetchCategories, fetchPageGenres, selectPageGenres } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const genreSections = useSelector((state) => state.categories.genreSections);
  const status = useSelector((state) => state.categories.status);

  const isBollywoodPage = location.pathname.startsWith('/bollywood');
  const isAnimationPage = location.pathname.startsWith('/animation');

  // Determine which pageType key to fetch
  const pageType = isBollywoodPage ? 'bollywood' : isAnimationPage ? 'animation' : 'default';
  const pageLabel = isBollywoodPage ? 'Bollywood Categories' : isAnimationPage ? 'Animation Categories' : 'Categories';

  // Read from Redux cache — no re-fetch on route change
  const cachedPageGenres = useSelector(selectPageGenres(pageType));
  const defaultGenres = useMemo(() => genreSections.filter(s => !s.isStudio), [genreSections]);
  const genres = cachedPageGenres ?? defaultGenres;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchCategories());
  }, [status, dispatch]);

  // Fetch page-specific genres into Redux once per pageType — condition in thunk prevents duplicates
  useEffect(() => {
    if (pageType !== 'default') dispatch(fetchPageGenres(pageType));
  }, [pageType, dispatch]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setShowCategories(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCategories(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinkClass = 'text-[11px] uppercase tracking-[0.2em] font-semibold text-gray-300 hover:text-white transition-all duration-300';
  const categoryLinkClass = 'block rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300 transition-all duration-300 hover:border-red-500/50 hover:bg-red-600/10 hover:text-white';

  const handleGenreClick = (genre) => {
    setShowCategories(false);
    setMobileOpen(false);
    const params = new URLSearchParams({ genreId: String(genre.id), genreName: genre.name });
    if (isBollywoodPage) { params.set('lang', 'hi'); params.set('pageType', 'bollywood'); }
    else if (isAnimationPage) { params.set('pageType', 'animation'); }
    navigate(`/movies?${params.toString()}`);
  };

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-[100] px-4 md:px-12 py-4 flex items-center justify-between transition-all duration-300 ${
          scrolled || mobileOpen ? 'bg-black shadow-2xl' : 'bg-gradient-to-b from-black via-black/40 to-transparent'
        }`}
      >
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="text-xl md:text-3xl font-heading tracking-tighter text-white uppercase font-bold hover:text-red-600 transition-colors duration-300">
            WatchItFirst
          </Link>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center justify-center flex-grow gap-8 lg:gap-12">
          <Link to="/bollywood" className={navLinkClass}>
            <span className="flex items-center gap-2"><Video className="w-3.5 h-3.5" />Bollywood</span>
          </Link>

          <Link to="/recommendations" className={navLinkClass}>
            <span className="flex items-center gap-2"><Star className="w-3.5 h-3.5" />For You</span>
          </Link>

          <div ref={dropdownRef} className="relative" onMouseEnter={() => setShowCategories(true)} onMouseLeave={() => setShowCategories(false)}>
            <button type="button" onClick={() => setShowCategories(p => !p)} className={navLinkClass} aria-haspopup="menu" aria-expanded={showCategories}>
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Categories
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showCategories ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {showCategories && (
              <div className="absolute left-1/2 top-[calc(100%+12px)] z-50 w-[min(48rem,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border border-white/10 bg-[#090909]/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl" role="menu">
                <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-red-500">Browse</p>
                    <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">{pageLabel}</h3>
                  </div>
                  <button type="button" onClick={() => { setShowCategories(false); navigate(isBollywoodPage ? '/bollywood' : isAnimationPage ? '/animation' : '/movies'); }} className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 hover:text-white transition-colors">
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {genres.map((genre) => (
                    <button key={genre.id} type="button" onClick={() => handleGenreClick(genre)} className={categoryLinkClass} role="menuitem">
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/animation" className={navLinkClass}>
            <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" />Animation</span>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
          <Link to="/search" className="text-gray-300 hover:text-white hover:scale-110 transition-all duration-300">
            <Search className="w-5 h-5" />
          </Link>

          <div className="hidden md:flex w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-700 items-center justify-center cursor-pointer shadow-lg shadow-red-600/30 hover:scale-105 transition-all border border-red-500/50 group">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>

          {/* Hamburger — mobile/tablet only */}
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
                <Link to="/" className="py-3 text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-white border-b border-white/5">
                  Home
                </Link>
                <Link to="/bollywood" className="py-3 text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-white border-b border-white/5 flex items-center gap-2">
                  <Video className="w-4 h-4" /> Bollywood
                </Link>
                <Link to="/recommendations" className="py-3 text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-white border-b border-white/5 flex items-center gap-2">
                  <Star className="w-4 h-4" /> For You
                </Link>
                <Link to="/animation" className="py-3 text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-white border-b border-white/5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Animation
                </Link>

                {/* Categories accordion */}
                <button
                  onClick={() => setMobileCatsOpen(p => !p)}
                  className="py-3 text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-white border-b border-white/5 flex items-center justify-between w-full"
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
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-2 py-3">
                        {genres.map((genre) => (
                          <button key={genre.id} onClick={() => handleGenreClick(genre)} className="text-left px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-red-600/10 hover:border-red-500/40 transition-all">
                            {genre.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Link to="/search" className="py-3 text-sm font-bold uppercase tracking-widest text-gray-300 hover:text-white flex items-center gap-2">
                  <Search className="w-4 h-4" /> Search
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-red-600 selection:text-white flex flex-col">
      <Navbar />
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
  );
};

export default MainLayout;
