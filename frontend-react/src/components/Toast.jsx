import { AnimatePresence, motion } from 'framer-motion';

const BG = {
  success: 'bg-green-700',
  error:   'bg-red-700',
  info:    'bg-indigo-600',
};

export default function Toast({ message, type = 'info' }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message + type}
          initial={{ opacity: 0, y: 48, scale: 0.9 }}
          animate={{ opacity: 1, y: 0,  scale: 1   }}
          exit={{    opacity: 0, y: 48, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none
            ${BG[type] ?? 'bg-gray-900'}
            text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl whitespace-nowrap`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
