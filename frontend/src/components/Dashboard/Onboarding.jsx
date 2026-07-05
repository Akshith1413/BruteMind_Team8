/**
 * Onboarding.jsx — Cortex OS Document Ingestion & RAG Visualizer
 * Drag-drop upload, processing animation, Business DNA profile, semantic vector cloud.
 */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { api } from '../../utils/api';
import { AudioSynth } from '../../utils/AudioSynth';
import gsap from 'gsap';
import { Upload, FileText, Database, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

/* ── Mock vector cloud nodes ─────────────────────────────── */
const generateCloudNodes = (count = 18) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 340,
    y: 20 + Math.random() * 160,
    r: 3 + Math.random() * 4,
    color: ['#00f2fe', '#a855f7', '#22c55e', '#f97316', '#60a5fa', '#e879f9'][i % 6],
    label: ['Revenue Q3', 'Client Contract', 'Sales Report', 'Pitch Deck', 'Invoice #42', 'Team OKRs', 'Market Analysis', 'Budget FY26', 'Competitor Intel', 'Product Roadmap', 'KPI Dashboard', 'Org Chart', 'Compliance Doc', 'Vendor Agreement', 'Risk Assessment', 'Growth Plan', 'Board Minutes', 'Strategy Brief'][i % 18],
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
  }));

/* ── Mock chunks for processing viz ──────────────────────── */
const MOCK_CHUNKS = [
  'Quarterly revenue grew 23% YoY...',
  'Target audience: Enterprise SaaS...',
  'CAC reduced to $120 via LinkedIn...',
  'Pipeline health score: 87/100...',
  'NPS improved to 72 after Q2 push...',
  'Burn rate stabilized at $38K/mo...',
];

export default function Onboarding() {
  const { onboardingStatus, setOnboardingStatus, businessProfile, setBusinessProfile } = useDashboardStore();
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [visibleChunks, setVisibleChunks] = useState([]);
  const [cloudNodes] = useState(() => generateCloudNodes());
  const [hoveredNode, setHoveredNode] = useState(null);
  const dropRef = useRef(null);
  const chunksRef = useRef(null);
  const profileRef = useRef(null);
  const cloudRef = useRef(null);

  /* ── Fetch profile on mount ────────────────────────────── */
  useEffect(() => {
    api.get('/business/profile')
      .then((profile) => {
        if (profile && profile.companyName) {
          setBusinessProfile(profile);
          setOnboardingStatus('complete');
        }
      })
      .catch((err) => console.warn('No active business profile found yet.', err));
  }, [setBusinessProfile, setOnboardingStatus]);

  /* ── Upload handler ────────────────────────────────────── */
  const handleUpload = useCallback(async (file) => {
    setFileName(file.name);
    setOnboardingStatus('uploading');
    AudioSynth.playTransition();

    const fd = new FormData();
    fd.append('file', file);
    fd.append('companyName', 'Cortex Corp');

    try {
      // Simulate processing visualization
      setOnboardingStatus('processing');
      setVisibleChunks([]);

      // Show chunks one-by-one
      for (let i = 0; i < MOCK_CHUNKS.length; i++) {
        await new Promise((r) => setTimeout(r, 400));
        setVisibleChunks((prev) => [...prev, MOCK_CHUNKS[i]]);
      }

      const result = await api.upload('/business/onboard', fd);
      setBusinessProfile(result);
      setOnboardingStatus('complete');
      AudioSynth.playSuccess();

      // Immediately refresh dashboard stats so ControlRoom/Analytics update
      api.get('/business/dashboard-stats')
        .then(useDashboardStore.getState().setDashboardStats)
        .catch(console.error);
    } catch (err) {
      console.error('Onboarding upload error:', err);
      setOnboardingStatus('error');
    }
  }, [setOnboardingStatus, setBusinessProfile]);

  /* ── Drag & drop events ────────────────────────────────── */
  const onDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const onDragLeave = useCallback(() => setDragOver(false), []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);
  const onFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  /* ── GSAP: Animate chunks appearing ────────────────────── */
  useEffect(() => {
    if (chunksRef.current && visibleChunks.length > 0) {
      const last = chunksRef.current.lastElementChild;
      if (last) gsap.fromTo(last, { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
    }
  }, [visibleChunks]);

  /* ── GSAP: Animate profile card ────────────────────────── */
  useEffect(() => {
    if (onboardingStatus === 'complete' && profileRef.current) {
      gsap.fromTo(profileRef.current, { y: 30, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.3)' });
    }
  }, [onboardingStatus]);

  /* ── Animate cloud nodes floating ──────────────────────── */
  useEffect(() => {
    if (!cloudRef.current || onboardingStatus !== 'complete') return;
    let raf;
    const nodes = [...cloudNodes];
    const animate = () => {
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 20 || n.x > 380) n.vx *= -1;
        if (n.y < 15 || n.y > 185) n.vy *= -1;
      });
      const circles = cloudRef.current?.querySelectorAll('.ob-cloud-dot');
      circles?.forEach((c, i) => {
        if (nodes[i]) {
          c.setAttribute('cx', nodes[i].x);
          c.setAttribute('cy', nodes[i].y);
        }
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [onboardingStatus, cloudNodes]);

  /* ── Connection lines between nearby nodes ─────────────── */
  const connections = useMemo(() => {
    const conns = [];
    for (let i = 0; i < cloudNodes.length; i++) {
      for (let j = i + 1; j < cloudNodes.length; j++) {
        const dx = cloudNodes[i].x - cloudNodes[j].x;
        const dy = cloudNodes[i].y - cloudNodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < 120) {
          conns.push({ from: cloudNodes[i], to: cloudNodes[j], key: `${i}-${j}` });
        }
      }
    }
    return conns;
  }, [cloudNodes]);

  return (
    <div className="ob-root">
      {/* Header */}
      <div className="ob-header">
        <Database size={20} style={{ color: 'var(--accent-primary)' }} />
        <div>
          <h2 className="text-tech">DOCUMENT INGESTION</h2>
          <p className="text-mono ob-subtitle">Upload business documents to power the RAG knowledge engine</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="ob-content">
        {/* Upload Zone */}
        {(!onboardingStatus || onboardingStatus === 'error') && (
          <div
            ref={dropRef}
            className={`ob-dropzone ${dragOver ? 'ob-drag-active' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById('ob-file-input').click()}
          >
            <input id="ob-file-input" type="file" accept=".pdf,.csv,.xlsx,.txt,.doc,.docx" onChange={onFileSelect} style={{ display: 'none' }} />
            <div className="ob-drop-icon">
              <Upload size={40} />
            </div>
            <p className="ob-drop-title text-tech">DROP YOUR BUSINESS DOCUMENTS</p>
            <p className="ob-drop-sub text-mono">PDF · CSV · XLSX · TXT · DOC</p>
            {onboardingStatus === 'error' && (
              <div className="ob-error">
                <AlertCircle size={14} /> Upload failed — click to retry
              </div>
            )}
          </div>
        )}

        {/* Processing Visualization */}
        {(onboardingStatus === 'uploading' || onboardingStatus === 'processing') && (
          <div className="ob-processing">
            <div className="ob-proc-header">
              <Loader2 size={18} className="ob-spin" />
              <span className="text-mono">
                {onboardingStatus === 'uploading' ? 'UPLOADING' : 'VECTORIZING'}: {fileName}
              </span>
            </div>
            <div className="ob-chunks" ref={chunksRef}>
              {visibleChunks.map((chunk, i) => (
                <div key={i} className="ob-chunk">
                  <FileText size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <span className="ob-chunk-text text-mono">{chunk}</span>
                  <div className="ob-chunk-shimmer" />
                </div>
              ))}
            </div>
            <div className="ob-proc-vector">
              <div className="ob-vec-line" />
              <Database size={20} style={{ color: 'var(--accent-secondary)' }} />
              <span className="text-mono ob-vec-label">VECTOR DB</span>
            </div>
          </div>
        )}

        {/* Complete: Business DNA Profile */}
        {onboardingStatus === 'complete' && businessProfile && (
          <div className="ob-complete">
            <div className="ob-profile" ref={profileRef}>
              <div className="ob-profile-header">
                <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                <span className="text-tech ob-profile-title">BUSINESS DNA PROFILE</span>
              </div>
              <div className="ob-profile-grid">
                <div className="ob-profile-field">
                  <span className="ob-field-label text-mono">COMPANY</span>
                  <span className="ob-field-value">{businessProfile.companyName || 'Cortex Corp'}</span>
                </div>
                <div className="ob-profile-field">
                  <span className="ob-field-label text-mono">INDUSTRY</span>
                  <span className="ob-field-value">{businessProfile.industry || 'Enterprise AI'}</span>
                </div>
                <div className="ob-profile-field">
                  <span className="ob-field-label text-mono">SIZE</span>
                  <span className="ob-field-value">{businessProfile.size || '50-200'}</span>
                </div>
              </div>
              {businessProfile.capabilities && (
                <div className="ob-tags">
                  {businessProfile.capabilities.map((cap, i) => (
                    <span key={i} className="ob-tag text-mono">
                      <Sparkles size={10} /> {cap}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Semantic Vector Cloud */}
            <div className="ob-cloud-card">
              <div className="ob-cloud-title text-mono">
                <Sparkles size={14} style={{ color: 'var(--accent-secondary)' }} />
                SEMANTIC VECTOR CLOUD
              </div>
              <svg ref={cloudRef} viewBox="0 0 400 200" className="ob-cloud-svg">
                {connections.map((c) => (
                  <line key={c.key} x1={c.from.x} y1={c.from.y} x2={c.to.x} y2={c.to.y} stroke="var(--glass-border)" strokeWidth="0.8" opacity="0.4" />
                ))}
                {cloudNodes.map((n) => (
                  <g key={n.id} onMouseEnter={() => setHoveredNode(n.id)} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
                    <circle className="ob-cloud-dot" cx={n.x} cy={n.y} r={hoveredNode === n.id ? n.r + 3 : n.r} fill={n.color} opacity={hoveredNode === n.id ? 1 : 0.6} />
                    {hoveredNode === n.id && (
                      <>
                        <rect x={n.x - 40} y={n.y - 22} width="80" height="18" rx="4" fill="rgba(6,7,13,0.9)" stroke={n.color} strokeWidth="0.5" />
                        <text x={n.x} y={n.y - 10} textAnchor="middle" fill={n.color} fontSize="7" fontFamily="Share Tech Mono">{n.label}</text>
                      </>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .ob-root {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          overflow-y: auto;
          height: 100%;
        }
        .ob-header {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ob-header h2 { font-size: 18px; letter-spacing: 2px; color: var(--text-primary); margin: 0; }
        .ob-subtitle { font-size: 11px; color: var(--text-muted); letter-spacing: 0.5px; margin-top: 2px; }
        .ob-content { flex: 1; display: flex; flex-direction: column; gap: 20px; }

        /* ── Dropzone ──────────────────────────── */
        .ob-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 60px 30px;
          border: 2px dashed var(--glass-border);
          border-radius: 16px;
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          cursor: pointer;
          transition: all 0.35s ease;
          animation: obDash 8s linear infinite;
          background-size: 16px 16px;
        }
        @keyframes obDash {
          to { border-dash-offset: 40; }
        }
        .ob-dropzone:hover, .ob-drag-active {
          border-color: var(--accent-primary);
          background: rgba(0,242,254,0.03);
          box-shadow: 0 0 30px var(--accent-glow), inset 0 0 30px rgba(0,242,254,0.02);
          transform: scale(1.01);
        }
        .ob-drop-icon {
          color: var(--text-muted);
          transition: all 0.3s;
        }
        .ob-dropzone:hover .ob-drop-icon, .ob-drag-active .ob-drop-icon {
          color: var(--accent-primary);
          filter: drop-shadow(0 0 8px var(--accent-glow));
        }
        .ob-drop-title { font-size: 16px; letter-spacing: 2px; color: var(--text-secondary); }
        .ob-drop-sub { font-size: 11px; color: var(--text-muted); letter-spacing: 1px; }
        .ob-error {
          display: flex; align-items: center; gap: 6px;
          color: var(--accent-warn); font-size: 11px; margin-top: 8px;
        }

        /* ── Processing ────────────────────────── */
        .ob-processing {
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: var(--glass-shadow);
        }
        .ob-proc-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          letter-spacing: 1px;
          color: var(--accent-primary);
          margin-bottom: 16px;
        }
        .ob-spin { animation: obSpin 1s linear infinite; }
        @keyframes obSpin { to { transform: rotate(360deg); } }

        .ob-chunks { display: flex; flex-direction: column; gap: 8px; }
        .ob-chunk {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--neumorphic-press);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }
        .ob-chunk-text { font-size: 11px; color: var(--text-secondary); letter-spacing: 0.3px; }
        .ob-chunk-shimmer {
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0,242,254,0.06), transparent);
          animation: obShimmer 2s ease-in-out infinite;
        }
        @keyframes obShimmer { to { left: 100%; } }

        .ob-proc-vector {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--glass-border);
        }
        .ob-vec-line {
          flex: 1;
          height: 2px;
          background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 1px;
          animation: obVecPulse 1.5s ease-in-out infinite;
        }
        @keyframes obVecPulse {
          0%,100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .ob-vec-label { font-size: 10px; letter-spacing: 1.5px; color: var(--accent-secondary); }

        /* ── Complete ──────────────────────────── */
        .ob-complete { display: flex; flex-direction: column; gap: 20px; }

        .ob-profile {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: var(--glass-shadow);
        }
        .ob-profile-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }
        .ob-profile-title { font-size: 14px; letter-spacing: 2px; color: var(--text-primary); }

        .ob-profile-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (max-width: 600px) { .ob-profile-grid { grid-template-columns: 1fr; } }
        .ob-profile-field {
          padding: 12px;
          background: var(--neumorphic-press);
          border: 1px solid var(--glass-border);
          border-radius: 10px;
        }
        .ob-field-label { display: block; font-size: 9px; letter-spacing: 1.5px; color: var(--text-muted); margin-bottom: 4px; }
        .ob-field-value { font-size: 14px; color: var(--text-primary); font-weight: 500; }

        .ob-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .ob-tag {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 20px;
          background: rgba(0,242,254,0.06);
          border: 1px solid rgba(0,242,254,0.15);
          color: var(--accent-primary);
          font-size: 10px;
          letter-spacing: 0.5px;
        }

        /* ── Vector Cloud ──────────────────────── */
        .ob-cloud-card {
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          padding: 16px;
          box-shadow: var(--glass-shadow);
        }
        .ob-cloud-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          letter-spacing: 1.5px;
          color: var(--text-secondary);
          margin-bottom: 10px;
        }
        .ob-cloud-svg { width: 100%; height: auto; }
      `}</style>
    </div>
  );
}
