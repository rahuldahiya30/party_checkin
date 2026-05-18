import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home    from './pages/Home';
import Admin   from './pages/Admin';
import Scanner from './pages/Scanner';
import Login   from './pages/Login';
import { auth } from './utils/auth';

function ProtectedRoute({ children }) {
  return auth.check() ? children : <Navigate to="/login" replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"        element={<Home />}    />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/login"   element={<Login />}   />
        <Route path="/admin"   element={
          <ProtectedRoute><Admin /></ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Shared gradient background — fixed so it never scrolls away */}
      <div
        className="fixed inset-0 -z-10 dot-grid"
        style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #ddd6fe 35%, #c7d2fe 65%, #bfdbfe 100%)' }}
        aria-hidden
      />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
