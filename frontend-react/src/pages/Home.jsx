import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const FEATURES = [
  { icon: '✓', label: 'One scan per ticket' },
  { icon: '⚡', label: 'Real-time updates'   },
  { icon: '📱', label: 'Mobile ready'        },
  { icon: '🆓', label: 'Free forever'        },
];

// ── Mini QR viewfinder ─────────────────────────────────────────────────────
function Viewfinder() {
  const bracket = (pos) => ({
    position: 'absolute', width: 20, height: 20,
    borderColor: 'rgba(255,255,255,0.75)', borderStyle: 'solid', ...pos,
  });
  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}
         className="flex items-center justify-center">
      {/* Corner brackets */}
      <div style={bracket({ top:0, left:0,  borderWidth:'2px 0 0 2px', borderRadius:'4px 0 0 0'    })} />
      <div style={bracket({ top:0, right:0, borderWidth:'2px 2px 0 0', borderRadius:'0 4px 0 0'    })} />
      <div style={bracket({ bottom:0, left:0,  borderWidth:'0 0 2px 2px', borderRadius:'0 0 0 4px' })} />
      <div style={bracket({ bottom:0, right:0, borderWidth:'0 2px 2px 0', borderRadius:'0 0 4px 0' })} />
      {/* Camera emoji — floats gently */}
      <motion.span
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="text-4xl select-none"
      >
        📷
      </motion.span>
      {/* Animated scan line */}
      <motion.div
        animate={{ y: [0, 76, 0], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: 6, left: 8, right: 8, height: 1,
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.9), transparent)',
          borderRadius: 1, pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{    opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen flex flex-col overflow-hidden"
    >
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 sm:py-14 gap-8 sm:gap-10">

        {/* ── Hero text ── */}
        <div className="text-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.05 }}
            className="mb-5"
          >
            <span className="inline-flex items-center gap-1.5 bg-white/60 backdrop-blur-sm
                             text-brand-800 text-xs font-semibold px-3.5 py-1.5 rounded-full
                             border border-white/80 shadow-sm">
              🎫 Event Check-In System
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 200, damping: 22 }}
            className="font-black tracking-tighter leading-none"
            style={{ fontSize: 'clamp(2.8rem, 10vw, 5.5rem)' }}
          >
            <span className="text-gray-900">Party</span>
            <br />
            <span className="gradient-text">Check-In</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0  }}
            transition={{ delay: 0.22 }}
            className="text-gray-600 text-base leading-relaxed mt-4 max-w-sm mx-auto"
          >
            Scan tickets, mark attendance instantly, manage your full guest list — all from your browser.
          </motion.p>
        </div>

        {/* ── Bento grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0  }}
          transition={{ delay: 0.22, type: 'spring', stiffness: 160, damping: 22 }}
          className="w-full max-w-2xl flex flex-col md:flex-row gap-3"
        >

          {/* ── Scanner — dominant left card ── */}
          <Link to="/scanner" className="block md:flex-[1.65]">
            <motion.div
              whileHover={{ y: -6, boxShadow: '0 36px 72px rgba(109,40,217,0.35)' }}
              whileTap={{   scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="relative bg-gradient-to-br from-brand-700 via-violet-600 to-indigo-500
                         rounded-3xl p-6 sm:p-7 text-white cursor-pointer flex flex-col
                         overflow-hidden shadow-2xl shadow-brand-700/25"
              style={{ minHeight: 280 }}
            >
              {/* Inner glow blobs */}
              <div className="absolute -top-14 -right-14 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

              {/* Viewfinder */}
              <Viewfinder />

              {/* Text content pinned to bottom */}
              <div className="relative z-10 mt-auto pt-5">
                <div className="font-black text-2xl tracking-tight mb-1.5">Scanner</div>
                <div className="text-purple-100 text-sm leading-relaxed mb-5">
                  Point your phone at a guest's QR ticket to check them in instantly.
                </div>
                <div className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30
                                backdrop-blur-sm text-white text-sm font-bold px-4 py-2.5
                                rounded-xl transition-colors">
                  Open Scanner
                  <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    →
                  </motion.span>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* ── Right column ── */}
          <div className="md:flex-1 flex flex-col gap-3">

            {/* Admin card */}
            <Link to="/admin" className="block flex-1">
              <motion.div
                whileHover={{ y: -5, boxShadow: '0 20px 48px rgba(0,0,0,0.12)' }}
                whileTap={{   scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="h-full bg-white/70 backdrop-blur-md border border-white/80
                           rounded-3xl p-5 cursor-pointer flex flex-col shadow-sm"
                style={{ minHeight: 140 }}
              >
                {/* Spinning gear + abstract stats bars */}
                <div className="mb-3">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    className="text-3xl select-none inline-block"
                  >
                    ⚙️
                  </motion.span>
                  <div className="flex gap-1.5 mt-2 items-center">
                    <div className="h-1.5 w-12 rounded-full bg-brand-300" />
                    <div className="h-1.5 w-7  rounded-full bg-green-300" />
                    <div className="h-1.5 w-4  rounded-full bg-amber-300" />
                  </div>
                </div>

                <div className="font-bold text-gray-900 mb-1">Admin Panel</div>
                <div className="text-gray-500 text-xs leading-relaxed flex-1">
                  Register guests &amp; generate QR tickets
                </div>
                <div className="text-xs font-bold text-brand-700 mt-3 flex items-center gap-1">
                  Open Admin
                  <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}>
                    →
                  </motion.span>
                </div>
              </motion.div>
            </Link>

            {/* Feature grid card */}
            <div className="bg-white/50 backdrop-blur-md border border-white/70 rounded-3xl p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.38 + i * 0.07 }}
                    className="flex items-center gap-2 text-xs text-gray-600 font-medium"
                  >
                    <span className="text-sm leading-none">{f.icon}</span>
                    {f.label}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </main>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center py-4 text-xs border-t border-white/40 bg-white/30 backdrop-blur-sm"
      >
        <p className="text-gray-500">Open Admin on your computer &bull; Open Scanner on your Samsung phone</p>
        <p className="mt-1 text-gray-400">
          Made with <span className="text-red-400">♥</span> by{' '}
          <span className="font-semibold text-brand-700">Rahul Dahiya</span>
        </p>
      </motion.footer>
    </motion.div>
  );
}
