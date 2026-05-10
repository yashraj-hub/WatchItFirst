import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Globe2 } from 'lucide-react';
import { registerWithEmail, loginWithEmail, loginWithGoogle, resetPassword } from '../../services/firebase';
import { tmdbService, TMDB_CONFIG } from '../../services/tmdb';

const Auth = () => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bgPosters, setBgPosters] = useState([]);
  const [bgIndex, setBgIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    tmdbService.getNowPlaying().then(data => {
      setBgPosters((data.results || []).filter(m => m.backdrop_path).slice(0, 8));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!bgPosters.length) return;
    const interval = setInterval(() => setBgIndex(p => (p + 1) % bgPosters.length), 4000);
    return () => clearInterval(interval);
  }, [bgPosters]);

  const activePoster = bgPosters[bgIndex];
  const [activeLogo, setActiveLogo] = useState(null);

  useEffect(() => {
    if (!activePoster) return;
    setActiveLogo(null);
    tmdbService.getMovieImages(activePoster.id)
      .then(data => {
        const logo = data?.logos?.find(l => l.iso_639_1 === 'en') || data?.logos?.[0];
        setActiveLogo(logo ? `${TMDB_CONFIG.original}${logo.file_path}` : null);
      })
      .catch(() => {});
  }, [activePoster]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (mode === 'signup' && !consent) { setError('You must agree to data collection to continue.'); return; }
    setLoading(true);
    try {
      if (mode === 'login') { await loginWithEmail(email, password); navigate('/'); }
      else if (mode === 'signup') { await registerWithEmail(email, password, name); navigate('/'); }
      else if (mode === 'reset') { await resetPassword(email); setSuccess('Password reset email sent! Check your inbox.'); }
    } catch (err) {
      const msg = err.code?.replace('auth/', '').replace(/-/g, ' ') || err.message;
      setError(msg.charAt(0).toUpperCase() + msg.slice(1));
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try { await loginWithGoogle(); navigate('/'); }
    catch { setError('Google sign in failed. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black grid md:grid-cols-[3fr_2fr]">

      {/* LEFT — poster bg */}
      <div className="relative min-h-[300px] overflow-hidden bg-black">
        <AnimatePresence mode="sync">
          {activePoster && (
            <motion.img
              key={activePoster.id}
              src={`${TMDB_CONFIG.original}${activePoster.backdrop_path}`}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 h-full w-full object-cover"
              alt=""
            />
          )}
        </AnimatePresence>

        {/* Lighter overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/30 to-black/70" />

        {/* Logo top left */}
        <div className="absolute top-6 left-6 z-10">
          <span className="text-lg font-black uppercase tracking-tighter">
            <span className="text-white">Movies</span><span className="text-yellow-400">Box</span>
          </span>
        </div>

        {/* Movie logo/title bottom left */}
        <div className="absolute bottom-6 left-6 z-10 max-w-[70%]">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-yellow-400">Now Playing</p>
          <AnimatePresence mode="wait">
            {activeLogo ? (
              <motion.img
                key={activePoster?.id + '-logo'}
                src={activeLogo}
                alt={activePoster?.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="max-h-16 md:max-h-24 w-auto object-contain object-left drop-shadow-2xl"
              />
            ) : (
              <motion.p
                key={activePoster?.id + '-text'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xl font-black uppercase tracking-tighter text-white md:text-3xl"
              >
                {activePoster?.title}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="relative flex items-center justify-center bg-black/70 px-5 py-8 md:px-10 md:py-12 overflow-y-auto min-h-screen">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

          {/* Welcome text */}
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-400 font-black">
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </p>
          </div>

          {/* Tabs */}
          {mode !== 'reset' && (
            <div className="mb-8 flex gap-1 rounded-full bg-white/5 border border-white/10 p-1">
              {['login', 'signup'].map(m => (
                <button key={m} type="button"
                  onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  className={`flex-1 rounded-full py-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                    mode === m ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400" />
                <input type="text" placeholder="Display name" value={name}
                  onChange={e => setName(e.target.value)} required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-11 py-3.5 text-sm text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-all" />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400" />
              <input type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)} required
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-11 py-3.5 text-sm text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-all" />
            </div>

            {mode !== 'reset' && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400" />
                <input type={showPass ? 'text' : 'password'} placeholder="Password" value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-11 py-3.5 text-sm text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-all" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {mode === 'signup' && (
              <label className="group flex cursor-pointer items-start gap-3">
                <div onClick={() => setConsent(p => !p)}
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                    consent ? 'border-yellow-400 bg-yellow-400' : 'border-white/20 group-hover:border-yellow-400/50'
                  }`}>
                  {consent && <span className="text-xs font-black text-black">✓</span>}
                </div>
                <span className="text-[11px] leading-relaxed text-gray-400">
                  I agree that MoviesBox may collect my usage data including browser info, device details, watch history and preferences to improve the service.
                </span>
              </label>
            )}

            <AnimatePresence>
              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs font-bold uppercase tracking-wide text-red-400">{error}</motion.p>}
              {success && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs font-bold uppercase tracking-wide text-green-400">{success}</motion.p>}
            </AnimatePresence>

            <button type="submit" disabled={loading}
              className="w-full rounded-2xl bg-yellow-400 py-3.5 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
            </button>
          </form>

          {mode !== 'reset' && (
            <>
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] uppercase tracking-widest text-yellow-400">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <button type="button" onClick={handleGoogle} disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 hover:border-yellow-400/30 disabled:opacity-50">
                <Globe2 className="h-4 w-4 text-yellow-400" /> Continue with Google
              </button>
            </>
          )}

          <div className="mt-6 flex items-center justify-center gap-4">
            {mode === 'login' && (
              <button type="button" onClick={() => { setMode('reset'); setError(''); }}
                className="text-[11px] uppercase tracking-widest text-gray-500 hover:text-yellow-400 transition-colors">
                Forgot password?
              </button>
            )}
            {mode === 'reset' && (
              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="text-[11px] uppercase tracking-widest text-gray-500 hover:text-yellow-400 transition-colors">
                ← Back to sign in
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
