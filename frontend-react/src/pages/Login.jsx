import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../utils/auth';

export default function Login() {
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const userRef = useRef(null);
  const passRef = useRef(null);
  const navigate = useNavigate();

  // Already logged in → skip straight to admin
  useEffect(() => {
    if (auth.check()) navigate('/admin', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Small deliberate delay so the button state is visible
    await new Promise(r => setTimeout(r, 380));

    const ok = auth.login(
      userRef.current.value.trim(),
      passRef.current.value,
    );

    if (ok) {
      navigate('/admin', { replace: true });
    } else {
      setError('Invalid username or password.');
      setLoading(false);
      passRef.current.value = '';
      passRef.current.focus();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{    opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen flex flex-col items-center justify-center px-5"
    >
      <motion.div
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1,    y: 0,  opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24, delay: 0.05 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          {/* Icon with outer glow */}
          <div className="relative flex justify-center mb-4">
            {/* Glow layer — must sit outside overflow-hidden */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-indigo-400
                              rounded-[28px] blur-2xl opacity-55" />
            </div>
            <Link to="/">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 360, damping: 20, delay: 0.12 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-20 h-20 bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-600
                           rounded-[28px] flex items-center justify-center overflow-hidden
                           shadow-2xl shadow-brand-500/40 ring-1 ring-white/25 cursor-pointer"
                title="Back to Home"
              >
                {/* Gloss shine */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                <span className="relative z-10 text-4xl leading-none">🎉</span>
              </motion.div>
            </Link>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Access</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your guest list</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-brand-200/20
                        p-7 border border-white/80">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Username
              </label>
              <input
                ref={userRef}
                type="text"
                placeholder="admin"
                autoComplete="username"
                required
                autoFocus
                className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm
                           focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100
                           bg-gray-50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                ref={passRef}
                type="password"
                placeholder="••••••"
                autoComplete="current-password"
                required
                className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm
                           focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100
                           bg-gray-50 focus:bg-white transition"
              />
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  key="err"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1,  y: 0  }}
                  exit={{    opacity: 0          }}
                  className="text-xs text-red-600 bg-red-50 border border-red-200
                             rounded-xl px-3.5 py-2.5"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{   scale: 0.98 }}
              className="bg-gradient-to-r from-brand-700 to-indigo-500 hover:from-brand-800
                         hover:to-indigo-600 disabled:opacity-60 text-white font-bold
                         py-3 rounded-xl transition shadow-sm shadow-brand-200 mt-1"
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </motion.button>
          </form>
        </div>

        {/* Quick navigation */}
        <div className="flex items-center justify-center mt-5">
          <Link
            to="/scanner"
            className="text-sm font-bold text-brand-700 hover:text-brand-900
                       flex items-center gap-2 bg-white/70 hover:bg-white/90
                       backdrop-blur-sm border border-brand-200 hover:border-brand-400
                       px-5 py-2.5 rounded-xl shadow-sm transition-all"
          >
            📷 Open Scanner
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Made with <span className="text-red-400">♥</span> by{' '}
          <span className="font-semibold text-brand-700">Rahul Dahiya</span>
        </p>
      </motion.div>
    </motion.div>
  );
}
