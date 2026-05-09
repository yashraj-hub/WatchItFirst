import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { changePassword, getUserProfile, getWatchHistory } from '../../services/firebase';
import { db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import MainLayout from '../../layouts/MainLayout';
import { TMDB_CONFIG } from '../../services/tmdb';
import { Lock, Eye, EyeOff, User, Clock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// DiceBear avatar styles — free, no API key needed
const AVATAR_STYLES = [
  // DiceBear styles
  { id: 'adventurer', label: 'Adventurer', url: (seed) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}` },
  { id: 'adventurer-neutral', label: 'Adventurer 2', url: (seed) => `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${seed}` },
  { id: 'avataaars', label: 'Avataaars', url: (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}` },
  { id: 'avataaars-neutral', label: 'Avataaars 2', url: (seed) => `https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${seed}` },
  { id: 'big-ears', label: 'Big Ears', url: (seed) => `https://api.dicebear.com/7.x/big-ears/svg?seed=${seed}` },
  { id: 'big-ears-neutral', label: 'Big Ears 2', url: (seed) => `https://api.dicebear.com/7.x/big-ears-neutral/svg?seed=${seed}` },
  { id: 'big-smile', label: 'Big Smile', url: (seed) => `https://api.dicebear.com/7.x/big-smile/svg?seed=${seed}` },
  { id: 'bottts', label: 'Bottts', url: (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}` },
  { id: 'bottts-neutral', label: 'Bottts 2', url: (seed) => `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}` },
  { id: 'croodles', label: 'Croodles', url: (seed) => `https://api.dicebear.com/7.x/croodles/svg?seed=${seed}` },
  { id: 'croodles-neutral', label: 'Croodles 2', url: (seed) => `https://api.dicebear.com/7.x/croodles-neutral/svg?seed=${seed}` },
  { id: 'fun-emoji', label: 'Fun Emoji', url: (seed) => `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${seed}` },
  { id: 'icons', label: 'Icons', url: (seed) => `https://api.dicebear.com/7.x/icons/svg?seed=${seed}` },
  { id: 'identicon', label: 'Identicon', url: (seed) => `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}` },
  { id: 'initials', label: 'Initials', url: (seed) => `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=b91c1c` },
  { id: 'lorelei', label: 'Lorelei', url: (seed) => `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}` },
  { id: 'lorelei-neutral', label: 'Lorelei 2', url: (seed) => `https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=${seed}` },
  { id: 'micah', label: 'Micah', url: (seed) => `https://api.dicebear.com/7.x/micah/svg?seed=${seed}` },
  { id: 'miniavs', label: 'Miniavs', url: (seed) => `https://api.dicebear.com/7.x/miniavs/svg?seed=${seed}` },
  { id: 'notionists', label: 'Notionists', url: (seed) => `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}` },
  { id: 'notionists-neutral', label: 'Notionists 2', url: (seed) => `https://api.dicebear.com/7.x/notionists-neutral/svg?seed=${seed}` },
  { id: 'open-peeps', label: 'Open Peeps', url: (seed) => `https://api.dicebear.com/7.x/open-peeps/svg?seed=${seed}` },
  { id: 'personas', label: 'Personas', url: (seed) => `https://api.dicebear.com/7.x/personas/svg?seed=${seed}` },
  { id: 'pixel-art', label: 'Pixel Art', url: (seed) => `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}` },
  { id: 'pixel-art-neutral', label: 'Pixel Art 2', url: (seed) => `https://api.dicebear.com/7.x/pixel-art-neutral/svg?seed=${seed}` },
  { id: 'rings', label: 'Rings', url: (seed) => `https://api.dicebear.com/7.x/rings/svg?seed=${seed}` },
  { id: 'shapes', label: 'Shapes', url: (seed) => `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}` },
  { id: 'thumbs', label: 'Thumbs', url: (seed) => `https://api.dicebear.com/7.x/thumbs/svg?seed=${seed}` },
];

const getAvatarUrl = (style, seed) => style.url(encodeURIComponent(seed));

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    if (user === undefined) return; // still loading
    if (!user) { navigate('/auth'); return; }
    getUserProfile(user.uid).then(p => {
      setProfile(p);
      setSelectedAvatar(p?.avatar || null);
    });
    getWatchHistory(user.uid).then(setHistory);
  }, [user]);

  // Most watched movie = first in history (most recent), use its backdrop as bg
  const bgMovie = history.find(m => m.poster_path);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    if (newPass.length < 6) { setMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    setLoading(true);
    try {
      await changePassword(currentPass, newPass);
      setMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPass(''); setNewPass('');
    } catch (err) {
      setMsg({ type: 'error', text: err.code === 'auth/wrong-password' ? 'Current password is incorrect.' : 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvatar = async (avatarUrl) => {
    setSavingAvatar(true);
    try {
      await setDoc(doc(db, 'users', user.uid, 'profile', 'data'), { avatar: avatarUrl }, { merge: true });
      setSelectedAvatar(avatarUrl);
      setProfile(p => ({ ...p, avatar: avatarUrl }));
      // Notify navbar to update avatar instantly
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: avatarUrl }));
      setShowAvatarPicker(false);
    } catch {}
    setSavingAvatar(false);
  };

  const fmt = (ts) => ts?.seconds ? new Date(ts.seconds * 1000).toLocaleDateString() : '';
  const seed = profile?.displayName || user?.email || 'user';

  return (
    <MainLayout>
      <div className="relative min-h-screen">

        {/* BG poster from most watched movie */}
        {bgMovie?.poster_path ? (
          <>
            <div className="fixed inset-0 z-0">
              <img
                src={`${TMDB_CONFIG.w500}${bgMovie.poster_path}`}
                className="w-full h-full object-cover opacity-20 blur-xl scale-110"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-[#050505]/80 to-[#050505]" />
            </div>
          </>
        ) : (
          <div className="fixed inset-0 z-0 bg-[#050505]" />
        )}

        <div className="relative z-10 px-4 md:px-12 pt-28 pb-16 max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 hover:border-red-500 transition-all"
                >
                  {selectedAvatar ? (
                    <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover bg-white/10" />
                  ) : (
                    <div className="w-full h-full bg-red-600/20 flex items-center justify-center">
                      <span className="text-xl font-black text-red-400">
                        {(profile?.displayName || user?.email || '?')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center cursor-pointer border-2 border-[#050505]"
                  onClick={() => setShowAvatarPicker(true)}>
                  <span className="text-white text-[8px] font-black">✎</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tighter text-white">{profile?.displayName || 'User'}</h1>
                <p className="text-[10px] text-gray-500 mt-0.5">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => { signOut(); navigate('/auth'); }}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-red-600/20 transition-all"
            >
              Sign Out
            </button>
          </div>

          {/* Avatar Picker Modal */}
          <AnimatePresence>
            {showAvatarPicker && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4"
                onClick={() => setShowAvatarPicker(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                >
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-5">Choose Avatar</h2>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {AVATAR_STYLES.map(style => {
                      const url = getAvatarUrl(style, seed);
                      const isSelected = selectedAvatar === url;
                      return (
                        <button
                          key={style.id}
                          onClick={() => handleSaveAvatar(url)}
                          disabled={savingAvatar}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${
                            isSelected ? 'border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'border-white/10 hover:border-white/30'
                          } bg-white/5`}
                          title={style.label}
                        >
                          <img src={url} alt={style.label} className="w-full h-full object-contain p-1" />
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-gray-600 text-center mt-4 uppercase tracking-widest">Powered by DiceBear</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid md:grid-cols-2 gap-8">

            {/* Change Password */}
            {profile?.provider === 'email' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-5 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Change Password
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="relative">
                    <input type={showCurrent ? 'text' : 'password'} placeholder="Current password"
                      value={currentPass} onChange={e => setCurrentPass(e.target.value)} required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50 transition-all" />
                    <button type="button" onClick={() => setShowCurrent(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showNew ? 'text' : 'password'} placeholder="New password (min 6 chars)"
                      value={newPass} onChange={e => setNewPass(e.target.value)} required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/50 transition-all" />
                    <button type="button" onClick={() => setShowNew(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {msg.text && (
                    <p className={`text-xs font-bold uppercase tracking-wide ${msg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                      {msg.text}
                    </p>
                  )}
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all disabled:opacity-50">
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-5 flex items-center gap-2">
                <User className="w-3 h-3" /> Account Info
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Member Since', value: fmt(profile?.createdAt) },
                  { label: 'Sign In Method', value: profile?.provider === 'google' ? 'Google' : 'Email & Password' },
                  { label: 'Movies Watched', value: profile?.moviesWatched || 0 },
                  { label: 'Watch History', value: `${history.length} / 100` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
                    <span className="text-xs font-black text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Watch History */}
          {history.length > 0 && (
            <div className="mt-10">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-5 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Watch History ({history.length})
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {history.map((movie, i) => (
                  <motion.div key={movie.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.02 } }}
                    onClick={() => navigate(`/details/${movie.id}`)}
                    className="cursor-pointer group"
                  >
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 group-hover:scale-105 transition-transform duration-300">
                      <img src={movie.poster_path ? `${TMDB_CONFIG.w500}${movie.poster_path}` : '/placeholder.svg'}
                        alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}


        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
