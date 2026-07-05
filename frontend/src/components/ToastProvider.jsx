/**
 * ToastProvider.jsx — Cortex OS Global Notification System
 * Provides a toast context and renders stacked toast notifications with animations.
 */
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: 'var(--accent-primary)',
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const containerRef = useRef(null);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" ref={containerRef}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      <style>{`
        .toast-container {
          position: fixed; bottom: 24px; right: 24px;
          display: flex; flex-direction: column-reverse; gap: 10px;
          z-index: 99999; pointer-events: none; max-width: 380px;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const ref = useRef(null);
  const Icon = ICONS[toast.type] || Info;
  const color = COLORS[toast.type] || COLORS.info;

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current,
        { x: 80, opacity: 0, scale: 0.9 },
        { x: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' }
      );
    }
  }, []);

  const handleClose = () => {
    if (ref.current) {
      gsap.to(ref.current, { x: 80, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: onClose });
    } else {
      onClose();
    }
  };

  return (
    <div className="toast-item" ref={ref} style={{ borderLeftColor: color }}>
      <Icon size={18} style={{ color, flexShrink: 0 }} />
      <span className="toast-msg">{toast.message}</span>
      <button className="toast-close" onClick={handleClose}><X size={14} /></button>

      <style>{`
        .toast-item {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; min-width: 300px;
          background: var(--glass-bg); backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border); border-left: 3px solid;
          border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          pointer-events: all; cursor: default;
        }
        .toast-msg {
          flex: 1; font-size: 12px; color: var(--text-primary);
          font-family: var(--font-mono); letter-spacing: 0.3px; line-height: 1.4;
        }
        .toast-close {
          background: none; border: none; color: var(--text-muted);
          cursor: pointer; padding: 2px; transition: color 0.2s;
          display: flex; align-items: center;
        }
        .toast-close:hover { color: var(--text-primary); }
      `}</style>
    </div>
  );
}
