/**
 * Settings.jsx — Cortex OS Configuration & Preferences Panel
 * API key management, model config, platform preferences, and team settings.
 */
import { useEffect, useRef, useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { api } from '../../utils/api';
import { AudioSynth } from '../../utils/AudioSynth';
import gsap from 'gsap';
import {
  Settings as SettingsIcon, Key, Shield, Users, Building2,
  Volume2, VolumeX, Activity, Eye, EyeOff, Check, Loader2,
  Cpu, Cloud, HardDrive, UserPlus, Palette, Zap, Globe, ChevronRight
} from 'lucide-react';

const INDUSTRIES = ['SaaS', 'E-commerce', 'Healthcare', 'FinTech', 'Education', 'Logistics', 'Other'];

const MOCK_TEAM = [
  { name: 'Alex Chen', role: 'Admin', initials: 'AC', color: '#0284c7' },
  { name: 'Priya Sharma', role: 'Analyst', initials: 'PS', color: '#7e22ce' },
  { name: 'Jordan Lee', role: 'Viewer', initials: 'JL', color: '#0f766e' },
];

export default function Settings() {
  const { systemConfig, setSystemConfig, appMode, setAppMode } = useDashboardStore();
  const rootRef = useRef(null);

  // API Keys
  const [nvidiaKey, setNvidiaKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [showNvidia, setShowNvidia] = useState(false);
  const [showGroq, setShowGroq] = useState(false);
  const [testingNvidia, setTestingNvidia] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [nvidiaOk, setNvidiaOk] = useState(null);
  const [groqOk, setGroqOk] = useState(null);
  const [keySaved, setKeySaved] = useState(false);

  // Preferences
  const [soundOn, setSoundOn] = useState(true);
  const [telemetryOn, setTelemetryOn] = useState(true);

  // Organization
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('SaaS');
  const [inviteEmail, setInviteEmail] = useState('');

  /* ── Fetch system config on mount ─────────────────── */
  useEffect(() => {
    api.get('/system/config')
      .then((cfg) => {
        if (cfg) setSystemConfig({ routingMode: cfg.routingMode || 'auto', manualProvider: cfg.manualProvider || 'nvidia' });
      })
      .catch((err) => console.error('Failed to fetch system config:', err));
  }, [setSystemConfig]);

  /* ── GSAP entrance ────────────────────────────────── */
  useEffect(() => {
    if (rootRef.current) {
      gsap.fromTo(
        rootRef.current.querySelectorAll('.st-section'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.07, ease: 'power3.out' }
      );
    }
  }, []);

  /* ── Key actions ──────────────────────────────────── */
  const testConnection = async (provider) => {
    AudioSynth.playClick();
    if (provider === 'nvidia') {
      setTestingNvidia(true); setNvidiaOk(null);
      setTimeout(() => { setTestingNvidia(false); setNvidiaOk(nvidiaKey.length > 8); }, 1500);
    } else {
      setTestingGroq(true); setGroqOk(null);
      setTimeout(() => { setTestingGroq(false); setGroqOk(groqKey.length > 8); }, 1500);
    }
  };

  const saveKeys = async () => {
    AudioSynth.playSuccess();
    
    // In a real application, you might post the keys securely.
    // For this prototype, we push the routing mode and provider to the backend.
    try {
      await api.post('/system/config', {
        routingMode: systemConfig.routingMode,
        manualProvider: systemConfig.manualProvider
      });
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2500);
    } catch (err) {
      console.error('Failed to save system config:', err);
    }
  };

  /* ── Routing mode label ───────────────────────────── */
  const routingLabel = {
    auto: 'Auto (NVIDIA → Groq → Local)',
    offline: 'Fully Offline (Local Engine)',
    manual: `Manual (${(systemConfig.manualProvider || 'nvidia').toUpperCase()})`,
  };

  const routingIcon = {
    auto: <Zap size={16} />,
    offline: <HardDrive size={16} />,
    manual: <Cloud size={16} />,
  };

  return (
    <div className="st-root" ref={rootRef}>
      {/* Header */}
      <div className="st-header st-section">
        <SettingsIcon size={22} style={{ color: 'var(--accent-primary)' }} />
        <div>
          <h2 className="text-tech">CONFIGURATION</h2>
          <p className="text-mono st-subtitle">System settings, API keys, and platform preferences</p>
        </div>
      </div>

      <div className="st-grid">
        {/* ─── Section 1: AI Model Status ──────────── */}
        <div className="st-section st-card st-card-wide">
          <div className="st-card-title text-mono"><Cpu size={14} /> AI MODEL STATUS</div>
          <div className="st-model-status">
            <div className="st-model-active">
              <div className="st-model-icon-wrap">
                {routingIcon[systemConfig.routingMode]}
              </div>
              <div>
                <div className="st-model-mode text-tech">{(systemConfig.routingMode || 'auto').toUpperCase()}</div>
                <div className="st-model-desc text-mono">{routingLabel[systemConfig.routingMode || 'auto']}</div>
              </div>
              <div className="st-model-badge text-mono">ACTIVE</div>
            </div>
            <div className="st-model-cards">
              {['auto', 'offline', 'manual'].map((mode) => (
                <button
                  key={mode}
                  className={`st-mode-card ${systemConfig.routingMode === mode ? 'st-mode-active' : ''}`}
                  onClick={async () => {
                    AudioSynth.playClick();
                    const updated = { ...systemConfig, routingMode: mode };
                    setSystemConfig(updated);
                    try {
                      await api.post('/system/config', { routingMode: mode, manualProvider: systemConfig.manualProvider });
                    } catch (e) {
                      console.error('Error syncing routing mode:', e);
                    }
                  }}
                >
                  <span className="st-mode-icon">{routingIcon[mode]}</span>
                  <span className="text-mono st-mode-label">{mode.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Section 2: API Keys ─────────────────── */}
        <div className="st-section st-card st-card-wide">
          <div className="st-card-title text-mono"><Key size={14} /> API KEY MANAGEMENT</div>
          <div className="st-keys">
            {/* NVIDIA */}
            <div className="st-key-row">
              <div className="st-key-header">
                <span className="st-key-provider text-tech">NVIDIA NIM</span>
                {nvidiaOk !== null && (
                  <span className={`st-key-status text-mono ${nvidiaOk ? 'st-key-ok' : 'st-key-fail'}`}>
                    {nvidiaOk ? '✓ CONNECTED' : '✗ INVALID'}
                  </span>
                )}
              </div>
              <div className="st-key-input-wrap">
                <input
                  className="st-key-input text-mono"
                  type={showNvidia ? 'text' : 'password'}
                  placeholder="nvapi-xxxxxxxxxxxxxxxxxxxx"
                  value={nvidiaKey}
                  onChange={(e) => setNvidiaKey(e.target.value)}
                />
                <button className="st-key-toggle" onClick={() => setShowNvidia(!showNvidia)}>
                  {showNvidia ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  className="st-key-test text-mono"
                  onClick={() => testConnection('nvidia')}
                  disabled={testingNvidia || !nvidiaKey}
                >
                  {testingNvidia ? <Loader2 size={12} className="st-spin" /> : <Shield size={12} />}
                  {testingNvidia ? 'TESTING...' : 'TEST'}
                </button>
              </div>
            </div>
            {/* GROQ */}
            <div className="st-key-row">
              <div className="st-key-header">
                <span className="st-key-provider text-tech">GROQ CLOUD</span>
                {groqOk !== null && (
                  <span className={`st-key-status text-mono ${groqOk ? 'st-key-ok' : 'st-key-fail'}`}>
                    {groqOk ? '✓ CONNECTED' : '✗ INVALID'}
                  </span>
                )}
              </div>
              <div className="st-key-input-wrap">
                <input
                  className="st-key-input text-mono"
                  type={showGroq ? 'text' : 'password'}
                  placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                />
                <button className="st-key-toggle" onClick={() => setShowGroq(!showGroq)}>
                  {showGroq ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  className="st-key-test text-mono"
                  onClick={() => testConnection('groq')}
                  disabled={testingGroq || !groqKey}
                >
                  {testingGroq ? <Loader2 size={12} className="st-spin" /> : <Shield size={12} />}
                  {testingGroq ? 'TESTING...' : 'TEST'}
                </button>
              </div>
            </div>
            <button className="st-save-keys text-mono" onClick={saveKeys}>
              {keySaved ? <><Check size={13} /> SAVED!</> : <><Key size={13} /> SAVE KEYS</>}
            </button>
          </div>
        </div>

        {/* ─── Section 3: Platform Preferences ─────── */}
        <div className="st-section st-card">
          <div className="st-card-title text-mono"><Palette size={14} /> PREFERENCES</div>
          <div className="st-prefs">
            {/* App Mode */}
            <div className="st-pref-row">
              <div className="st-pref-info">
                <Globe size={14} />
                <div>
                  <div className="st-pref-name text-mono">APP MODE</div>
                  <div className="st-pref-desc">Switch terminology context</div>
                </div>
              </div>
              <div className="st-toggle-group">
                <button
                  className={`st-toggle-opt text-mono ${appMode === 'enterprise' ? 'st-toggle-active' : ''}`}
                  onClick={() => { setAppMode('enterprise'); AudioSynth.playClick(); }}
                >ENTERPRISE</button>
                <button
                  className={`st-toggle-opt text-mono ${appMode === 'healthcare' ? 'st-toggle-active' : ''}`}
                  onClick={() => { setAppMode('healthcare'); AudioSynth.playClick(); }}
                >HEALTHCARE</button>
              </div>
            </div>

            {/* Sound */}
            <div className="st-pref-row">
              <div className="st-pref-info">
                {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <div>
                  <div className="st-pref-name text-mono">SOUND EFFECTS</div>
                  <div className="st-pref-desc">UI interaction sounds</div>
                </div>
              </div>
              <button className={`st-switch ${soundOn ? 'st-switch-on' : ''}`} onClick={() => { setSoundOn(!soundOn); AudioSynth.playClick(); }}>
                <div className="st-switch-thumb" />
              </button>
            </div>

            {/* Telemetry */}
            <div className="st-pref-row">
              <div className="st-pref-info">
                <Activity size={14} />
                <div>
                  <div className="st-pref-name text-mono">LIVE TELEMETRY</div>
                  <div className="st-pref-desc">Real-time data streaming</div>
                </div>
              </div>
              <button className={`st-switch ${telemetryOn ? 'st-switch-on' : ''}`} onClick={() => { setTelemetryOn(!telemetryOn); AudioSynth.playClick(); }}>
                <div className="st-switch-thumb" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Section 4: Organization ────────────── */}
        <div className="st-section st-card">
          <div className="st-card-title text-mono"><Building2 size={14} /> ORGANIZATION</div>
          <div className="st-org">
            <div className="st-org-field">
              <label className="st-org-label text-mono">COMPANY NAME</label>
              <input className="st-org-input text-mono" placeholder="Acme Corp" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="st-org-field">
              <label className="st-org-label text-mono">INDUSTRY</label>
              <select className="st-org-select text-mono" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            {/* Team */}
            <div className="st-team">
              <div className="st-team-title text-mono"><Users size={12} /> TEAM MEMBERS</div>
              {MOCK_TEAM.map((m) => (
                <div key={m.name} className="st-team-member">
                  <div className="st-avatar" style={{ background: m.color }}>{m.initials}</div>
                  <div className="st-member-info">
                    <span className="st-member-name">{m.name}</span>
                    <span className="st-member-role text-mono">{m.role.toUpperCase()}</span>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              ))}
              <div className="st-invite-row">
                <input className="st-org-input text-mono" placeholder="email@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                <button className="st-invite-btn text-mono" onClick={() => { AudioSynth.playSuccess(); setInviteEmail(''); }}>
                  <UserPlus size={13} /> INVITE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .st-root { display: flex; flex-direction: column; gap: 20px; padding: 24px; overflow-y: auto; height: 100%; }
        .st-header { display: flex; align-items: center; gap: 14px; }
        .st-header h2 { font-size: 18px; letter-spacing: 2px; color: var(--text-primary); margin: 0; }
        .st-subtitle { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

        .st-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
        @media (max-width: 900px) { .st-grid { grid-template-columns: 1fr; } }

        .st-card {
          background: var(--glass-bg); backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border); border-radius: 14px;
          padding: 20px; box-shadow: var(--glass-shadow);
        }
        .st-card-wide { grid-column: 1 / -1; }
        .st-card-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 10px; letter-spacing: 1.5px; color: var(--text-secondary);
          padding-bottom: 14px; border-bottom: 1px solid var(--glass-border); margin-bottom: 16px;
        }

        /* Model Status */
        .st-model-status { display: flex; flex-direction: column; gap: 16px; }
        .st-model-active {
          display: flex; align-items: center; gap: 14px; padding: 14px 18px;
          background: var(--neumorphic-press); border: 1px solid var(--glass-border-focus);
          border-radius: 12px;
        }
        .st-model-icon-wrap {
          width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, rgba(0,242,254,0.1), rgba(127,0,255,0.08));
          color: var(--accent-primary);
        }
        .st-model-mode { font-size: 16px; font-weight: 700; letter-spacing: 2px; color: var(--text-primary); }
        .st-model-desc { font-size: 10px; color: var(--text-muted); letter-spacing: 0.5px; margin-top: 2px; }
        .st-model-badge {
          margin-left: auto; padding: 4px 12px; border-radius: 20px; font-size: 9px; letter-spacing: 1.5px;
          background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.3);
        }
        .st-model-cards { display: flex; gap: 10px; }
        .st-mode-card {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 16px; border: 1px solid var(--glass-border); border-radius: 12px;
          background: var(--glass-bg); cursor: pointer; transition: all 0.3s;
          color: var(--text-muted);
        }
        .st-mode-card:hover { border-color: var(--glass-border-focus); color: var(--text-primary); }
        .st-mode-active {
          border-color: var(--accent-primary) !important; color: var(--accent-primary) !important;
          background: rgba(0,242,254,0.04); box-shadow: 0 0 16px var(--accent-glow);
        }
        .st-mode-label { font-size: 10px; letter-spacing: 1.5px; }

        /* API Keys */
        .st-keys { display: flex; flex-direction: column; gap: 16px; }
        .st-key-row { display: flex; flex-direction: column; gap: 8px; }
        .st-key-header { display: flex; align-items: center; justify-content: space-between; }
        .st-key-provider { font-size: 13px; font-weight: 600; letter-spacing: 1px; color: var(--text-primary); }
        .st-key-status { font-size: 9px; letter-spacing: 1px; padding: 3px 10px; border-radius: 20px; }
        .st-key-ok { background: rgba(34,197,94,0.1); color: #22c55e; }
        .st-key-fail { background: rgba(239,68,68,0.1); color: #ef4444; }
        .st-key-input-wrap { display: flex; gap: 8px; align-items: center; }
        .st-key-input {
          flex: 1; padding: 10px 14px; background: var(--neumorphic-press);
          border: 1px solid var(--glass-border); border-radius: 8px;
          color: var(--text-primary); font-size: 12px; outline: none; transition: all 0.3s;
        }
        .st-key-input:focus { border-color: var(--glass-border-focus); box-shadow: 0 0 10px var(--accent-glow); }
        .st-key-toggle {
          padding: 10px; border: 1px solid var(--glass-border); border-radius: 8px;
          background: var(--glass-bg); color: var(--text-muted); cursor: pointer; transition: all 0.2s;
        }
        .st-key-toggle:hover { color: var(--text-primary); border-color: var(--glass-border-focus); }
        .st-key-test {
          display: flex; align-items: center; gap: 6px; padding: 10px 16px;
          border: 1px solid var(--accent-primary); border-radius: 8px;
          background: rgba(0,242,254,0.06); color: var(--accent-primary);
          cursor: pointer; font-size: 10px; letter-spacing: 1px; transition: all 0.3s; white-space: nowrap;
        }
        .st-key-test:hover:not(:disabled) { background: rgba(0,242,254,0.14); box-shadow: 0 0 12px var(--accent-glow); }
        .st-key-test:disabled { opacity: 0.5; cursor: not-allowed; }
        .st-save-keys {
          align-self: flex-end; display: flex; align-items: center; gap: 8px;
          padding: 10px 24px; border: 1px solid var(--accent-primary); border-radius: 8px;
          background: linear-gradient(135deg, rgba(0,242,254,0.1), rgba(127,0,255,0.06));
          color: var(--accent-primary); cursor: pointer; font-size: 10px; letter-spacing: 1px; transition: all 0.3s;
        }
        .st-save-keys:hover { box-shadow: 0 0 16px var(--accent-glow); }

        @keyframes stSpin { to { transform: rotate(360deg); } }
        .st-spin { animation: stSpin 1s linear infinite; }

        /* Preferences */
        .st-prefs { display: flex; flex-direction: column; gap: 0; }
        .st-pref-row {
          display: flex; align-items: center; justify-content: space-between; gap: 14px;
          padding: 14px 0; border-bottom: 1px solid var(--glass-border);
        }
        .st-pref-row:last-child { border-bottom: none; }
        .st-pref-info { display: flex; align-items: center; gap: 12px; color: var(--text-secondary); }
        .st-pref-name { font-size: 11px; letter-spacing: 1px; color: var(--text-primary); }
        .st-pref-desc { font-size: 9px; color: var(--text-muted); margin-top: 2px; }

        /* Toggle Group */
        .st-toggle-group { display: flex; border: 1px solid var(--glass-border); border-radius: 8px; overflow: hidden; }
        .st-toggle-opt {
          padding: 8px 14px; font-size: 9px; letter-spacing: 1px;
          background: var(--glass-bg); color: var(--text-muted);
          border: none; cursor: pointer; transition: all 0.3s;
        }
        .st-toggle-active {
          background: linear-gradient(135deg, rgba(0,242,254,0.12), rgba(127,0,255,0.08));
          color: var(--accent-primary);
        }

        /* Switch */
        .st-switch {
          width: 44px; height: 24px; border-radius: 12px; padding: 2px;
          background: var(--neumorphic-press); border: 1px solid var(--glass-border);
          cursor: pointer; transition: all 0.3s; position: relative;
        }
        .st-switch-on { background: rgba(0,242,254,0.15); border-color: var(--accent-primary); }
        .st-switch-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--text-muted); transition: all 0.3s; position: absolute; top: 2px; left: 2px;
        }
        .st-switch-on .st-switch-thumb {
          transform: translateX(20px); background: var(--accent-primary);
          box-shadow: 0 0 8px var(--accent-glow);
        }

        /* Organization */
        .st-org { display: flex; flex-direction: column; gap: 14px; }
        .st-org-field { display: flex; flex-direction: column; gap: 6px; }
        .st-org-label { font-size: 9px; letter-spacing: 1.5px; color: var(--text-muted); }
        .st-org-input {
          padding: 10px 14px; background: var(--neumorphic-press);
          border: 1px solid var(--glass-border); border-radius: 8px;
          color: var(--text-primary); font-size: 12px; outline: none; transition: all 0.3s;
        }
        .st-org-input:focus { border-color: var(--glass-border-focus); box-shadow: 0 0 10px var(--accent-glow); }
        .st-org-select {
          padding: 10px 14px; background: var(--neumorphic-press);
          border: 1px solid var(--glass-border); border-radius: 8px;
          color: var(--text-primary); font-size: 12px; outline: none; cursor: pointer;
        }

        /* Team */
        .st-team { border-top: 1px solid var(--glass-border); padding-top: 14px; display: flex; flex-direction: column; gap: 10px; }
        .st-team-title { font-size: 9px; letter-spacing: 1.5px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
        .st-team-member {
          display: flex; align-items: center; gap: 12px; padding: 10px 12px;
          background: var(--neumorphic-press); border-radius: 10px; transition: all 0.2s;
        }
        .st-team-member:hover { border-color: var(--glass-border-focus); }
        .st-avatar {
          width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .st-member-info { flex: 1; display: flex; flex-direction: column; }
        .st-member-name { font-size: 12px; color: var(--text-primary); }
        .st-member-role { font-size: 8px; letter-spacing: 1.5px; color: var(--text-muted); margin-top: 1px; }
        .st-invite-row { display: flex; gap: 8px; margin-top: 4px; }
        .st-invite-btn {
          display: flex; align-items: center; gap: 6px; padding: 10px 16px;
          border: 1px solid var(--accent-secondary); border-radius: 8px;
          background: rgba(127,0,255,0.06); color: var(--accent-secondary);
          cursor: pointer; font-size: 10px; letter-spacing: 1px; transition: all 0.3s; white-space: nowrap;
        }
        .st-invite-btn:hover { box-shadow: 0 0 12px var(--accent-glow-sec); }
      `}</style>
    </div>
  );
}
