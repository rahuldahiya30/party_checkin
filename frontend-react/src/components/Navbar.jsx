import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const LINKS = [
  { to: '/',        label: 'Home'    },
  { to: '/admin',   label: 'Admin'   },
  { to: '/scanner', label: 'Scanner' },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-sm sticky top-0 z-40 px-5"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14">

        <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 text-[15px] select-none">
          <div className="relative w-8 h-8 bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-500
                          rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0
                          shadow-md shadow-brand-400/50 ring-1 ring-white/30">
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <span className="relative z-10 text-[15px] leading-none">🎉</span>
          </div>
          Party Check-In
        </Link>

        <div className="flex gap-1">
          {LINKS.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  active ? 'text-brand-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-brand-100 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </div>

      </div>
    </motion.nav>
  );
}
