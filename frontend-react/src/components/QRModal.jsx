import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { getInitials, getAvatarColor } from '../utils/avatar';

const EVENT_NAME = import.meta.env.VITE_EVENT_NAME || 'My Party 2026';

export default function QRModal({ guest, onClose }) {
  const qrRef = useRef(null);

  const handleDownload = () => {
    const srcCanvas = qrRef.current?.querySelector('canvas');
    if (!srcCanvas) return;

    const pad = 28, qrSize = 200;
    const cw = qrSize + pad * 2;
    const ch = qrSize + pad * 2 + 88;
    const out = document.createElement('canvas');
    out.width = cw; out.height = ch;
    const ctx = out.getContext('2d');

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, cw, ch);

    const g = ctx.createLinearGradient(0, 0, cw, 0);
    g.addColorStop(0, '#6d28d9'); g.addColorStop(1, '#4f46e5');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, 10);
    ctx.fillRect(0, ch - 10, cw, 10);

    ctx.fillStyle = '#6d28d9';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(EVENT_NAME.toUpperCase(), cw / 2, 28);

    ctx.drawImage(srcCanvas, pad, 36);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(guest.name, cw / 2, 36 + qrSize + 28);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('Ticket · ' + guest.ticket_id.substring(0, 18) + '…', cw / 2, 36 + qrSize + 48);

    ctx.fillStyle = '#6d28d9';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('Scan to enter', cw / 2, 36 + qrSize + 68);

    const firstName = guest.name.trim().split(/\s+/)[0];
    const link = document.createElement('a');
    link.download = `${firstName}_ticket.png`;
    link.href = out.toDataURL('image/png');
    link.click();
  };

  return (
    <AnimatePresence>
      {guest && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{    opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.88, y: 24, opacity: 0 }}
            animate={{ scale: 1,    y: 0,  opacity: 1 }}
            exit={{    scale: 0.88, y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="bg-white rounded-2xl p-6 w-full max-w-xs text-center relative shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-md
                         flex items-center justify-center text-gray-400 text-xs font-bold transition-colors"
            >
              ✕
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.08 }}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg
                         font-bold mx-auto mb-3"
              style={{ background: getAvatarColor(guest.name) }}
            >
              {getInitials(guest.name)}
            </motion.div>

            <div className="text-lg font-bold text-gray-900">{guest.name}</div>
            <div className="text-sm text-gray-400 mb-3">{guest.phone || 'No phone'}</div>

            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md ${
              guest.checked_in
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {guest.checked_in ? '✓ Checked In' : '⏳ Pending'}
            </span>

            <div
              ref={qrRef}
              className="flex justify-center my-4 p-3 bg-gray-50 rounded-xl border border-gray-100"
            >
              <QRCodeCanvas value={guest.ticket_id} size={180} level="H" />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{  scale: 0.98 }}
              onClick={handleDownload}
              className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold text-sm
                         py-3 rounded-xl transition-colors"
            >
              ⬇ Download Ticket Image
            </motion.button>
            <p className="text-xs text-gray-400 mt-2">Save and send via WhatsApp to your guest</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
