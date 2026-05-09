import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, ADMIN_EMAIL } from '../../services/firebase';
import { motion } from 'framer-motion';
import { Users, Eye, Clock, Bookmark, Monitor, Globe, Smartphone, ChevronDown, ChevronUp, Shield } from 'lucide-react';

const AdminPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (user === undefined) return; // still loading
    if (!user) { navigate('/auth'); return; }
    if (!isAdmin) { navigate('/'); return; }
    getAllUsers().then(data => { setUsers(data); setLoading(false); });
  }, [user, isAdmin]);

  const fmt = (ts) => ts?.seconds
    ? new Date(ts.seconds * 1000).toLocaleString()
    : 'N/A';

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 md:px-12 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-red-600 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)]">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Admin Dashboard</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{users.length} Total Users</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Users', value: users.length, icon: Users },
          { label: 'Email Users', value: users.filter(u => u.provider === 'email').length, icon: Globe },
          { label: 'Google Users', value: users.filter(u => u.provider === 'google').length, icon: Monitor },
          { label: 'Total Movies Watched', value: users.reduce((a, u) => a + (u.moviesWatched || 0), 0), icon: Eye },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <Icon className="w-4 h-4 text-red-500 mb-2" />
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="space-y-3">
        {users.map((u, i) => (
          <motion.div
            key={u.uid}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Row header */}
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/5 transition-all"
              onClick={() => setExpanded(expanded === u.uid ? null : u.uid)}
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center">
                  <span className="text-xs font-black text-red-400">{(u.displayName || u.email || '?')[0].toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-black text-white">{u.displayName || 'Anonymous'}</p>
                  <p className="text-[10px] text-gray-500">{u.email || 'No email'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{u.myListCount || 0} saved</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{u.watchHistoryCount || 0} watched</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(u.lastSeen)}</span>
                </div>
                {expanded === u.uid ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
            </div>

            {/* Expanded browser info */}
            {expanded === u.uid && u.browserInfo && (
              <div className="border-t border-white/5 px-5 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Browser', value: u.browserInfo.browser },
                  { label: 'OS', value: u.browserInfo.os },
                  { label: 'Device', value: u.browserInfo.device },
                  { label: 'Language', value: u.browserInfo.language },
                  { label: 'Timezone', value: u.browserInfo.timezone },
                  { label: 'Screen', value: u.browserInfo.screenResolution },
                  { label: 'Viewport', value: u.browserInfo.viewportSize },
                  { label: 'Color Depth', value: u.browserInfo.colorDepth },
                  { label: 'Connection', value: u.browserInfo.connectionType },
                  { label: 'CPU Cores', value: u.browserInfo.hardwareConcurrency },
                  { label: 'RAM', value: u.browserInfo.deviceMemory ? `${u.browserInfo.deviceMemory}GB` : 'Unknown' },
                  { label: 'Touch', value: u.browserInfo.touchSupport ? 'Yes' : 'No' },
                  { label: 'Cookies', value: u.browserInfo.cookiesEnabled ? 'Enabled' : 'Disabled' },
                  { label: 'Do Not Track', value: u.browserInfo.doNotTrack ? 'Yes' : 'No' },
                  { label: 'Referrer', value: u.browserInfo.referrer },
                  { label: 'Platform', value: u.browserInfo.platform },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                    <p className="text-xs font-bold text-white truncate">{value || 'Unknown'}</p>
                  </div>
                ))}

                {/* Full user agent */}
                <div className="col-span-2 md:col-span-4 bg-white/5 rounded-xl p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">User Agent</p>
                  <p className="text-[10px] text-gray-400 break-all">{u.browserInfo.userAgent}</p>
                </div>

                {/* Account info */}
                <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'UID', value: u.uid },
                    { label: 'Provider', value: u.provider },
                    { label: 'Joined', value: fmt(u.createdAt) },
                    { label: 'Consent Given', value: u.consentGiven ? `Yes — ${fmt(u.consentAt)}` : 'No' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/5 rounded-xl p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                      <p className="text-[10px] font-bold text-white break-all">{value || 'Unknown'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
