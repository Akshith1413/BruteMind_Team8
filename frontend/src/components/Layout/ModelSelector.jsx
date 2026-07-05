import { useState, useEffect, useRef } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { api } from '../../utils/api';
import { Settings2, Zap, Cpu, Network, ChevronDown } from 'lucide-react';

export default function ModelSelector() {
  const { systemConfig, setSystemConfig } = useDashboardStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Fetch initial config on mount
    const fetchConfig = async () => {
      try {
        const config = await api.get('/system/config');
        setSystemConfig({ routingMode: config.routingMode, manualProvider: config.manualProvider });
      } catch (err) {
        console.warn('Failed to load system config:', err);
      }
    };
    fetchConfig();
  }, [setSystemConfig]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

  const updateConfig = async (routingMode, manualProvider = 'nvidia') => {
    setLoading(true);
    try {
      const res = await api.post('/system/config', { routingMode, manualProvider });
      setSystemConfig({ routingMode: res.config.routingMode, manualProvider: res.config.manualProvider });
    } catch (err) {
      console.error('Failed to update config:', err);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const currentLabel = systemConfig.routingMode === 'offline' ? 'Offline Local' 
    : systemConfig.routingMode === 'auto' ? 'Auto Fallback'
    : `Manual: ${systemConfig.manualProvider.toUpperCase()}`;

  return (
    <div className="ms-root" ref={dropdownRef}>
      <button className={`ms-btn ${open ? 'ms-active' : ''} ${loading ? 'ms-loading' : ''}`} onClick={() => setOpen(!open)} title="AI Model Configuration">
        <Settings2 size={16} />
        <span className="ms-label">{currentLabel}</span>
        <ChevronDown size={14} className="ms-chevron" />
      </button>

      {open && (
        <div className="ms-dropdown">
          <div className="ms-group-label">ROUTING MODE</div>
          
          <button className={`ms-option ${systemConfig.routingMode === 'offline' ? 'ms-selected' : ''}`} onClick={() => updateConfig('offline')}>
            <Network size={14} /> 
            <span>Offline (Local Mock)</span>
          </button>
          
          <button className={`ms-option ${systemConfig.routingMode === 'auto' ? 'ms-selected' : ''}`} onClick={() => updateConfig('auto')}>
            <Zap size={14} /> 
            <span>Auto Fallback (Nvidia -&gt; Groq -&gt; Local)</span>
          </button>
          
          <div className="ms-group-label">MANUAL ENGINE</div>
          
          <button className={`ms-option ${systemConfig.routingMode === 'manual' && systemConfig.manualProvider === 'nvidia' ? 'ms-selected' : ''}`} onClick={() => updateConfig('manual', 'nvidia')}>
            <Cpu size={14} /> 
            <span>Nvidia NIM (Llama 3.1 70B)</span>
          </button>
          
          <button className={`ms-option ${systemConfig.routingMode === 'manual' && systemConfig.manualProvider === 'groq' ? 'ms-selected' : ''}`} onClick={() => updateConfig('manual', 'groq')}>
            <Cpu size={14} /> 
            <span>Groq (Llama 3.3 70B)</span>
          </button>
        </div>
      )}

      <style>{`
        .ms-root {
          position: relative;
        }
        
        .ms-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 36px;
          padding: 0 12px;
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          background: var(--neumorphic-press);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: inherit;
        }
        
        .ms-btn:hover, .ms-active {
          color: var(--accent-primary);
          border-color: var(--glass-border-focus);
          box-shadow: 0 0 10px var(--accent-glow);
        }

        .ms-label {
          font-size: 11px;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .ms-chevron {
          margin-left: 4px;
          transition: transform 0.2s ease;
        }
        .ms-active .ms-chevron {
          transform: rotate(180deg);
        }

        .ms-loading {
          opacity: 0.5;
          pointer-events: none;
        }

        .ms-dropdown {
          position: absolute;
          top: 45px;
          right: 0;
          width: 260px;
          background: var(--bg-color);
          border: 1px solid var(--glass-border-focus);
          border-radius: 8px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.8);
          z-index: 9999;
        }

        .ms-group-label {
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 1px;
          padding: 6px 8px 2px 8px;
          font-weight: 700;
        }

        .ms-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 11px;
          text-align: left;
          transition: all 0.2s ease;
        }

        .ms-option:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-primary);
        }

        .ms-selected {
          background: rgba(14, 165, 233, 0.1);
          color: var(--accent-primary);
          border-color: rgba(14, 165, 233, 0.3);
        }

        @media (max-width: 768px) {
          .ms-label { display: none; }
        }
      `}</style>
    </div>
  );
}
