import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import SessionTimeout from './components/SessionTimeout';
import OnboardingTour from './components/OnboardingTour';
import AIChatWidget from './components/AIChatWidget';
import { authService } from './services/api';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Bitacora = lazy(() => import('./pages/Bitacora'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Login = lazy(() => import('./pages/Login'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const ForceChangePassword = lazy(() => import('./pages/ForceChangePassword'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false },
  },
});

const PrivateRoute = ({ children, requireRole = null }) => {
  const user = authService.getCurrentUser();
  const location = useLocation();

  if (!user.token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.must_change_password && location.pathname !== '/force-change-password') {
    return <Navigate to="/force-change-password" replace />;
  }

  if (requireRole === 'admin' && user.rol !== 'admin') {
     return <Navigate to="/" replace />;
  }
  if (requireRole === 'tecnico' && user.rol !== 'admin' && user.rol !== 'tecnico') {
     return <Navigate to="/" replace />;
  }

  return children;
};

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--violet)' }} />
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Cargando...</span>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ErrorBoundary>
            <SessionTimeout />
            <OnboardingTour />
            <div className="w-full min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-1)' }}>
              <Navbar />
              <main className="flex-1 w-full relative">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/force-change-password" element={<PrivateRoute><ForceChangePassword /></PrivateRoute>} />
                    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/bitacora" element={<PrivateRoute requireRole="tecnico"><Bitacora /></PrivateRoute>} />
                    <Route path="/configuracion" element={<PrivateRoute requireRole="admin"><Configuracion /></PrivateRoute>} />
                    <Route path="/usuarios" element={<PrivateRoute requireRole="admin"><Usuarios /></PrivateRoute>} />
                  </Routes>
                </Suspense>
                <AIChatWidget />
              </main>
            </div>
          </ErrorBoundary>
        </Router>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ style: { fontFamily: 'Geist, sans-serif', fontSize: '13px' } }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
