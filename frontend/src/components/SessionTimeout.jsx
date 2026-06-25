import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { toast } from 'sonner';

const TIMEOUT = 10 * 60 * 1000;

const SessionTimeout = () => {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user.token) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        toast.warning('Sesión expirada por inactividad');
        authService.logout();
        navigate('/login');
      }, TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate]);

  return null;
};

export default SessionTimeout;
