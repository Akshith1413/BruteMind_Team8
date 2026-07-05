/**
 * CommandPalette.jsx — Cortex OS Keyboard Shortcuts & Global Search
 * Accessed via Cmd/Ctrl + K. Allows quick navigation and actions.
 */
import { useEffect, useRef, useState } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { AudioSynth } from '../utils/AudioSynth';
import gsap from 'gsap';
import { Search, LayoutDashboard, Users, Megaphone, FlaskConical, MessageSquareText, BarChart3, Settings as SettingsIcon, Rocket } from 'lucide-react';

const ACTIONS = [
  { id: 'nav-control-room', label: 'Go to Control Room', type: 'navigation', icon: LayoutDashboard, view: 'control-room' },
  { id: 'nav-analytics', label: 'Go to Analytics', type: 'navigation', icon: BarChart3, view: 'analytics' },
  { id: 'nav-boardroom', label: 'Go to Boardroom', type: 'navigation', icon: Users, view: 'boardroom' },
  { id: 'nav-campaigns', label: 'Go to Campaigns', type: 'navigation', icon: Megaphone, view: 'campaigns' },
  { id: 'nav-simulator', label: 'Go to Simulator', type: 'navigation', icon: FlaskConical, view: 'simulator' },
  { id: 'nav-copilot', label: 'Go to AI Copilot', type: 'navigation', icon: MessageSquareText, view: 'copilot' },
  { id: 'nav-settings', label: 'Go to Settings', type: 'navigation', icon: SettingsIcon, view: 'settings' },
  { id: 'action-sim', label: 'Run New Simulation', type: 'action', icon: Rocket, view: 'simulator' },
];

export default function CommandPalette() {
  const { setActiveView } = useDashboardStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  // Filter actions based on search
  const filtered = ACTIONS.filter((a) => a.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          AudioSynth.playClick();
        } else {
          setOpen(false);
        }
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      gsap.fromTo('.cp-modal', { scale: 0.95, y: -20 }, { scale: 1, y: 0, duration: 0.3, ease: 'power3.out' });
      setSearch('');
      setSelectedIndex(0);
    }
  }, [open]);

  const executeAction = (action) => {
    AudioSynth.playTransition();
    setOpen(false);
    if (action.view) {
      setActiveView(action.view);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }
    if (e.key === 'Enter' && filtered.length > 0) {
      e.preventDefault();
      executeAction(filtered[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div className="cp-overlay" ref={rootRef} onClick={() => setOpen(false)}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cp-header">
          <Search size={16} className="cp-search-icon" />
          <input
            ref={inputRef}
            className="cp-input text-mono"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleInputKeyDown}
          />
          <div className="cp-hint text-mono">ESC to close</div>
        </div>
        <div className="cp-body">
          {filtered.length === 0 ? (
            <div className="cp-empty text-mono">No actions found.</div>
          ) : (
            filtered.map((action, i) => {
              const Icon = action.icon;
              const isSel = i === selectedIndex;
              return (
                <div
                  key={action.id}
                  className={`cp-item ${isSel ? 'cp-item-selected' : ''}`}
                  onClick={() => executeAction(action)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <Icon size={14} style={{ color: isSel ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                  <span className={`cp-item-label text-mono ${isSel ? 'cp-item-label-sel' : ''}`}>{action.label}</span>
                  <span className="cp-item-type text-mono">{action.type}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <style>{`
        .cp-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px); z-index: 999999;
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 15vh;
        }
        .cp-modal {
          width: 100%; max-width: 600px;
          background: var(--glass-bg); border: 1px solid var(--glass-border-focus);
          border-radius: 12px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 40px var(--accent-glow);
        }
        .cp-header {
          display: flex; align-items: center; padding: 16px 20px;
          border-bottom: 1px solid var(--glass-border); gap: 12px;
        }
        .cp-search-icon { color: var(--accent-primary); }
        .cp-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--text-primary); font-size: 16px;
        }
        .cp-hint { font-size: 10px; color: var(--text-muted); border: 1px solid var(--glass-border); padding: 2px 6px; border-radius: 4px; }
        
        .cp-body { padding: 8px; max-height: 400px; overflow-y: auto; }
        .cp-empty { padding: 24px; text-align: center; color: var(--text-muted); font-size: 12px; }
        
        .cp-item {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px;
          border-radius: 8px; cursor: pointer; transition: background 0.1s;
        }
        .cp-item-selected { background: rgba(0,242,254,0.1); }
        .cp-item-label { font-size: 12px; color: var(--text-secondary); flex: 1; }
        .cp-item-label-sel { color: var(--text-primary); }
        .cp-item-type { font-size: 9px; letter-spacing: 1px; color: var(--text-muted); text-transform: uppercase; }
      `}</style>
    </div>
  );
}
