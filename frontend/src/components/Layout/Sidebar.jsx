/**
 * Sidebar.jsx — Cortex OS Navigation Spine
 * Collapsible icon sidebar with glassmorphic styling and GSAP hover effects.
 */
import { useRef, useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { AudioSynth } from '../../utils/AudioSynth';
import gsap from 'gsap';
import {
  LayoutDashboard,
  Users,
  Upload,
  FlaskConical,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Settings,
  BarChart3,
  User,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'control-room', label: 'CONTROL ROOM', icon: LayoutDashboard },
  { id: 'analytics', label: 'ANALYTICS', icon: BarChart3 },
  { id: 'boardroom', label: 'BOARDROOM', icon: Users },
  { id: 'onboarding', label: 'ONBOARDING', icon: Upload },
  { id: 'campaigns', label: 'CAMPAIGNS', icon: Megaphone },
  { id: 'simulator', label: 'SIMULATOR', icon: FlaskConical },
  { id: 'copilot', label: 'AI COPILOT', icon: MessageSquareText },
  { id: 'profile', label: 'PROFILE', icon: User },
  { id: 'settings', label: 'SETTINGS', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { activeView, setActiveView } = useDashboardStore();
  const navRefs = useRef([]);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, []);

  const handleNav = (id) => {
    setActiveView(id);
    AudioSynth.playNavigate();
  };

  return (
    <aside ref={sidebarRef} className={`sb-root ${collapsed ? 'sb-collapsed' : ''}`}>
      {/* Logo Mark */}
      <div className="sb-brand">
        <div className="sb-logo-orb">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <defs>
              <linearGradient id="sbGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent-primary)" />
                <stop offset="100%" stopColor="var(--accent-secondary)" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="14" fill="none" stroke="url(#sbGrad)" strokeWidth="2" />
            <circle cx="16" cy="16" r="6" fill="url(#sbGrad)" opacity="0.8" />
            <circle cx="16" cy="16" r="10" fill="none" stroke="url(#sbGrad)" strokeWidth="0.8" strokeDasharray="3 5" opacity="0.5">
              <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="12s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
        {!collapsed && <span className="sb-brand-text text-tech glow-text">CORTEX</span>}
      </div>

      {/* Navigation Items */}
      <nav className="sb-nav">
        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => (navRefs.current[i] = el)}
              className={`sb-item ${isActive ? 'sb-active' : ''}`}
              onClick={() => handleNav(item.id)}
              title={item.label}
              onMouseEnter={() => AudioSynth.playHover()}
            >
              <div className="sb-icon-wrap">
                <Icon size={20} />
                {isActive && <div className="sb-active-dot" />}
              </div>
              {!collapsed && <span className="sb-label text-mono">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button className="sb-toggle" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <style>{`
        .sb-root {
          width: 220px;
          min-width: 220px;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--glass-bg);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-right: 1px solid var(--glass-border);
          padding: 20px 12px;
          gap: 8px;
          transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                      min-width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                      padding 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 20;
        }

        .sb-collapsed {
          width: 68px;
          min-width: 68px;
          padding: 20px 8px;
        }

        .sb-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 8px 20px;
          border-bottom: 1px solid var(--glass-border);
          margin-bottom: 8px;
          min-height: 56px;
        }

        .sb-logo-orb {
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0 6px var(--accent-glow));
        }

        .sb-brand-text {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 3px;
          white-space: nowrap;
          color: var(--text-primary);
        }

        .sb-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .sb-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
          white-space: nowrap;
          font-size: 13px;
        }

        .sb-item::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--accent-glow), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .sb-item:hover {
          color: var(--text-primary);
          background: var(--neumorphic-press);
        }

        .sb-item:hover::before {
          opacity: 0.08;
        }

        .sb-active {
          color: var(--accent-primary) !important;
          background: var(--neumorphic-press);
          box-shadow: inset 0 0 0 1px var(--glass-border-focus),
                      0 0 12px var(--accent-glow);
        }

        .sb-active::before {
          opacity: 0.12 !important;
        }

        .sb-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sb-active-dot {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--accent-primary);
          box-shadow: 0 0 6px var(--accent-glow);
        }

        .sb-label {
          font-size: 11px;
          letter-spacing: 1.2px;
        }

        .sb-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--neumorphic-press);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          color: var(--text-muted);
          padding: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: auto;
        }

        .sb-toggle:hover {
          color: var(--accent-primary);
          border-color: var(--glass-border-focus);
        }

        @media (max-width: 768px) {
          .sb-root {
            width: 68px;
            min-width: 68px;
            padding: 20px 8px;
          }
          .sb-label, .sb-brand-text { display: none; }
        }
      `}</style>
    </aside>
  );
}
