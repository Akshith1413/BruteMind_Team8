/**
 * Profile.jsx — Cortex OS User Profile & Activity Dashboard
 * Displays user info, activity timeline, and usage statistics.
 */
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDashboardStore } from '../../store/dashboardStore';
import { AudioSynth } from '../../utils/AudioSynth';
import gsap from 'gsap';
import {
  User, Shield, Clock, Activity, LogOut, Edit3, Camera,
  BarChart3, Brain, Zap, Calendar, CheckCircle2
} from 'lucide-react';

const ACTIVITY_LOG = [
  { action: 'Ran buyer simulation', time: '2 min ago', icon: Zap, color: 'var(--accent-primary)' },
  { action: 'Exported boardroom debate', time: '15 min ago', icon: BarChart3, color: '#a855f7' },
  { action: 'Uploaded company PDF', time: '1 hr ago', icon: CheckCircle2, color: '#22c55e' },
  { action: 'Created LinkedIn Growth campaign', time: '3 hrs ago', icon: Brain, color: '#f59e0b' },
  { action: 'AI Copilot strategy session', time: '5 hrs ago', icon: Activity, color: '#ec4899' },
  { action: 'Signed in to Cortex OS', time: '6 hrs ago', icon: Shield, color: 'var(--accent-primary)' },
];

const USAGE_STATS = [
  { label: 'AI Queries', value: '247', icon: Brain },
  { label: 'Campaigns Created', value: '14', icon: BarChart3 },
  { label: 'Simulations Run', value: '38', icon: Zap },
  { label: 'Documents Uploaded', value: '9', icon: Calendar },
];

export default function Profile() {
  const { user, logout } = useAuthStore();
  const { appMode } = useDashboardStore();
  const rootRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || user?.email?.split('@')[0] || 'Operator');

  useEffect(() => {
    if (rootRef.current) {
      gsap.fromTo(
        rootRef.current.querySelectorAll('.pf-section'),
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power3.out' }
      );
    }
  }, []);

  const handleLogout = () => {
    AudioSynth.playTransition();
    setTimeout(() => logout(), 400);
  };

  const initials = displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="pf-root" ref={rootRef}>
      {/* Profile Header Card */}
      <div className="pf-section pf-hero">
        <div className="pf-hero-bg" />
        <div className="pf-hero-content">
          <div className="pf-avatar-wrap">
            <div className="pf-avatar">{initials}</div>
            <button className="pf-avatar-edit"><Camera size={12} /></button>
          </div>
          <div className="pf-hero-info">
            <div className="pf-name-row">
              {editing ? (
                <input
                  className="pf-name-input text-tech"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={() => setEditing(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
                  autoFocus
                />
              ) : (
                <h2 className="pf-name text-tech">{displayName}</h2>
              )}
              <button className="pf-edit-btn" onClick={() => { setEditing(!editing); AudioSynth.playClick(); }}>
                <Edit3 size={13} />
              </button>
            </div>
            <p className="pf-email text-mono">{user?.email || 'operator@cortex.ai'}</p>
            <div className="pf-badges">
              <span className="pf-badge text-mono"><Shield size={10} /> ADMIN</span>
              <span className="pf-badge pf-badge-mode text-mono">{appMode.toUpperCase()} MODE</span>
            </div>
          </div>
          <button className="pf-logout-btn text-mono" onClick={handleLogout}>
            <LogOut size={14} /> SIGN OUT
          </button>
        </div>
      </div>

      <div className="pf-grid">
        {/* Usage Stats */}
        <div className="pf-section pf-stats-card">
          <div className="pf-card-title text-mono"><BarChart3 size={13} /> USAGE STATISTICS</div>
          <div className="pf-stats-grid">
            {USAGE_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="pf-stat">
                  <div className="pf-stat-icon"><Icon size={16} /></div>
                  <div className="pf-stat-value text-tech">{stat.value}</div>
                  <div className="pf-stat-label text-mono">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="pf-section pf-activity-card">
          <div className="pf-card-title text-mono"><Clock size={13} /> RECENT ACTIVITY</div>
          <div className="pf-timeline">
            {ACTIVITY_LOG.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="pf-timeline-item">
                  <div className="pf-timeline-dot" style={{ borderColor: item.color }}>
                    <Icon size={12} style={{ color: item.color }} />
                  </div>
                  {i < ACTIVITY_LOG.length - 1 && <div className="pf-timeline-line" />}
                  <div className="pf-timeline-content">
                    <span className="pf-timeline-action">{item.action}</span>
                    <span className="pf-timeline-time text-mono">{item.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Info */}
        <div className="pf-section pf-security-card">
          <div className="pf-card-title text-mono"><Shield size={13} /> SECURITY</div>
          <div className="pf-sec-rows">
            <div className="pf-sec-row">
              <span className="pf-sec-label text-mono">SESSION STATUS</span>
              <span className="pf-sec-value pf-sec-active text-mono">● ACTIVE</span>
            </div>
            <div className="pf-sec-row">
              <span className="pf-sec-label text-mono">LAST LOGIN</span>
              <span className="pf-sec-value text-mono">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="pf-sec-row">
              <span className="pf-sec-label text-mono">2FA</span>
              <span className="pf-sec-value text-mono" style={{ color: '#f59e0b' }}>NOT ENABLED</span>
            </div>
            <div className="pf-sec-row">
              <span className="pf-sec-label text-mono">AI MODEL</span>
              <span className="pf-sec-value text-mono" style={{ color: '#22c55e' }}>LOCAL ENGINE</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .pf-root { display: flex; flex-direction: column; gap: 18px; padding: 24px; overflow-y: auto; height: 100%; }

        /* Hero */
        .pf-hero {
          position: relative; border-radius: 16px; overflow: hidden;
          background: var(--glass-bg); backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow);
        }
        .pf-hero-bg {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(0,242,254,0.08), rgba(127,0,255,0.06), transparent);
          pointer-events: none;
        }
        .pf-hero-content {
          position: relative; display: flex; align-items: center; gap: 20px;
          padding: 28px 24px; flex-wrap: wrap;
        }
        .pf-avatar-wrap { position: relative; flex-shrink: 0; }
        .pf-avatar {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; font-weight: 700; color: #fff;
          font-family: var(--font-tech); letter-spacing: 2px;
          box-shadow: 0 0 20px var(--accent-glow);
        }
        .pf-avatar-edit {
          position: absolute; bottom: -2px; right: -2px;
          width: 26px; height: 26px; border-radius: 50%;
          background: var(--bg-color); border: 2px solid var(--glass-border);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-muted); transition: all 0.2s;
        }
        .pf-avatar-edit:hover { color: var(--accent-primary); border-color: var(--accent-primary); }
        .pf-hero-info { flex: 1; }
        .pf-name-row { display: flex; align-items: center; gap: 10px; }
        .pf-name { font-size: 22px; font-weight: 700; letter-spacing: 1px; color: var(--text-primary); margin: 0; }
        .pf-name-input {
          font-size: 22px; font-weight: 700; letter-spacing: 1px; color: var(--text-primary);
          background: transparent; border: none; border-bottom: 2px solid var(--accent-primary);
          outline: none; padding: 0 0 2px;
        }
        .pf-edit-btn {
          background: none; border: none; color: var(--text-muted); cursor: pointer;
          padding: 4px; transition: color 0.2s;
        }
        .pf-edit-btn:hover { color: var(--accent-primary); }
        .pf-email { font-size: 12px; color: var(--text-muted); letter-spacing: 0.5px; margin-top: 4px; }
        .pf-badges { display: flex; gap: 8px; margin-top: 8px; }
        .pf-badge {
          display: flex; align-items: center; gap: 4px;
          padding: 4px 10px; border-radius: 6px; font-size: 9px; letter-spacing: 1px;
          background: rgba(0,242,254,0.08); border: 1px solid rgba(0,242,254,0.2);
          color: var(--accent-primary);
        }
        .pf-badge-mode {
          background: rgba(127,0,255,0.08); border-color: rgba(127,0,255,0.2);
          color: var(--accent-secondary);
        }
        .pf-logout-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 20px; border: 1px solid var(--accent-warn);
          border-radius: 8px; background: rgba(239,68,68,0.06);
          color: var(--accent-warn); cursor: pointer;
          font-size: 10px; letter-spacing: 1px; transition: all 0.3s; white-space: nowrap;
        }
        .pf-logout-btn:hover { background: rgba(239,68,68,0.15); box-shadow: 0 0 12px var(--accent-warn-glow); }

        /* Grid */
        .pf-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        @media (max-width: 900px) { .pf-grid { grid-template-columns: 1fr; } }
        .pf-card-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 10px; letter-spacing: 1.5px; color: var(--text-secondary);
          padding-bottom: 12px; border-bottom: 1px solid var(--glass-border); margin-bottom: 14px;
        }
        .pf-stats-card, .pf-activity-card, .pf-security-card {
          background: var(--glass-bg); backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border); border-radius: 14px;
          padding: 18px; box-shadow: var(--glass-shadow);
        }

        /* Stats */
        .pf-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .pf-stat {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 14px; background: var(--neumorphic-press); border-radius: 10px;
          border: 1px solid var(--glass-border);
        }
        .pf-stat-icon { color: var(--accent-primary); }
        .pf-stat-value { font-size: 22px; font-weight: 700; color: var(--text-primary); }
        .pf-stat-label { font-size: 8px; letter-spacing: 1.2px; color: var(--text-muted); text-align: center; }

        /* Timeline */
        .pf-timeline { display: flex; flex-direction: column; }
        .pf-timeline-item { display: flex; gap: 12px; position: relative; padding-bottom: 16px; }
        .pf-timeline-item:last-child { padding-bottom: 0; }
        .pf-timeline-dot {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid; background: var(--glass-bg); z-index: 1;
        }
        .pf-timeline-line {
          position: absolute; left: 13px; top: 30px; bottom: 0;
          width: 2px; background: var(--glass-border);
        }
        .pf-timeline-content { display: flex; flex-direction: column; gap: 2px; padding-top: 4px; }
        .pf-timeline-action { font-size: 12px; color: var(--text-primary); }
        .pf-timeline-time { font-size: 9px; letter-spacing: 1px; color: var(--text-muted); }

        /* Security */
        .pf-sec-rows { display: flex; flex-direction: column; }
        .pf-sec-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0; border-bottom: 1px solid var(--glass-border);
        }
        .pf-sec-row:last-child { border-bottom: none; }
        .pf-sec-label { font-size: 10px; letter-spacing: 1px; color: var(--text-muted); }
        .pf-sec-value { font-size: 11px; letter-spacing: 0.5px; color: var(--text-secondary); }
        .pf-sec-active { color: #22c55e !important; }

        @media (max-width: 768px) {
          .pf-hero-content { flex-direction: column; text-align: center; }
          .pf-name-row { justify-content: center; }
          .pf-badges { justify-content: center; }
        }
      `}</style>
    </div>
  );
}
