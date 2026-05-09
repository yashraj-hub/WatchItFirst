import { useState, useEffect } from 'react';
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
      const posters = (data.results || [])
        .filter(m => m.backdrop_path)
        .slice(0, 8);
      setBgPosters(posters);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (bgPosters.length === 0) return;
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % bgPosters.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [bgPosters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'signup' && !consent) {
      setError('You must agree to data collection to continue.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        navigate('/');
      } else if (mode === 'signup') {
        await registerWithEmail(email, password, name);
        navigate('/');
      } else if (mode === 'reset') {
        await resetPassword(email);
        setSuccess('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      const msg = err.code?.replace('auth/', '').replace(/-/g, ' ') || err.message;
      setError(msg.charAt(0).toUpperCase() + msg.slice(1));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError('Google sign in failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex overflow-hidden">

      {/* LEFT 60% — Movie poster bg */}
      <div className="hidden md:block relative w-[60%] flex-shrink-0">
        <AnimatePresence mode="sync">
          {bgPosters.length > 0 && (
            <motion.img
              key={bgPosters[bgIndex]?.id}
              src={`${TMDB_CONFIG.original}${bgPosters[bgIndex]?.backdrop_path}`}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 w-full h-full object-cover"
              alt=""
            />
          )}
        </AnimatePresence>
        {/* Gradient divider on right edge */}
        <div className="absolute inset-y-0 right-0 w-40 pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent, #050505)' }}
        />
        {/* Bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #050505, transparent)' }}
        />
        {/* Logo on top left */}
        <div className="absolute top-8 left-8">
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase drop-shadow-lg">WatchItFirst</h1>
        </div>
        {/* Movie title bottom left */}
        {bgPosters[bgIndex] && (
          <motion.div
            key={bgPosters[bgIndex]?.id + '-title'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 left-8"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Now Playing</p>
            <p className="text-xl font-black uppercase tracking-tighter text-white drop-shadow-lg">{bgPosters[bgIndex]?.title}</p>
          </motion.div>
        )}
      </div>

      {/* RIGHT 40% — Auth form */}
      <div className="flex-1 md:w-[40%] flex items-center justify-center px-6 md:px-10 bg-[#050505] relative">
        {/* Mobile bg */}
        <div className="md:hidden absolute inset-0">
          <AnimatePresence mode="sync">
            {bgPosters.length > 0 && (
              <motion.img
                key={bgPosters[bgIndex]?.id + '-mob'}
                src={`${TMDB_CONFIG.original}${bgPosters[bgIndex]?.backdrop_path}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="w-full h-full object-cover"
                alt=""
              />
            )}
          </AnimatePresence>
        </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        {/* Logo — mobile only */}
        <div className="text-center mb-8 md:hidden">
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase">WatchItFirst</h1>
        </div>
        <div className="text-center mb-6">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </p>
        </div>

        <div className="bg-black/60 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl">

          {/* Mode tabs */}
          {mode !== 'reset' && (
            <div className="flex gap-1 mb-8 bg-white/5 rounded-2xl p-1">
              {['login', 'signup'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    mode === m ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field — signup only */}
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Display name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50 transition-all"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50 transition-all"
              />
            </div>

            {/* Password */}
            {mode !== 'reset' && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-11 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50 transition-all"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Consent checkbox — signup only */}
            {mode === 'signup' && (
              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  onClick={() => setConsent(p => !p)}
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    consent ? 'bg-red-600 border-red-600' : 'border-white/20 group-hover:border-white/40'
                  }`}
                >
                  {consent && <span className="text-white text-xs font-black">✓</span>}
                </div>
                <span className="text-[11px] text-gray-400 leading-relaxed">
                  I agree that WatchItFirst may collect my usage data including browser info, device details, watch history and preferences to improve the service. Full terms will be available soon.
                </span>
              </label>
            )}

            {/* Error / Success */}
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-red-400 text-xs font-bold uppercase tracking-wide">
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-green-400 text-xs font-bold uppercase tracking-wide">
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
            </button>
          </form>

          {/* Divider */}
          {mode !== 'reset' && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-gray-600 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Globe2 className="w-4 h-4" /> Continue with Google
              </button>
            </>
          )}

          {/* Footer links */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {mode === 'login' && (
              <button onClick={() => { setMode('reset'); setError(''); }}
                className="text-[11px] text-gray-500 hover:text-white transition-colors uppercase tracking-widest">
                Forgot password?
              </button>
            )}
            {mode === 'reset' && (
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="text-[11px] text-gray-500 hover:text-white transition-colors uppercase tracking-widest">
                ← Back to sign in
              </button>
            )}
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default Auth;
