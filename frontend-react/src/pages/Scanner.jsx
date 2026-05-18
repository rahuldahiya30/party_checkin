import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

// ── Audio helpers ─────────────────────────────────────────────────────────────
function tone(notes) {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach(([freq, start, dur, type = 'sine']) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.25, ac.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + dur);
      o.start(ac.currentTime + start);
      o.stop(ac.currentTime + start + dur + 0.01);
    });
  } catch {}
}

const playSuccess = () => tone([[880,0,.13],[1100,.1,.13],[1320,.2,.28]]);
const playWarning = () => tone([[600,0,.15,'triangle'],[500,.18,.2,'triangle']]);
const playError   = () => tone([[280,0,.4,'sawtooth']]);

function shootConfetti() {
  const cfg = { origin: { y: 0.65 }, colors: ['#7c3aed','#4f46e5','#22c55e','#fbbf24','#f472b6'] };
  confetti({ ...cfg, particleCount: 70,  spread: 55,  startVelocity: 62 });
  confetti({ ...cfg, particleCount: 45,  spread: 85,  decay: 0.91 });
  confetti({ ...cfg, particleCount: 35,  spread: 125, startVelocity: 32 });
}

// ── Scan frame overlay ────────────────────────────────────────────────────────
function ScanFrame() {
  const c = (pos) => ({
    position: 'absolute', width: 28, height: 28,
    borderColor: 'white', borderStyle: 'solid', ...pos,
  });
  return (
    <div style={{ position: 'absolute', width: 240, height: 240, top: '50%', left: '50%', transform: 'translate(-50%,-52%)' }}>
      <div style={c({ top:0,    left:0,  borderWidth:'2.5px 0 0 2.5px', borderRadius:'4px 0 0 0'    })} />
      <div style={c({ top:0,    right:0, borderWidth:'2.5px 2.5px 0 0', borderRadius:'0 4px 0 0'    })} />
      <div style={c({ bottom:0, left:0,  borderWidth:'0 0 2.5px 2.5px', borderRadius:'0 0 0 4px'    })} />
      <div style={c({ bottom:0, right:0, borderWidth:'0 2.5px 2.5px 0', borderRadius:'0 0 4px 0'    })} />
      <div
        className="scan-line-anim"
        style={{
          position:'absolute', left:3, right:3, height:2, top:3,
          background:'linear-gradient(to right,transparent,#a78bfa,#7c3aed,#a78bfa,transparent)',
          boxShadow:'0 0 8px rgba(124,58,237,0.8)', borderRadius:2,
        }}
      />
    </div>
  );
}

// ── Result config map ─────────────────────────────────────────────────────────
const RESULT_CFG = {
  success:          { bg: '#15803d', icon: '✓', title: (r) => `Welcome, ${r.guest?.name}!`, sub: () => 'Attendance marked'   },
  already_checked_in:{ bg: '#b45309', icon: '!', title: ()  => 'Already Checked In',        sub: (r) => r.message            },
  not_found:        { bg: '#b91c1c', icon: '✗', title: ()  => 'Invalid Ticket',             sub: () => 'QR code not recognised' },
  network:          { bg: '#b91c1c', icon: '✗', title: ()  => 'Network Error',              sub: (r) => r.message            },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function Scanner() {
  const [phase,   setPhase]   = useState('start'); // 'start' | 'active'
  const [result,  setResult]  = useState(null);
  const [counter, setCounter] = useState(null);
  const [torch,   setTorch]   = useState(false);
  const [camErr,  setCamErr]  = useState('');

  const scannerRef       = useRef(null);
  const processingRef    = useRef(false);
  const lastTicketRef    = useRef(null);
  const resumeTimeoutRef = useRef(null);

  // Always-fresh callback via ref
  const onScanRef = useRef(null);
  onScanRef.current = async (ticketId) => {
    if (processingRef.current)          return;
    if (ticketId === lastTicketRef.current) return;

    processingRef.current = true;
    scannerRef.current?.pause(false); // keep video stream alive — no re-permission needed

    try {
      const data = await api.scanTicket(ticketId);
      lastTicketRef.current = ticketId;
      setResult(data);

      if (data.success) {
        setCounter(c => c ? { ...c, checked: c.checked + 1 } : c);
        setTimeout(shootConfetti, 80);
        playSuccess();
      } else if (data.error === 'already_checked_in') {
        playWarning();
      } else {
        playError();
      }
    } catch {
      setResult({ success: false, error: 'network', message: 'Network error. Try again.' });
      playError();
    }

    resumeTimeoutRef.current = setTimeout(() => {
      setResult(null);
      processingRef.current = false;
      scannerRef.current?.resume();
      resumeTimeoutRef.current = null;
    }, 3000);
  };

  // Start camera when phase → active
  useEffect(() => {
    if (phase !== 'active') return;

    let cancelled = false;
    let cleanup = () => {};

    const tryInit = () => {
      if (cancelled) return;
      if (!document.getElementById('camera-feed')) {
        requestAnimationFrame(tryInit);
        return;
      }

      const scanner = new Html5Qrcode('camera-feed');
      scannerRef.current = scanner;
      const interval = setInterval(fetchCounter, 30000);

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.7778 },
          (id) => onScanRef.current(id),
          () => {}
        )
        .then(() => fetchCounter())
        .catch(err => setCamErr('Camera error: ' + (err?.message || err)));

      cleanup = () => {
        clearInterval(interval);
        scanner.stop().catch(() => {});
        scannerRef.current = null;
      };
    };

    requestAnimationFrame(tryInit);

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [phase]);

  const fetchCounter = async () => {
    try {
      const data = await api.getGuests();
      setCounter({
        checked: data.guests.filter(g => g.checked_in).length,
        total:   data.guests.length,
      });
    } catch {}
  };

  const toggleTorch = async () => {
    try {
      const next = !torch;
      setTorch(next);
      await scannerRef.current?.applyVideoConstraints({ advanced: [{ torch: next }] });
    } catch { setTorch(false); }
  };

  const resumeNow = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = null;
    setResult(null);
    processingRef.current = false;
    scannerRef.current?.resume();
  };

  const resultKey = result ? (result.success ? 'success' : result.error) : null;
  const cfg       = resultKey ? RESULT_CFG[resultKey] : null;

  return (
    <div className="h-dvh overflow-hidden select-none" style={{ WebkitUserSelect: 'none' }}>

      {/* ── Start screen ── */}
      <AnimatePresence mode="wait">
        {phase === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col"
          >
            {/* Nav */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                ← Home
              </Link>
              <span className="text-sm font-bold text-gray-800">QR Scanner</span>
              <div className="w-14" />
            </div>

            {/* Hero */}
            <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">

              {/* Camera icon with pulsing rings */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.1 }}
                className="relative mb-8"
              >
                {[0, 1].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.6, delay: i * 0.65, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute rounded-full border-2 border-brand-400"
                    style={{ inset: `${-(i + 1) * 14}px` }}
                  />
                ))}
                <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center text-5xl relative z-10">
                  📷
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0  }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-black text-gray-900 mb-3"
              >
                Ready to Scan
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0  }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 text-sm leading-relaxed max-w-64"
              >
                Tap below to open the camera and start scanning guest tickets at the entrance.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0  }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.04, boxShadow: '0 12px 32px rgba(109,40,217,0.3)' }}
                whileTap={{   scale: 0.97 }}
                onClick={() => setPhase('active')}
                className="mt-8 bg-brand-700 hover:bg-brand-800 text-white font-bold text-base
                           py-4 rounded-2xl w-full max-w-xs shadow-lg shadow-brand-200 transition-colors"
              >
                Start Camera
              </motion.button>

              {camErr && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-red-500 text-sm text-center px-4"
                >
                  {camErr}
                </motion.p>
              )}

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="mt-5 text-xs text-gray-300"
              >
                💡 Use Chrome on Android for best results
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* ── Scan screen ── */}
        {phase === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full bg-black flex flex-col relative"
          >
            {/* Top bar */}
            <div
              className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3.5"
              style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.72),transparent)' }}
            >
              <Link
                to="/"
                className="text-white text-xs font-medium px-3 py-1.5 rounded-full
                           border border-white/20 bg-white/10 backdrop-blur-sm"
              >
                ← Home
              </Link>
              <div className="flex items-center gap-2">
                {counter && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1   }}
                    className="text-white text-xs font-semibold px-3 py-1.5 rounded-full
                               border border-white/20 bg-white/10 backdrop-blur-sm"
                  >
                    {counter.checked} / {counter.total} ✓
                  </motion.div>
                )}
                <button
                  onClick={toggleTorch}
                  className="w-9 h-9 rounded-full border border-white/20 bg-white/10
                             backdrop-blur-sm flex items-center justify-center text-base"
                >
                  {torch ? '🔦' : '💡'}
                </button>
              </div>
            </div>

            {/* Camera */}
            <div id="camera-feed" className="flex-1 overflow-hidden" />

            {/* Vignette + scan frame */}
            <div
              className="fixed inset-0 z-10 pointer-events-none"
              style={{ background:'radial-gradient(ellipse 270px 270px at 50% 44%,transparent 115px,rgba(0,0,0,0.5) 155px)' }}
            >
              <ScanFrame />
            </div>

            {/* Status */}
            <div
              className="fixed bottom-0 left-0 right-0 z-10 text-center pb-8 pt-5 pointer-events-none"
              style={{ background:'linear-gradient(to top,rgba(0,0,0,0.7),transparent)' }}
            >
              <span className="text-white/70 text-sm font-medium">Point camera at a QR code</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Result overlay ── */}
      <AnimatePresence>
        {result && cfg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1    }}
            exit={{    opacity: 0, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: cfg.bg }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 20, delay: 0.07 }}
              className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-5"
            >
              <span className="text-5xl font-black text-white">{cfg.icon}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0   }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-black text-white text-center px-6 tracking-tight"
            >
              {cfg.title(result)}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0   }}
              transition={{ delay: 0.18 }}
              className="text-white/80 text-sm mt-2 text-center px-8 leading-relaxed"
            >
              {cfg.sub(result)}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={resumeNow}
              className="mt-8 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white
                         font-bold text-base px-10 py-3.5 rounded-2xl border border-white/30
                         transition-colors"
            >
              Scan Next →
            </motion.button>
            <p className="text-white/40 text-xs mt-3">Auto-resuming in 3s</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
