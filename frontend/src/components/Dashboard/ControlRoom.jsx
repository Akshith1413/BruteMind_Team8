/**
 * ControlRoom.jsx — Cortex OS Executive Metrics Dashboard
 * System health gauge, 9-metric grid, live telemetry chart, crisis alerts, and terminal log.
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { api } from '../../utils/api';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Activity, TrendingUp, DollarSign, Flame, Users, Heart,
  ShieldAlert, BarChart3, Target, AlertTriangle, X,
} from 'lucide-react';
import gsap from 'gsap';

/* ── metric card definitions ─────────────────────────────── */
const METRIC_DEFS = [
  { key: 'healthScore',    label: 'HEALTH SCORE',    icon: Heart,       unit: '%',  color: '#22c55e' },
  { key: 'growthScore',    label: 'GROWTH SCORE',    icon: TrendingUp,  unit: '%',  color: '#00f2fe' },
  { key: 'revenue',        label: 'REVENUE',         icon: DollarSign,  unit: 'K',  color: '#a855f7' },
  { key: 'burnRate',       label: 'BURN RATE',       icon: Flame,       unit: 'K',  color: '#f97316' },
  { key: 'cac',            label: 'CAC',             icon: Users,       unit: '$',  color: '#f43f5e' },
  { key: 'ltv',            label: 'LTV',             icon: BarChart3,   unit: '$',  color: '#06b6d4' },
  { key: 'nps',            label: 'NPS',             icon: Activity,    unit: '',   color: '#84cc16' },
  { key: 'pipelineValue',  label: 'PIPELINE VALUE',  icon: Target,      unit: 'K',  color: '#e879f9' },
  { key: 'riskIndex',      label: 'RISK INDEX',      icon: ShieldAlert, unit: '%',  color: '#ef4444' },
];

/* ── default stats (shown before any data is onboarded) ──── */
const DEFAULT_STATS = {
  healthScore: 0, growthScore: 0, revenue: 0, burnRate: 0,
  cac: 0, ltv: 0, nps: 0, pipelineValue: 0, riskIndex: 0,
};

export default function ControlRoom() {
  const {
    telemetryHistory, latestTelemetry, crisisAlert, dismissCrisis,
    dashboardStats, setDashboardStats,
  } = useDashboardStore();

  const gridRef = useRef(null);
  const gaugeRef = useRef(null);
  const termBodyRef = useRef(null);
  const [logs, setLogs] = useState([]);

  const stats = dashboardStats || DEFAULT_STATS;
  const health = latestTelemetry?.systemHealth ?? stats.healthScore ?? 0;

  /* ── Fetch dashboard stats periodically ────────────────────── */
  useEffect(() => {
    const fetchStats = () => {
      api.get('/business/dashboard-stats')
        .then(setDashboardStats)
        .catch(() => {
          // Only set defaults if we have no data yet
          if (!useDashboardStore.getState().dashboardStats) {
            setDashboardStats(DEFAULT_STATS);
          }
        });
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ── GSAP stagger cards on mount ───────────────────────── */
  useEffect(() => {
    if (gridRef.current) {
      gsap.fromTo(
        gridRef.current.children,
        { y: 30, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.07, ease: 'back.out(1.4)' }
      );
    }
  }, []);

  /* ── Gauge arc animation ───────────────────────────────── */
  useEffect(() => {
    if (gaugeRef.current) {
      const arc = gaugeRef.current.querySelector('.cr-gauge-arc');
      if (arc) {
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (health / 100) * circumference;
        gsap.to(arc, { strokeDashoffset: offset, duration: 1.2, ease: 'power3.out' });
      }
    }
  }, [health]);

  /* ── Simulated log feed from telemetry ─────────────────── */
  useEffect(() => {
    if (latestTelemetry) {
      const ts = new Date().toLocaleTimeString();
      const msg = `[${ts}] SYS: HR=${latestTelemetry.heartRate?.toFixed(1)} | NS=${latestTelemetry.neuralSync?.toFixed(1)}% | HP=${latestTelemetry.systemHealth?.toFixed(1)}%`;
      setLogs((prev) => [...prev.slice(-30), msg]);
    }
  }, [latestTelemetry]);

  useEffect(() => {
    if (termBodyRef.current) {
      termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight;
    }
  }, [logs]);

  /* ── Gauge color ───────────────────────────────────────── */
  const gaugeColor = health > 80 ? '#22c55e' : health > 60 ? '#eab308' : '#ef4444';
  const circumference = 2 * Math.PI * 54;

  /* ── Chart data ────────────────────────────────────────── */
  const chartData = useMemo(() =>
    telemetryHistory.map((t, i) => ({
      idx: i,
      heartRate: t.heartRate,
      neuralSync: t.neuralSync,
      systemHealth: t.systemHealth,
    })),
    [telemetryHistory]
  );

  return (
    <div className="cr-root">
      {/* Crisis Alert Banner */}
      {crisisAlert && (
        <div className="cr-crisis">
          <AlertTriangle size={18} />
          <div className="cr-crisis-text">
            <strong>{crisisAlert.title}</strong>
            <p>{crisisAlert.message}</p>
          </div>
          <button className="cr-crisis-action text-mono" onClick={() => {}}>
            APPLY CRISIS PROTOCOL Δ-4
          </button>
          <button className="cr-crisis-dismiss" onClick={dismissCrisis}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Row: Gauge + Quick Stats */}
      <div className="cr-top-row">
        {/* System Health Gauge */}
        <div className="cr-gauge-card" ref={gaugeRef}>
          <svg viewBox="0 0 120 120" className="cr-gauge-svg">
            <defs>
              <filter id="gaugeGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--glass-border)" strokeWidth="6" />
            <circle
              className="cr-gauge-arc"
              cx="60" cy="60" r="54"
              fill="none"
              stroke={gaugeColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              transform="rotate(-90 60 60)"
              filter="url(#gaugeGlow)"
            />
          </svg>
          <div className="cr-gauge-value text-tech" style={{ color: gaugeColor }}>
            {Math.round(health)}
          </div>
          <div className="cr-gauge-label text-mono">SYSTEM HEALTH</div>
        </div>

        {/* Quick Stat Cards */}
        <div className="cr-quick-stats">
          <div className="cr-quick-card">
            <span className="cr-quick-num text-tech" style={{ color: 'var(--color-hr-value, #00f2fe)' }}>
              {latestTelemetry?.heartRate?.toFixed(0) || '72'}
            </span>
            <span className="cr-quick-lbl text-mono">HEART RATE</span>
          </div>
          <div className="cr-quick-card">
            <span className="cr-quick-num text-tech" style={{ color: '#a855f7' }}>
              {latestTelemetry?.neuralSync?.toFixed(1) || '98.4'}%
            </span>
            <span className="cr-quick-lbl text-mono">NEURAL SYNC</span>
          </div>
          <div className="cr-quick-card">
            <span className="cr-quick-num text-tech" style={{ color: '#22c55e' }}>
              {latestTelemetry?.genomicDepth?.toFixed(1) || '4.2'}GB
            </span>
            <span className="cr-quick-lbl text-mono">GENOMIC DEPTH</span>
          </div>
        </div>
      </div>

      {/* 9-Metric Grid */}
      <div className="cr-metrics-grid" ref={gridRef}>
        {METRIC_DEFS.map((m) => {
          const Icon = m.icon;
          const val = stats[m.key] ?? 0;
          return (
            <div key={m.key} className="cr-metric-card">
              <Icon size={28} className="cr-metric-icon" style={{ color: m.color }} />
              <div className="cr-metric-label text-mono">{m.label}</div>
              <div className="cr-metric-value text-tech">
                {typeof val === 'number' ? val.toLocaleString() : val}
                <span className="cr-metric-unit">{m.unit}</span>
              </div>
              {/* Mini sparkline bar */}
              <div className="cr-sparkline">
                <div className="cr-sparkline-fill" style={{ width: `${Math.min(100, (val / 100) * 100)}%`, background: m.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Telemetry Chart */}
      <div className="cr-chart-card">
        <div className="cr-chart-header text-mono">
          <Activity size={14} style={{ color: 'var(--accent-primary)' }} />
          REAL-TIME TELEMETRY STREAM
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradHR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00f2fe" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNS" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSH" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="idx" tick={false} axisLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'rgba(6,7,13,0.9)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, fontFamily: 'Share Tech Mono', fontSize: 11,
              }}
            />
            <Area type="monotone" dataKey="heartRate" stroke="#00f2fe" fill="url(#gradHR)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="neuralSync" stroke="#a855f7" fill="url(#gradNS)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="systemHealth" stroke="#22c55e" fill="url(#gradSH)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="cr-chart-legend text-mono">
          <span><i style={{ background: '#00f2fe' }} /> HEART RATE</span>
          <span><i style={{ background: '#a855f7' }} /> NEURAL SYNC</span>
          <span><i style={{ background: '#22c55e' }} /> SYS HEALTH</span>
        </div>
      </div>

      {/* Terminal Log */}
      <div className="cr-terminal">
        <div className="cr-term-header">
          <div className="cr-dot" style={{ background: '#ef4444' }} />
          <div className="cr-dot" style={{ background: '#eab308' }} />
          <div className="cr-dot" style={{ background: '#22c55e' }} />
          <span className="cr-term-title text-mono">TELEMETRY_FEED.log</span>
        </div>
        <div className="cr-term-body text-mono" ref={termBodyRef}>
          {logs.length === 0 && <div className="cr-term-line" style={{ color: 'var(--text-muted)' }}>Awaiting telemetry stream...</div>}
          {logs.map((l, i) => (
            <div key={i} className="cr-term-line"><span className="cr-prompt">&gt;</span> {l}</div>
          ))}
        </div>
      </div>

      <style>{`
        .cr-root {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          height: 100%;
          overflow: hidden;
        }

        /* ── Crisis Banner ─────────────────────── */
        .cr-crisis {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 20px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 12px;
          color: #fca5a5;
          animation: crPulse 2s ease-in-out infinite;
        }
        @keyframes crPulse {
          0%,100% { box-shadow: 0 0 10px rgba(239,68,68,0.15); }
          50%     { box-shadow: 0 0 25px rgba(239,68,68,0.35); }
        }
        .cr-crisis-text { flex: 1; }
        .cr-crisis-text strong { font-size: 13px; display: block; color: #f87171; }
        .cr-crisis-text p { font-size: 11px; margin-top: 4px; color: #fca5a5; }
        .cr-crisis-action {
          padding: 8px 16px;
          border: 1px solid #ef4444;
          border-radius: 6px;
          background: rgba(239,68,68,0.15);
          color: #f87171;
          cursor: pointer;
          font-size: 10px;
          letter-spacing: 1px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .cr-crisis-action:hover { background: rgba(239,68,68,0.3); }
        .cr-crisis-dismiss {
          background: none; border: none; color: #fca5a5; cursor: pointer;
          padding: 4px; display: flex;
        }

        /* ── Top Row ───────────────────────────── */
        .cr-top-row {
          display: flex;
          gap: 20px;
          align-items: stretch;
        }

        .cr-gauge-card {
          position: relative;
          width: 160px;
          min-width: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 20px;
          box-shadow: var(--glass-shadow);
        }
        .cr-gauge-svg { width: 110px; height: 110px; }
        .cr-gauge-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -60%);
          font-size: 32px;
          font-weight: 700;
        }
        .cr-gauge-label {
          font-size: 9px;
          letter-spacing: 1.5px;
          color: var(--text-muted);
          margin-top: 8px;
        }

        .cr-quick-stats {
          flex: 1;
          display: flex;
          gap: 14px;
        }
        .cr-quick-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 6px;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          padding: 20px;
          box-shadow: var(--glass-shadow);
          transition: all 0.3s ease;
        }
        .cr-quick-card:hover {
          border-color: var(--glass-border-focus);
          box-shadow: var(--glass-shadow), 0 0 20px var(--accent-glow);
          transform: translateY(-2px);
        }
        .cr-quick-num { font-size: 28px; font-weight: 700; }
        .cr-quick-lbl { font-size: 9px; letter-spacing: 1.5px; color: var(--text-muted); }

        /* ── 9-Metric Grid ─────────────────────── */
        .cr-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) {
          .cr-metrics-grid { grid-template-columns: repeat(2, 1fr); }
          .cr-top-row { flex-direction: column; }
          .cr-gauge-card { width: 100%; min-width: unset; }
        }
        @media (max-width: 550px) {
          .cr-metrics-grid { grid-template-columns: 1fr; }
        }

        .cr-metric-card {
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 18px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: default;
        }
        .cr-metric-card:hover {
          border-color: var(--glass-border-focus);
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3), 0 0 15px var(--accent-glow);
        }
        .cr-metric-icon {
          position: absolute;
          right: 14px; top: 14px;
          opacity: 0.15;
        }
        .cr-metric-label {
          font-size: 9px;
          letter-spacing: 1.5px;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        .cr-metric-value {
          font-size: 26px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .cr-metric-unit {
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 400;
          margin-left: 2px;
        }
        .cr-sparkline {
          margin-top: 10px;
          height: 3px;
          background: var(--glass-border);
          border-radius: 2px;
          overflow: hidden;
        }
        .cr-sparkline-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 1s ease;
        }

        /* ── Telemetry Chart ───────────────────── */
        .cr-chart-card {
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          padding: 18px;
          box-shadow: var(--glass-shadow);
        }
        .cr-chart-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          letter-spacing: 1.5px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }
        .cr-chart-legend {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-top: 10px;
          font-size: 9px;
          letter-spacing: 1px;
          color: var(--text-muted);
        }
        .cr-chart-legend i {
          display: inline-block;
          width: 8px; height: 8px;
          border-radius: 2px;
          margin-right: 5px;
          vertical-align: middle;
        }

        /* ── Terminal Log ──────────────────────── */
        .cr-terminal {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          overflow: hidden;
          background: rgba(0,0,0,0.4);
        }
        .cr-term-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--glass-border);
        }
        .cr-dot { width: 8px; height: 8px; border-radius: 50%; }
        .cr-term-title {
          font-size: 10px;
          color: var(--text-secondary);
          margin-left: 10px;
          letter-spacing: 0.5px;
        }
        .cr-term-body {
          padding: 14px;
          font-size: 11px;
          color: #a7f3d0;
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 5px;
          background: #040508;
        }
        .cr-term-line { line-height: 1.4; white-space: pre-wrap; }
        .cr-prompt { color: var(--accent-primary); margin-right: 6px; }
      `}</style>
    </div>
  );
}
