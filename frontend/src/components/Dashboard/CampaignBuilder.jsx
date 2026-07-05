/**
 * CampaignBuilder.jsx — Cortex OS Visual Campaign Architect
 * Drag-style campaign creation with channel cards, audience pills, budget slider, and live preview.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { api } from '../../utils/api';
import { AudioSynth } from '../../utils/AudioSynth';
import gsap from 'gsap';
import {
  Megaphone, Target, DollarSign, FileText, Eye, Save, Rocket,
  Hash, Mail, Search, Presentation, Globe, MonitorPlay, CheckCircle2, Sparkles
} from 'lucide-react';

const CHANNELS = [
  { id: 'LinkedIn', icon: Hash, color: '#0a66c2' },
  { id: 'Email', icon: Mail, color: '#ea4335' },
  { id: 'SEO', icon: Search, color: '#34a853' },
  { id: 'Seminars', icon: Presentation, color: '#f59e0b' },
  { id: 'Webinars', icon: MonitorPlay, color: '#8b5cf6' },
  { id: 'Paid Ads', icon: Globe, color: '#ec4899' },
];

const AUDIENCES = [
  'Executives', 'Developers', 'Marketing', 'Finance', 'Operations', 'HR', 'Sales', 'Product'
];

export default function CampaignBuilder() {
  const { setCampaigns, campaigns, setActiveView } = useDashboardStore();
  const rootRef = useRef(null);

  const [name, setName] = useState('');
  const [channels, setChannels] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [budget, setBudget] = useState(15000);
  const [copyText, setCopyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* ── GSAP entrance ────────────────────────────────── */
  useEffect(() => {
    if (rootRef.current) {
      gsap.fromTo(
        rootRef.current.querySelectorAll('.cb-section'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' }
      );
    }
  }, []);

  /* ── Toggle helpers ───────────────────────────────── */
  const toggleChannel = (id) => {
    AudioSynth.playClick();
    setChannels((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const toggleAudience = (a) => {
    AudioSynth.playClick();
    setAudiences((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  /* ── Save campaign ────────────────────────────────── */
  const saveCampaign = useCallback(async (deploy = false) => {
    if (!name.trim()) return;
    setSaving(true);
    AudioSynth.playTransition();
    try {
      const payload = {
        campaignName: name.trim(),
        channels,
        targetAudience: audiences,
        budget,
        copyTemplate: copyText,
      };
      const res = await api.post('/business/campaigns', payload);
      const newCampaign = res.campaign || res;
      setCampaigns([...(campaigns || []), { _id: newCampaign._id || Date.now().toString(), ...payload }]);
      setSaved(true);
      AudioSynth.playSuccess();
      setTimeout(() => setSaved(false), 2500);

      if (deploy) {
        setTimeout(() => setActiveView('simulator'), 600);
      }
    } catch (err) {
      console.error('Campaign save error:', err);
    } finally {
      setSaving(false);
    }
  }, [name, channels, audiences, budget, copyText, campaigns]);

  const budgetPercent = ((budget - 1000) / (100000 - 1000)) * 100;

  return (
    <div className="cb-root" ref={rootRef}>
      {/* ── Header ─────────────────────────── */}
      <div className="cb-header cb-section">
        <div className="cb-header-left">
          <Megaphone size={22} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 className="text-tech">CAMPAIGN ARCHITECT</h2>
            <p className="text-mono cb-subtitle">Design, preview, and deploy marketing campaigns</p>
          </div>
        </div>
      </div>

      <div className="cb-body">
        {/* ── Left: Builder ─────────────────── */}
        <div className="cb-builder">
          {/* Campaign Name */}
          <div className="cb-section cb-card">
            <label className="cb-label text-mono"><FileText size={13} /> CAMPAIGN NAME</label>
            <input
              className="cb-input text-mono"
              placeholder="e.g. Q3 Enterprise Growth Blitz"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Channel Selector */}
          <div className="cb-section cb-card">
            <label className="cb-label text-mono"><Target size={13} /> SELECT CHANNELS</label>
            <div className="cb-channels">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const sel = channels.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    className={`cb-channel ${sel ? 'cb-channel-active' : ''}`}
                    onClick={() => toggleChannel(ch.id)}
                    style={sel ? { borderColor: ch.color, boxShadow: `0 0 16px ${ch.color}33` } : {}}
                  >
                    <Icon size={18} style={{ color: sel ? ch.color : 'var(--text-muted)' }} />
                    <span className="text-mono">{ch.id}</span>
                    {sel && <CheckCircle2 size={12} className="cb-check" style={{ color: ch.color }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Audience */}
          <div className="cb-section cb-card">
            <label className="cb-label text-mono"><Target size={13} /> TARGET AUDIENCE</label>
            <div className="cb-audiences">
              {AUDIENCES.map((a) => {
                const sel = audiences.includes(a);
                return (
                  <button
                    key={a}
                    className={`cb-audience ${sel ? 'cb-audience-active' : ''}`}
                    onClick={() => toggleAudience(a)}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget Slider */}
          <div className="cb-section cb-card">
            <label className="cb-label text-mono"><DollarSign size={13} /> CAMPAIGN BUDGET</label>
            <div className="cb-budget-wrap">
              <div className="cb-budget-display text-tech">${budget.toLocaleString()}</div>
              <div className="cb-slider-track">
                <div className="cb-slider-fill" style={{ width: `${budgetPercent}%` }} />
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="500"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="cb-slider"
                />
              </div>
              <div className="cb-budget-range text-mono">
                <span>$1,000</span><span>$100,000</span>
              </div>
            </div>
          </div>

          {/* Copy Template */}
          <div className="cb-section cb-card">
            <label className="cb-label text-mono"><FileText size={13} /> MARKETING COPY</label>
            <textarea
              className="cb-textarea text-mono"
              placeholder="Write your campaign copy here... Include pain points, value propositions, and call-to-action."
              value={copyText}
              onChange={(e) => setCopyText(e.target.value)}
              maxLength={1000}
            />
            <div className="cb-char-count text-mono">{copyText.length}/1000</div>
          </div>
        </div>

        {/* ── Right: Preview ────────────────── */}
        <div className="cb-preview-col">
          <div className="cb-section cb-preview-card">
            <div className="cb-preview-title text-mono"><Eye size={13} /> LIVE PREVIEW</div>
            <div className="cb-preview-body">
              <div className="cb-pv-name text-tech">{name || 'Untitled Campaign'}</div>
              <div className="cb-pv-row">
                <span className="cb-pv-label text-mono">CHANNELS</span>
                <div className="cb-pv-tags">
                  {channels.length === 0
                    ? <span className="cb-pv-empty text-mono">None selected</span>
                    : channels.map((c) => <span key={c} className="cb-pv-tag text-mono">{c}</span>)
                  }
                </div>
              </div>
              <div className="cb-pv-row">
                <span className="cb-pv-label text-mono">AUDIENCE</span>
                <div className="cb-pv-tags">
                  {audiences.length === 0
                    ? <span className="cb-pv-empty text-mono">None selected</span>
                    : audiences.map((a) => <span key={a} className="cb-pv-tag cb-pv-tag-aud text-mono">{a}</span>)
                  }
                </div>
              </div>
              <div className="cb-pv-row">
                <span className="cb-pv-label text-mono">BUDGET</span>
                <span className="cb-pv-budget text-tech">${budget.toLocaleString()}</span>
              </div>
              {copyText && (
                <div className="cb-pv-row cb-pv-copy-row">
                  <span className="cb-pv-label text-mono">COPY</span>
                  <p className="cb-pv-copy">{copyText.slice(0, 200)}{copyText.length > 200 ? '...' : ''}</p>
                </div>
              )}

              {/* Readiness Score */}
              <div className="cb-pv-score-wrap">
                <div className="cb-pv-score-label text-mono">CAMPAIGN READINESS</div>
                <div className="cb-pv-score-bar">
                  <div
                    className="cb-pv-score-fill"
                    style={{
                      width: `${Math.min(100, (!!name.trim() ? 25 : 0) + (channels.length > 0 ? 25 : 0) + (audiences.length > 0 ? 25 : 0) + (copyText.length > 10 ? 25 : 0))}%`
                    }}
                  />
                </div>
                <span className="cb-pv-score-num text-tech">
                  {(!!name.trim() ? 25 : 0) + (channels.length > 0 ? 25 : 0) + (audiences.length > 0 ? 25 : 0) + (copyText.length > 10 ? 25 : 0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="cb-section cb-actions">
            <button
              className="cb-btn cb-btn-save text-mono"
              onClick={() => saveCampaign(false)}
              disabled={!name.trim() || saving}
            >
              {saved ? <><CheckCircle2 size={14} /> SAVED!</> : saving ? <><Sparkles size={14} /> SAVING...</> : <><Save size={14} /> SAVE CAMPAIGN</>}
            </button>
            <button
              className="cb-btn cb-btn-deploy text-mono"
              onClick={() => saveCampaign(true)}
              disabled={!name.trim() || saving}
            >
              <Rocket size={14} /> SAVE & DEPLOY TO SIMULATOR
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .cb-root {
          display: flex; flex-direction: column; gap: 20px;
          padding: 24px; overflow-y: auto; height: 100%;
        }
        .cb-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .cb-header-left { display: flex; align-items: center; gap: 14px; }
        .cb-header h2 { font-size: 18px; letter-spacing: 2px; color: var(--text-primary); margin: 0; }
        .cb-subtitle { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

        .cb-body { display: flex; gap: 24px; flex: 1; min-height: 0; }
        @media (max-width: 960px) { .cb-body { flex-direction: column; } }

        .cb-builder { flex: 1; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; padding-right: 4px; }
        .cb-preview-col { width: 340px; min-width: 280px; display: flex; flex-direction: column; gap: 16px; }
        @media (max-width: 960px) { .cb-preview-col { width: 100%; } }

        .cb-card {
          background: var(--glass-bg); backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border); border-radius: 14px;
          padding: 18px; box-shadow: var(--glass-shadow);
        }
        .cb-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 10px; letter-spacing: 1.5px; color: var(--text-secondary);
          margin-bottom: 12px;
        }
        .cb-input {
          width: 100%; padding: 12px 16px;
          background: var(--neumorphic-press); border: 1px solid var(--glass-border);
          border-radius: 10px; color: var(--text-primary); font-size: 13px;
          outline: none; transition: all 0.3s;
        }
        .cb-input:focus { border-color: var(--glass-border-focus); box-shadow: 0 0 12px var(--accent-glow); }

        /* Channels */
        .cb-channels { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        @media (max-width: 600px) { .cb-channels { grid-template-columns: repeat(2, 1fr); } }
        .cb-channel {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 14px 8px; background: var(--glass-bg); backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border); border-radius: 12px;
          cursor: pointer; transition: all 0.3s; position: relative; color: var(--text-secondary);
        }
        .cb-channel span { font-size: 9px; letter-spacing: 1px; }
        .cb-channel:hover { border-color: var(--glass-border-focus); transform: translateY(-2px); }
        .cb-channel-active { background: rgba(0,242,254,0.04); border-color: var(--accent-primary); }
        .cb-check { position: absolute; top: 6px; right: 6px; }

        /* Audiences */
        .cb-audiences { display: flex; flex-wrap: wrap; gap: 8px; }
        .cb-audience {
          padding: 8px 16px; border-radius: 20px;
          background: var(--neumorphic-press); border: 1px solid var(--glass-border);
          color: var(--text-secondary); font-size: 11px; letter-spacing: 1px;
          font-family: var(--font-mono); cursor: pointer; transition: all 0.3s;
        }
        .cb-audience:hover { border-color: var(--accent-secondary); color: var(--text-primary); }
        .cb-audience-active {
          background: linear-gradient(135deg, rgba(127,0,255,0.12), rgba(0,242,254,0.08));
          border-color: var(--accent-secondary); color: var(--text-primary);
          box-shadow: 0 0 10px var(--accent-glow-sec);
        }

        /* Budget */
        .cb-budget-wrap { display: flex; flex-direction: column; gap: 8px; }
        .cb-budget-display { font-size: 28px; font-weight: 700; color: var(--accent-primary); text-align: center; }
        .cb-slider-track {
          position: relative; height: 8px; border-radius: 4px;
          background: var(--neumorphic-press); overflow: visible;
        }
        .cb-slider-fill {
          position: absolute; top: 0; left: 0; height: 100%; border-radius: 4px;
          background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
          pointer-events: none;
        }
        .cb-slider {
          position: absolute; top: -4px; left: 0; width: 100%; height: 16px;
          -webkit-appearance: none; appearance: none; background: transparent;
          cursor: pointer; outline: none;
        }
        .cb-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: var(--accent-primary); border: 2px solid var(--bg-color);
          box-shadow: 0 0 10px var(--accent-glow);
        }
        .cb-budget-range { display: flex; justify-content: space-between; font-size: 9px; color: var(--text-muted); letter-spacing: 1px; }

        /* Textarea */
        .cb-textarea {
          width: 100%; min-height: 100px; padding: 12px 16px; resize: vertical;
          background: var(--neumorphic-press); border: 1px solid var(--glass-border);
          border-radius: 10px; color: var(--text-primary); font-size: 12px;
          outline: none; transition: all 0.3s; line-height: 1.6;
        }
        .cb-textarea:focus { border-color: var(--glass-border-focus); box-shadow: 0 0 12px var(--accent-glow); }
        .cb-char-count { font-size: 9px; color: var(--text-muted); text-align: right; margin-top: 4px; letter-spacing: 1px; }

        /* Preview */
        .cb-preview-card {
          background: var(--glass-bg); backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border); border-radius: 14px;
          padding: 18px; box-shadow: var(--glass-shadow); flex: 1;
        }
        .cb-preview-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 10px; letter-spacing: 1.5px; color: var(--text-secondary);
          padding-bottom: 12px; border-bottom: 1px solid var(--glass-border); margin-bottom: 14px;
        }
        .cb-preview-body { display: flex; flex-direction: column; gap: 14px; }
        .cb-pv-name { font-size: 18px; font-weight: 700; color: var(--text-primary); letter-spacing: 1px; }
        .cb-pv-row { display: flex; flex-direction: column; gap: 6px; }
        .cb-pv-label { font-size: 9px; letter-spacing: 1.5px; color: var(--text-muted); }
        .cb-pv-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .cb-pv-tag {
          padding: 4px 10px; border-radius: 6px; font-size: 9px; letter-spacing: 1px;
          background: rgba(0,242,254,0.08); border: 1px solid rgba(0,242,254,0.2);
          color: var(--accent-primary);
        }
        .cb-pv-tag-aud {
          background: rgba(127,0,255,0.08); border-color: rgba(127,0,255,0.2);
          color: var(--accent-secondary);
        }
        .cb-pv-empty { font-size: 10px; color: var(--text-muted); font-style: italic; }
        .cb-pv-budget { font-size: 22px; font-weight: 700; color: var(--accent-primary); }
        .cb-pv-copy { font-size: 11px; color: var(--text-secondary); line-height: 1.5; margin: 0; }
        .cb-pv-copy-row { border-top: 1px solid var(--glass-border); padding-top: 10px; }

        /* Score */
        .cb-pv-score-wrap {
          border-top: 1px solid var(--glass-border); padding-top: 14px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .cb-pv-score-label { font-size: 9px; letter-spacing: 1.5px; color: var(--text-muted); }
        .cb-pv-score-bar {
          height: 6px; border-radius: 3px; background: var(--neumorphic-press); overflow: hidden;
        }
        .cb-pv-score-fill {
          height: 100%; border-radius: 3px; transition: width 0.4s ease;
          background: linear-gradient(90deg, var(--accent-primary), #22c55e);
        }
        .cb-pv-score-num { font-size: 14px; font-weight: 700; color: var(--accent-primary); }

        /* Actions */
        .cb-actions { display: flex; gap: 10px; }
        @media (max-width: 500px) { .cb-actions { flex-direction: column; } }
        .cb-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 20px; border-radius: 10px; font-size: 11px; letter-spacing: 1px;
          cursor: pointer; transition: all 0.3s; border: 1px solid var(--glass-border);
          white-space: nowrap;
        }
        .cb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cb-btn-save {
          background: var(--glass-bg); color: var(--text-primary);
        }
        .cb-btn-save:hover:not(:disabled) { border-color: var(--glass-border-focus); box-shadow: 0 0 15px var(--accent-glow); }
        .cb-btn-deploy {
          background: linear-gradient(135deg, rgba(0,242,254,0.12), rgba(127,0,255,0.08));
          border-color: var(--accent-primary); color: var(--accent-primary);
        }
        .cb-btn-deploy:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(0,242,254,0.2), rgba(127,0,255,0.14));
          box-shadow: 0 0 20px var(--accent-glow);
        }
      `}</style>
    </div>
  );
}
