import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, getWatchHistory, getMyList, getDevices, revokeDevice } from '../../services/firebase';
import { TMDB_CONFIG } from '../../services/tmdb';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Eye, Clock, Bookmark, Monitor, Globe, ChevronDown, ChevronUp, Shield, ArrowLeft, Film, Smartphone, X, LayoutGrid, List } from 'lucide-react';

const AdminPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [activityView, setActivityView] = useState('poster');
  const [userDetails, setUserDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  useEffect(() => {
    if (user === undefined) return;
    if (!user) { navigate('/auth'); return; }
    if (!isAdmin) { navigate('/'); return; }
    getAllUsers().then(data => { setUsers(data); setLoading(false); });
  }, [user, isAdmin]);

  const handleExpand = async (uid) => {
    if (expanded === uid) { setExpanded(null); return; }
    setExpanded(uid);
    setActivityView('poster');
    if (userDetails[uid]) return;

    const cachedUser = users.find(u => u.uid === uid);
    if (cachedUser) {
      setUserDetails(p => ({
        ...p,
        [uid]: {
          history: cachedUser.history || [],
          myList: cachedUser.myList || [],
          devices: cachedUser.devices || [],
          continueWatching: cachedUser.continueWatching || [],
        }
      }));
      return;
    }

    setLoadingDetails(p => ({ ...p, [uid]: true }));
    const [history, myList, devices] = await Promise.all([
      getWatchHistory(uid).catch(() => []),
      getMyList(uid).catch(() => []),
      getDevices(uid).catch(() => []),
    ]);
    setUserDetails(p => ({ ...p, [uid]: { history, myList, devices, continueWatching: [] } }));
    setLoadingDetails(p => ({ ...p, [uid]: false }));
  };

  const handleRevokeDevice = async (uid, deviceId) => {
    await revokeDevice(uid, deviceId);
    setUserDetails(p => ({
      ...p,
      [uid]: { ...p[uid], devices: p[uid].devices.filter(d => d.id !== deviceId) }
    }));
  };

  const fmt = (ts) => ts?.seconds ? new Date(ts.seconds * 1000).toLocaleString() : 'N/A';
  const fmtDate = (ts) => ts?.seconds ? new Date(ts.seconds * 1000).toLocaleDateString() : 'N/A';
  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  const movieLabel = (movie) => movie.title || movie.name || `Movie ${movie.id}`;
  const movieDate = (movie) => fmt(movie.watchedAt || movie.addedAt || movie.lastSeen || movie.createdAt);
  const allActivityItems = (details) => [
    ...(details?.history || []).map(movie => ({ ...movie, _kind: 'Watch History', _date: movie.watchedAt })),
    ...(details?.myList || []).map(movie => ({ ...movie, _kind: 'My List', _date: movie.addedAt })),
    ...(details?.continueWatching || []).map(movie => ({ ...movie, _kind: 'Continue Watching', _date: movie.watchedAt })),
  ];

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 md:px-10 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div className="p-2.5 bg-red-600 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-white">Admin Dashboard</h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{users.length} Total Users</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-600 hidden md:block">Last refreshed: {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-400' },
          { label: 'Email Users', value: users.filter(u => u.provider === 'email').length, icon: Globe, color: 'text-green-400' },
          { label: 'Google Users', value: users.filter(u => u.provider === 'google').length, icon: Monitor, color: 'text-yellow-400' },
          { label: 'Movies Watched', value: users.reduce((a, u) => a + (u.moviesWatched || 0), 0), icon: Eye, color: 'text-red-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Users list */}
      <div className="space-y-3">
        {users.length === 0 && (
          <div className="text-center py-20 text-gray-600 text-sm uppercase tracking-widest">
            No users found. New signups will appear here.
          </div>
        )}
        {users.map((u, i) => (
          <motion.div key={u.uid}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Row */}
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.03] transition-all"
              onClick={() => handleExpand(u.uid)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-red-600/20 flex items-center justify-center">
                  {u.avatar
                    ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                    : <span className="text-sm font-black text-red-400">{(u.displayName || u.email || '?')[0].toUpperCase()}</span>
                  }
                </div>
                <div>
                  <p className="text-sm font-black text-white">{u.displayName || 'No name'}</p>
                  <p className="text-[10px] text-gray-500">{u.email || 'No email'} · {u.provider}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Bookmark className="w-3 h-3 text-red-500" />{u.myListCount || 0}</span>
                  <span className="flex items-center gap-1"><Film className="w-3 h-3 text-blue-400" />{u.watchHistoryCount || 0}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-green-400" />{fmtDate(u.lastSeen)}</span>
                </div>
                {expanded === u.uid
                  ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
              </div>
            </div>

            {/* Expanded */}
            <AnimatePresence>
              {expanded === u.uid && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-white/5"
                >
                  <div className="px-5 py-5 space-y-6">

                    {/* Account + Browser info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'UID', value: u.uid },
                        { label: 'Joined', value: fmtDate(u.createdAt) },
                        { label: 'Last Seen', value: fmt(u.lastSeen) },
                        { label: 'Consent', value: u.consentGiven ? `Yes — ${fmtDate(u.consentAt)}` : 'No' },
                        { label: 'Browser', value: u.browserInfo?.browser },
                        { label: 'OS', value: u.browserInfo?.os },
                        { label: 'Device', value: u.browserInfo?.device },
                        { label: 'Screen', value: u.browserInfo?.screenResolution },
                        { label: 'Language', value: u.browserInfo?.language },
                        { label: 'Timezone', value: u.browserInfo?.timezone },
                        { label: 'Connection', value: u.browserInfo?.connectionType },
                        { label: 'RAM', value: u.browserInfo?.deviceMemory ? `${u.browserInfo.deviceMemory}GB` : 'N/A' },
                        { label: 'CPU Cores', value: u.browserInfo?.hardwareConcurrency },
                        { label: 'Touch', value: u.browserInfo?.touchSupport ? 'Yes' : 'No' },
                        { label: 'Referrer', value: u.browserInfo?.referrer },
                        { label: 'Platform', value: u.browserInfo?.platform },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white/5 rounded-xl p-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                          <p className="text-[11px] font-bold text-white truncate">{value || 'N/A'}</p>
                        </div>
                      ))}
                      <div className="col-span-2 md:col-span-4 bg-white/5 rounded-xl p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">User Agent</p>
                        <p className="text-[10px] text-gray-400 break-all">{u.browserInfo?.userAgent || 'N/A'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500 mb-3">Full Profile Data</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(u)
                          .filter(([key, value]) => !['devices', 'myList', 'history', 'continueWatching'].includes(key) && value !== undefined)
                          .map(([key, value]) => (
                            <div key={key} className="bg-white/5 rounded-xl p-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">{key}</p>
                              <p className="text-[11px] font-bold text-white truncate">{formatValue(value)}</p>
                            </div>
                          ))}
                      </div>
                    </div>

                    {loadingDetails[u.uid] ? (
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest">
                        <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
                        Loading user data...
                      </div>
                    ) : userDetails[u.uid] && (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500">Activity View</p>
                          <div className="inline-flex rounded-xl bg-white/5 border border-white/10 p-1">
                            <button
                              type="button"
                              onClick={() => setActivityView('poster')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                activityView === 'poster' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'
                              }`}
                            >
                              <LayoutGrid className="w-3 h-3" /> Posters
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivityView('list')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                activityView === 'list' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'
                              }`}
                            >
                              <List className="w-3 h-3" /> Full List
                            </button>
                          </div>
                        </div>

                        {/* Devices */}
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500 mb-3 flex items-center gap-2">
                            <Smartphone className="w-3 h-3" /> Devices ({userDetails[u.uid].devices?.length || 0})
                          </p>
                          {userDetails[u.uid].devices?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {userDetails[u.uid].devices.map(device => (
                                <div key={device.id} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                                  <div>
                                    <p className="text-[11px] font-black text-white">{device.browserInfo?.browser} · {device.browserInfo?.os}</p>
                                    <p className="text-[9px] text-gray-500 mt-0.5">{device.browserInfo?.device} · Last seen: {fmtDate(device.lastSeen)}</p>
                                    <p className="text-[8px] text-gray-600 mt-0.5 font-mono">{device.id}</p>
                                  </div>
                                  <button
                                    onClick={() => handleRevokeDevice(u.uid, device.id)}
                                    className="w-7 h-7 rounded-lg bg-red-600/10 border border-red-600/20 flex items-center justify-center hover:bg-red-600 transition-all ml-3 flex-shrink-0"
                                  >
                                    <X className="w-3 h-3 text-red-400 hover:text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest">No devices registered yet</p>
                          )}
                        </div>

                        {activityView === 'poster' ? (
                          <>
                            {/* Watch History */}
                            {userDetails[u.uid].history.length > 0 && (
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500 mb-3 flex items-center gap-2">
                                  <Film className="w-3 h-3" /> Watch History ({userDetails[u.uid].history.length})
                                </p>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                  {userDetails[u.uid].history.map(movie => (
                                    <div key={movie.id} className="flex-shrink-0 w-14 cursor-pointer group"
                                      onClick={() => navigate(`/details/${movie.id}`)}>
                                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-white/5 group-hover:scale-105 transition-transform">
                                        <img src={movie.poster_path ? `${TMDB_CONFIG.w500}${movie.poster_path}` : '/placeholder.svg'}
                                          alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* My List */}
                            {userDetails[u.uid].myList.length > 0 && (
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500 mb-3 flex items-center gap-2">
                                  <Bookmark className="w-3 h-3" /> My List ({userDetails[u.uid].myList.length})
                                </p>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                  {userDetails[u.uid].myList.map(movie => (
                                    <div key={movie.id} className="flex-shrink-0 w-14 cursor-pointer group"
                                      onClick={() => navigate(`/details/${movie.id}`)}>
                                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-white/5 group-hover:scale-105 transition-transform">
                                        <img src={movie.poster_path ? `${TMDB_CONFIG.w500}${movie.poster_path}` : '/placeholder.svg'}
                                          alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Continue Watching */}
                            {userDetails[u.uid].continueWatching?.length > 0 && (
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500 mb-3 flex items-center gap-2">
                                  <Eye className="w-3 h-3" /> Continue Watching ({userDetails[u.uid].continueWatching.length})
                                </p>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                  {userDetails[u.uid].continueWatching.map(movie => (
                                    <div key={movie.id} className="flex-shrink-0 w-14 cursor-pointer group"
                                      onClick={() => navigate(`/details/${movie.id}`)}>
                                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-white/5 group-hover:scale-105 transition-transform">
                                        <img src={movie.poster_path ? `${TMDB_CONFIG.w500}${movie.poster_path}` : '/placeholder.svg'}
                                          alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {userDetails[u.uid].history.length === 0 && userDetails[u.uid].myList.length === 0 && (
                              <p className="text-[10px] text-gray-600 uppercase tracking-widest">No activity yet</p>
                            )}
                          </>
                        ) : (
                          <div className="space-y-4">
                            {allActivityItems(userDetails[u.uid]).length > 0 ? (
                              allActivityItems(userDetails[u.uid]).map((movie, idx) => (
                                <div
                                  key={`${movie._kind}-${movie.id}-${idx}`}
                                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 cursor-pointer hover:bg-white/[0.08] transition-all"
                                  onClick={() => navigate(`/details/${movie.id}`)}
                                >
                                  <div className="w-12 flex-shrink-0">
                                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
                                      <img
                                        src={movie.poster_path ? `${TMDB_CONFIG.w500}${movie.poster_path}` : '/placeholder.svg'}
                                        alt={movieLabel(movie)}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                      />
                                    </div>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500">{movie._kind}</span>
                                      <span className="text-[9px] text-gray-500">{movieDate(movie)}</span>
                                    </div>
                                    <p className="text-sm font-bold text-white truncate">{movieLabel(movie)}</p>
                                    <p className="text-[10px] text-gray-500 truncate">
                                      {movie.media_type || 'movie'} · ID {movie.id}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-gray-600 uppercase tracking-widest">No activity yet</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
