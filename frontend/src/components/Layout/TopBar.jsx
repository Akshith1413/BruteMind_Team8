/**
 * TopBar.jsx — Cortex OS Command Header
 * Global header with logo, theme toggle, mute toggle, socket status, and user badge.
 */
import { useAuthStore } from '../../store/authStore';
import { useDashboardStore } from '../../store/dashboardStore';
import { AudioSynth } from '../../utils/AudioSynth';
import {
  Sun, Moon, Volume2, VolumeX, LogOut, Wifi, WifiOff, Activity,
} from 'lucide-react';
import ModelSelector from './ModelSelector';

export default function TopBar() {
  const { user, logout, theme, toggleTheme, isMuted, toggleMute } = useAuthStore();
  const { socketConnected } = useDashboardStore();

  return (
    <header className="tb-root">
      {/* Left — Title */}
      <div className="tb-left">
        <Activity size={18} className="tb-pulse" />
        <span className="tb-title text-tech glow-text">CORTEX OS</span>
        <span className="tb-subtitle text-mono">// COMMAND TERMINAL v2.0</span>
      </div>

      {/* Right — Controls */}
      <div className="tb-right">
        {/* Socket status */}
        <div className={`tb-status ${socketConnected ? 'tb-online' : 'tb-offline'}`} title={socketConnected ? 'Socket Connected' : 'Socket Disconnected'}>
          {socketConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="text-mono">{socketConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        {/* Model Selector */}
        <ModelSelector />

        {/* Theme Toggle */}
        <button className="tb-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Mute Toggle */}
        <button className="tb-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* User Badge */}
        <div className="tb-user text-mono">
          <div className="tb-avatar">{user?.username?.[0]?.toUpperCase() || 'A'}</div>
          <span className="tb-username">{user?.username || 'Operator'}</span>
        </div>

        {/* Logout */}
        <button className="tb-btn tb-logout" onClick={logout} title="Terminate Session">
          <LogOut size={16} />
        </button>
      </div>

      <style>{`
        .tb-root {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
          padding: 0 20px;
          background: var(--glass-bg);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid var(--glass-border);
          z-index: 30;
          flex-shrink: 0;
        }

        .tb-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tb-pulse {
          color: var(--accent-primary);
          animation: tbBeat 1.8s ease-in-out infinite;
        }

        @keyframes tbBeat {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }

        .tb-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--text-primary);
        }

        .tb-subtitle {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 1px;
        }

        .tb-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tb-status {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          letter-spacing: 1px;
          padding: 5px 10px;
          border-radius: 6px;
          border: 1px solid var(--glass-border);
          background: var(--neumorphic-press);
        }

        .tb-online {
          color: #22c55e;
          border-color: rgba(34, 197, 94, 0.2);
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.15);
        }

        .tb-offline {
          color: var(--text-muted);
        }

        .tb-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .tb-btn:hover {
          color: var(--accent-primary);
          border-color: var(--glass-border-focus);
          box-shadow: 0 0 10px var(--accent-glow);
          background: var(--neumorphic-press);
        }

        .tb-logout:hover {
          color: var(--accent-warn);
          border-color: var(--accent-warn);
          box-shadow: 0 0 10px var(--accent-warn-glow);
        }

        .tb-user {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px 4px 4px;
          border-radius: 8px;
          border: 1px solid var(--glass-border);
          background: var(--neumorphic-press);
        }

        .tb-avatar {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          color: #fff;
        }

        .tb-username {
          font-size: 11px;
          letter-spacing: 0.8px;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .tb-subtitle, .tb-username, .tb-status span { display: none; }
          .tb-root { padding: 0 12px; }
        }
      `}</style>
    </header>
  );
}
