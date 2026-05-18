import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, animate } from 'framer-motion';
import Navbar   from '../components/Navbar';
import Toast    from '../components/Toast';
import QRModal  from '../components/QRModal';
import { api }  from '../utils/api';
import { auth } from '../utils/auth';
import { getInitials, getAvatarColor } from '../utils/avatar';

// ── Animated stat number ────────────────────────────────────────────────────
function AnimatedStat({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, value, {
      duration: 0.9,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: v => setDisplay(Math.round(v)),
    });
    return ctrl.stop;
  }, [value]);
  return <span>{display}</span>;
}

function fmtTime(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── Mobile guest card ───────────────────────────────────────────────────────
function GuestCard({ guest, index, onQR, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.04, 0.4) }}
      className="bg-gray-50/70 rounded-xl p-3.5 flex items-start gap-3 border border-gray-100"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
        style={{ background: getAvatarColor(guest.name) }}
      >
        {getInitials(guest.name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 text-sm truncate">{guest.name}</div>
        {guest.phone && <div className="text-xs text-gray-400 mt-0.5">{guest.phone}</div>}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
            guest.checked_in
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {guest.checked_in ? '✓ Checked In' : '⏳ Pending'}
          </span>
          {guest.checked_in && fmtTime(guest.checked_in_at) && (
            <span className="text-xs text-gray-400">{fmtTime(guest.checked_in_at)}</span>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
        <button
          onClick={() => onQR(guest)}
          className="bg-brand-100 hover:bg-brand-200 text-brand-700 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors"
        >
          QR
        </button>
        <button
          onClick={() => onDelete(guest)}
          className="bg-red-50 hover:bg-red-100 text-red-500 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
          title="Remove guest"
        >
          🗑
        </button>
      </div>
    </motion.div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function Admin() {
  const [guests,      setGuests]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [search,      setSearch]      = useState('');
  const [qrGuest,     setQrGuest]     = useState(null);
  const [toast,       setToast]       = useState({ msg: '', type: 'info' });
  const [addLoading,  setAddLoading]  = useState(false);
  const [lastRefresh, setLastRefresh] = useState('');
  const nameRef  = useRef(null);
  const phoneRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate('/login', { replace: true });
  };

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'info' }), 3500);
  }, []);

  const fetchGuests = useCallback(async () => {
    try {
      const data = await api.getGuests();
      setGuests(data.guests || []);
      setLastRefresh(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
    } catch {
      showToast('Failed to load guests. Check your API URL.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchGuests();
    const id = setInterval(fetchGuests, 30000);
    return () => clearInterval(id);
  }, [fetchGuests]);

  // ── Computed ──
  const stats = useMemo(() => {
    const total     = guests.length;
    const checkedIn = guests.filter(g => g.checked_in).length;
    return { total, checkedIn, pending: total - checkedIn };
  }, [guests]);

  const pct = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return guests.filter(g => {
      const matchFilter =
        filter === 'all' ||
        (filter === 'in'      &&  g.checked_in) ||
        (filter === 'pending' && !g.checked_in);
      const matchSearch =
        !q || g.name.toLowerCase().includes(q) || (g.phone || '').includes(q);
      return matchFilter && matchSearch;
    });
  }, [guests, filter, search]);

  // ── Handlers ──
  const handleAddGuest = async e => {
    e.preventDefault();
    const name  = nameRef.current.value.trim();
    const phone = phoneRef.current.value.trim();
    if (!name) return;

    setAddLoading(true);
    try {
      const data = await api.addGuest(name, phone);
      setGuests(prev => [...prev, data.guest]);
      nameRef.current.value  = '';
      phoneRef.current.value = '';
      showToast(`${data.guest.name} added!`, 'success');
      setQrGuest(data.guest);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleCSV = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const text    = await file.text();
    const lines   = text.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const ni = headers.indexOf('name'), pi = headers.indexOf('phone');
    if (ni === -1) { showToast('CSV needs a "name" column', 'error'); e.target.value = ''; return; }

    const guestList = lines.slice(1)
      .filter(l => l.trim())
      .map(l => {
        const c = l.split(',').map(v => v.trim().replace(/"/g, ''));
        return { name: c[ni], phone: pi !== -1 ? c[pi] : '' };
      })
      .filter(g => g.name);

    if (!guestList.length) { showToast('No valid guests found', 'error'); e.target.value = ''; return; }
    if (!confirm(`Import ${guestList.length} guest(s)?`)) { e.target.value = ''; return; }

    showToast(`Importing ${guestList.length} guests…`, 'info');
    try {
      const data = await api.importGuests(guestList);
      showToast(`${data.count} guests imported!`, 'success');
      await fetchGuests();
    } catch (err) {
      showToast(err.message, 'error');
    }
    e.target.value = '';
  };

  const handleDelete = async (guest) => {
    if (!window.confirm(`Remove ${guest.name} from the guest list? This cannot be undone.`)) return;
    try {
      await api.deleteGuest(guest.id);
      setGuests(prev => prev.filter(g => g.id !== guest.id));
      showToast(`${guest.name} removed`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const FILTERS = [
    { key: 'all',     label: `All (${stats.total})`           },
    { key: 'in',      label: `Checked In (${stats.checkedIn})` },
    { key: 'pending', label: `Pending (${stats.pending})`     },
  ];

  const STAT_CARDS = [
    { icon: '🎫', label: 'Total Guests', value: stats.total,     grad: 'from-violet-50 to-purple-50', num: 'text-brand-700', ring: 'ring-violet-100' },
    { icon: '✅', label: 'Checked In',   value: stats.checkedIn, grad: 'from-green-50  to-emerald-50', num: 'text-green-700', ring: 'ring-green-100'  },
    { icon: '⏳', label: 'Pending',       value: stats.pending,   grad: 'from-amber-50  to-yellow-50',  num: 'text-amber-700', ring: 'ring-amber-100'  },
  ];

  // ── Render ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0  }}
      exit={{    opacity: 0, y: -10 }}
      transition={{ duration: 0.22 }}
      className="min-h-screen"
    >
      <Navbar />

      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Panel</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage guests · generate QR tickets</p>
          </div>
          <div className="flex items-center gap-2">
            {lastRefresh && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Updated {lastRefresh}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 bg-gray-50
                         hover:bg-red-50 border border-gray-200 hover:border-red-200
                         px-3 py-1.5 rounded-full transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-16">

        {/* ── Stats ── */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-3 gap-3 mb-4"
        >
          {STAT_CARDS.map(s => (
            <motion.div
              key={s.label}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className={`bg-gradient-to-br ${s.grad} rounded-2xl p-4 ring-1 ${s.ring} shadow-sm`}
            >
              <div className="text-2xl mb-2 leading-none">{s.icon}</div>
              <div className={`text-3xl font-black leading-none tracking-tight ${s.num}`}>
                {loading ? '—' : <AnimatedStat value={s.value} />}
              </div>
              <div className="text-xs text-gray-500 mt-1.5 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Progress bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 mb-5"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700">Check-in Progress</span>
            <span className="text-sm font-bold text-brand-700">{pct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
              className="h-full bg-gradient-to-r from-brand-700 via-violet-500 to-indigo-500 rounded-full"
            />
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {stats.total > 0
              ? `${stats.checkedIn} of ${stats.total} guests checked in`
              : 'Add guests to get started'}
          </div>
        </motion.div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">

          {/* ── Add Guest form ── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0   }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <div className="w-1 h-4 bg-gradient-to-b from-brand-700 to-indigo-500 rounded-full" />
              <span className="font-semibold text-sm text-gray-900">Add Guest</span>
            </div>

            <div className="p-5">
              <form onSubmit={handleAddGuest} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Full Name *
                  </label>
                  <input
                    ref={nameRef}
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    required
                    autoComplete="off"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                               focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100
                               bg-gray-50 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Phone (optional)
                  </label>
                  <input
                    ref={phoneRef}
                    type="tel"
                    placeholder="+91 98765 43210"
                    autoComplete="off"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                               focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100
                               bg-gray-50 focus:bg-white transition"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={addLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{  scale: 0.98 }}
                  className="bg-gradient-to-r from-brand-700 to-indigo-500 hover:from-brand-800
                             hover:to-indigo-600 disabled:opacity-50 text-white font-semibold
                             text-sm py-2.5 rounded-xl transition shadow-sm shadow-brand-200"
                >
                  {addLoading ? 'Adding…' : '+ Add Guest'}
                </motion.button>
              </form>

              <div className="relative flex items-center my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="px-3 text-xs text-gray-400">or import</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed
                               border-gray-200 hover:border-brand-400 hover:text-brand-700 rounded-xl
                               py-3 text-sm font-medium text-gray-500 cursor-pointer transition-colors">
                📤 Import CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
              </label>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                CSV columns: <code className="bg-gray-100 px-1 rounded text-brand-700 text-[11px]">name</code>,{' '}
                <code className="bg-gray-100 px-1 rounded text-brand-700 text-[11px]">phone</code> (optional)
              </p>
            </div>
          </motion.div>

          {/* ── Guest list ── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0  }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-4 bg-gradient-to-b from-brand-700 to-indigo-500 rounded-full" />
                <span className="font-semibold text-sm text-gray-900">Guest List</span>
              </div>
              <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                {filtered.length} shown
              </span>
            </div>

            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-2.5">
              <div className="flex gap-1.5 flex-wrap">
                {FILTERS.map(f => (
                  <motion.button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filter === f.key
                        ? 'bg-brand-700 text-white shadow-sm shadow-brand-200'
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-brand-300 hover:text-brand-700'
                    }`}
                  >
                    {f.label}
                  </motion.button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Search by name or phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white
                           focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>

            {/* ── Desktop table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Guest</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Checked In</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                        Loading guests…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <div className="text-3xl mb-2">{guests.length === 0 ? '🎉' : '🔍'}</div>
                        <div className="text-gray-400 text-sm">
                          {guests.length === 0 ? 'No guests yet. Add your first one.' : 'No guests match this filter.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence initial={false}>
                      {filtered.map((g, i) => (
                        <motion.tr
                          key={g.id}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0   }}
                          exit={{    opacity: 0          }}
                          transition={{ duration: 0.18, delay: Math.min(i * 0.025, 0.35) }}
                          className="border-t border-gray-50 hover:bg-gray-50/80 transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center
                                           text-white text-xs font-bold flex-shrink-0 shadow-sm"
                                style={{ background: getAvatarColor(g.name) }}
                              >
                                {getInitials(g.name)}
                              </div>
                              <span className="font-semibold text-gray-900">{g.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{g.phone || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1
                                            rounded-md ${g.checked_in
                                              ? 'bg-green-50 text-green-700 border border-green-200'
                                              : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {g.checked_in ? '✓ Checked In' : '⏳ Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">
                            {fmtTime(g.checked_in_at) || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{  scale: 0.93 }}
                                onClick={() => setQrGuest(g)}
                                className="bg-brand-50 hover:bg-brand-100 text-brand-700
                                           text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                QR
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{  scale: 0.93 }}
                                onClick={() => handleDelete(g)}
                                className="bg-red-50 hover:bg-red-100 text-red-500 text-xs
                                           px-2.5 py-1.5 rounded-lg transition-colors
                                           opacity-0 group-hover:opacity-100"
                                title="Remove guest"
                              >
                                🗑
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="block md:hidden">
              {loading ? (
                <div className="text-center py-12 text-gray-400 text-sm">Loading guests…</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-2">{guests.length === 0 ? '🎉' : '🔍'}</div>
                  <div className="text-gray-400 text-sm">
                    {guests.length === 0 ? 'No guests yet.' : 'No guests match this filter.'}
                  </div>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  <AnimatePresence initial={false}>
                    {filtered.map((g, i) => (
                      <GuestCard
                        key={g.id}
                        guest={g}
                        index={i}
                        onQR={setQrGuest}
                        onDelete={handleDelete}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="text-center py-5 text-xs text-gray-400 border-t border-white/40 bg-white/20 backdrop-blur-sm mt-4">
        Made with <span className="text-red-400">♥</span> by{' '}
        <span className="font-semibold text-brand-700">Rahul Dahiya</span>
      </footer>

      <QRModal guest={qrGuest} onClose={() => setQrGuest(null)} />
      <Toast message={toast.msg} type={toast.type} />
    </motion.div>
  );
}
