import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Lock, Eye, EyeOff, ShieldAlert, LogOut } from 'lucide-react';

/* ─── Estilos (Manteniendo la estética premium de Login) ────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap');

  :root {
    --violet:      #7c3aed;
    --violet-mid:  #8b5cf6;
    --fuchsia:     #a21caf;
    --surface:     #ffffff;
    --surface-2:   #fafafa;
    --border:      #e4e4e7;
    --text-1:      #09090b;
    --text-2:      #52525b;
    --text-3:      #a1a1aa;
    --radius-md:   10px;
    --radius-lg:   14px;
  }

  .lg-root * { font-family: 'Geist', sans-serif; box-sizing: border-box; -webkit-font-smoothing: antialiased; }

  .lg-wrap {
    min-height: 100vh;
    display: flex;
    background: var(--text-1);
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  /* Background elements */
  .lg-wrap::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 20% 10%, rgba(124,58,237,0.28) 0%, transparent 55%),
      radial-gradient(ellipse 60% 50% at 90% 90%, rgba(162,28,175,0.2)  0%, transparent 55%);
    pointer-events: none;
  }

  .lg-wrap::after {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  .fc-container {
    background: var(--surface);
    width: 100%;
    max-width: 440px;
    padding: 40px 32px;
    border-radius: var(--radius-lg);
    box-shadow: 0 24px 48px rgba(0,0,0,0.2);
    position: relative;
    z-index: 10;
  }

  .lg-form-header { margin-bottom: 24px; text-align: center; }
  .lg-form-eyebrow {
    font-size: 10px; font-weight: 800;
    letter-spacing: .16em; text-transform: uppercase;
    color: var(--fuchsia); margin-bottom: 8px;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .lg-form-title {
    font-size: 24px; font-weight: 800;
    color: var(--text-1); letter-spacing: -0.025em; line-height: 1.1;
  }
  .lg-form-sub {
    font-size: 13px; color: var(--text-3); font-weight: 500; margin-top: 8px;
  }

  .lg-error {
    display: flex; align-items: flex-start; gap: 8px;
    background: #fef2f2; border: 1px solid #fecaca;
    color: #dc2626; font-size: 12px; font-weight: 600;
    padding: 10px 14px; border-radius: var(--radius-md);
    margin-bottom: 20px;
  }

  .lg-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
  .lg-field-label {
    font-size: 10.5px; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase;
    color: var(--text-2);
  }
  .lg-field-wrap { position: relative; display: flex; align-items: center; }
  .lg-field-icon {
    position: absolute; left: 12px;
    color: var(--text-3); pointer-events: none;
    display: flex; align-items: center;
  }
  .lg-input {
    width: 100%;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 10px 12px 10px 38px;
    font-family: 'Geist', sans-serif;
    font-size: 13.5px; font-weight: 500;
    color: var(--text-1);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .lg-input:focus {
    border-color: var(--violet-mid);
    box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
    background: var(--surface);
  }
  .lg-input-pass { padding-right: 42px; }

  .lg-eye-btn {
    position: absolute; right: 10px;
    background: none; border: none; cursor: pointer;
    color: var(--text-3); padding: 4px;
    display: flex; align-items: center;
    border-radius: var(--radius-md);
  }
  .lg-eye-btn:hover { color: var(--text-2); }

  .lg-submit-btn {
    width: 100%;
    background: linear-gradient(135deg, var(--violet), var(--fuchsia));
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: 11px 20px;
    font-size: 14px; font-weight: 700;
    cursor: pointer;
    margin-top: 10px;
    transition: opacity 0.15s, transform 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 7px;
  }
  .lg-submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .lg-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: translateY(0); }

  .logout-btn {
    width: 100%;
    background: transparent;
    color: var(--text-3);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 9px 20px;
    font-size: 13px; font-weight: 600;
    cursor: pointer;
    margin-top: 10px;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: all 0.15s;
  }
  .logout-btn:hover { background: var(--surface-3); color: var(--text-2); }

  .lg-fadein { animation: lg-fadein 0.4s cubic-bezier(.16,1,.3,1) both; }
  @keyframes lg-fadein {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const ForceChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = authService.getCurrentUser();
      await authService.changePasswordFirstLogin(user.username, oldPassword, newPassword);
      
      // Actualizar localStorage
      localStorage.setItem('must_change_password', 'false');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-root lg-wrap">
      <style>{STYLES}</style>
      
      <div className="fc-container lg-fadein">
        <div className="lg-form-header">
          <div className="lg-form-eyebrow">
            <ShieldAlert size={14} />
            Acción Requerida
          </div>
          <h1 className="lg-form-title">Actualiza tu contraseña</h1>
          <p className="lg-form-sub">Por políticas de seguridad, debes cambiar la contraseña proporcionada por el administrador antes de continuar.</p>
        </div>

        {error && (
          <div className="lg-error">
            <Lock size={14} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Contraseña Actual */}
          <div className="lg-field">
            <label className="lg-field-label">Contraseña Actual</label>
            <div className="lg-field-wrap">
              <input
                type={showOld ? 'text' : 'password'}
                required
                disabled={loading}
                placeholder="Ingresa tu contraseña actual"
                className="lg-input lg-input-pass"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
              />
              <span className="lg-field-icon"><Lock size={15} /></span>
              <button type="button" className="lg-eye-btn" onClick={() => setShowOld(!showOld)} tabIndex={-1}>
                {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div className="lg-field mt-4">
            <label className="lg-field-label">Nueva Contraseña</label>
            <div className="lg-field-wrap">
              <input
                type={showNew ? 'text' : 'password'}
                required
                disabled={loading}
                placeholder="Min. 8 caracteres, números y especiales"
                className="lg-input lg-input-pass"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <span className="lg-field-icon"><Lock size={15} /></span>
              <button type="button" className="lg-eye-btn" onClick={() => setShowNew(!showNew)} tabIndex={-1}>
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div className="lg-field">
            <label className="lg-field-label">Confirmar Nueva Contraseña</label>
            <div className="lg-field-wrap">
              <input
                type={showNew ? 'text' : 'password'}
                required
                disabled={loading}
                placeholder="Repite tu nueva contraseña"
                className="lg-input lg-input-pass"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <span className="lg-field-icon"><Lock size={15} /></span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="lg-submit-btn">
            {loading ? 'Actualizando...' : 'Guardar y Continuar'}
          </button>
        </form>

        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={14} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default ForceChangePassword;
