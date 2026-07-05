/**
 * Simulator.jsx — Cortex OS Synthetic Buyer Sandbox
 * 30-buyer persona grid, campaign deployment, live conversion log, funnel, and results summary.
 */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { getSocket } from '../../utils/socketClient';
import { api } from '../../utils/api';
import { AudioSynth } from '../../utils/AudioSynth';
import gsap from 'gsap';
import { Users, Zap, TrendingUp, Target, Play, BarChart3, Download } from 'lucide-react';

const ROLES = {
  healthcare: [
    'Biotech Investor', 'Clinical Director', 'Molecular Biochemist',
    'Health System CIO', 'SaaS Ops Director', 'Hospital Procurement',
    'Lab Director', 'Oncology Head', 'Hospital CFO', 'Genetic Counselor',
  ],
  enterprise: [
    'Venture Capitalist', 'VP of Operations', 'Product Manager',
    'Enterprise CIO', 'SaaS Procurement', 'HR Director',
    'Head of Sales', 'Chief Marketing Officer', 'Finance VP', 'Data Scientist',
  ]
};

const CHANNELS = ['LinkedIn', 'Email', 'SEO', 'Seminars'];

const generateBuyers = (mode) => Array.from({ length: 30 }, (_, i) => ({
  id: `buyer_${i + 1}`,
  num: i + 1,
  role: ROLES[mode][i % ROLES[mode].length],
  channel: CHANNELS[i % CHANNELS.length],
  status: 'cold', // cold | engaged | converted | ignored
}));

export default function Simulator() {
  const {
    simulatorRunning, simulatorTicks, simulatorReport,
    startSimulator, addSimulatorTick, setSimulatorReport,
    campaigns, setCampaigns, appMode
  } = useDashboardStore();

  const [buyers, setBuyers] = useState(() => generateBuyers(appMode));
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [eventLog, setEventLog] = useState([]);
  const logRef = useRef(null);
  const gridRef = useRef(null);

  /* ── Fetch campaigns on mount ──────────────────────────── */
  useEffect(() => {
    api.get('/business/campaigns')
      .then((data) => setCampaigns(Array.isArray(data) ? data : data.campaigns || []))
      .catch(() => setCampaigns([
        { _id: 'mock_1', campaignName: 'LinkedIn Growth Blitz' },
        { _id: 'mock_2', campaignName: 'Email Nurture Sequence' },
        { _id: 'mock_3', campaignName: 'SEO Content Push' },
      ]));
  }, []);

  /* ── Socket listeners ──────────────────────────────────── */
  useEffect(() => {
    const socket = getSocket();

    const onTick = (tick) => {
      addSimulatorTick(tick);
      AudioSynth.playClick();

      // Update buyer status
      setBuyers((prev) =>
        prev.map((b) =>
          b.id === tick.buyerId
            ? { ...b, status: tick.converted ? 'converted' : 'ignored' }
            : b
        )
      );

      // Add to event log
      setEventLog((prev) => [
        ...prev.slice(-40),
        {
          buyer: tick.buyerId,
          role: tick.role,
          converted: tick.converted,
          reason: tick.reason,
          prob: tick.probability,
        },
      ]);
    };

    const onComplete = (report) => {
      setSimulatorReport(report);
      AudioSynth.playSuccess();
    };

    socket.on('buyer_sim_tick', onTick);
    socket.on('buyer_sim_complete', onComplete);
    return () => {
      socket.off('buyer_sim_tick', onTick);
      socket.off('buyer_sim_complete', onComplete);
    };
  }, []);

  /* ── Auto-scroll log ───────────────────────────────────── */
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [eventLog]);

  /* ── GSAP grid entrance ────────────────────────────────── */
  useEffect(() => {
    if (gridRef.current) {
      gsap.fromTo(
        gridRef.current.children,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, stagger: 0.02, ease: 'back.out(1.2)' }
      );
    }
  }, []);

  /* ── Deploy campaign ───────────────────────────────────── */
  const deployCampaign = useCallback(() => {
    if (!selectedCampaign || simulatorRunning) return;
    startSimulator();
    setBuyers(generateBuyers(appMode));
    setEventLog([]);
    const socket = getSocket();
    socket.emit('trigger_buyer_simulation', { campaignId: selectedCampaign, mode: appMode });
    AudioSynth.playTransition();
  }, [selectedCampaign, simulatorRunning, startSimulator]);

  /* ── Funnel metrics ────────────────────────────────────── */
  const funnel = useMemo(() => {
    const total = buyers.length;
    const converted = buyers.filter((b) => b.status === 'converted').length;
    const ignored = buyers.filter((b) => b.status === 'ignored').length;
    const engaged = total - converted - ignored - buyers.filter((b) => b.status === 'cold').length;
    return { total, converted, ignored, engaged };
  }, [buyers]);

  /* ── Status color ──────────────────────────────────────── */
  const statusColor = (s) => {
    if (s === 'converted') return '#22c55e';
    if (s === 'ignored') return '#ef4444';
    if (s === 'engaged') return '#eab308';
    return 'var(--text-muted)';
  };

  /* ── Export to CSV ──────────────────────────────────── */
  const exportCSV = useCallback(() => {
    if (!simulatorReport) return;
    AudioSynth.playSuccess();
    let csv = 'Metric,Value\n';
    csv += `Impressions,${simulatorReport.totalImpressions}\n`;
    csv += `Conversions,${simulatorReport.conversions}\n`;
    csv += `Conversion Rate,${(simulatorReport.conversionRate * 100).toFixed(1)}%\n`;
    csv += `Revenue,$${simulatorReport.revenueGenerated?.toLocaleString()}\n\n`;
    csv += 'Buyer,Role,Status,Converted,Reason,Probability\n';
    eventLog.forEach((e) => {
      csv += `"${e.buyer}","${e.role}","${e.converted ? 'CONVERTED' : 'IGNORED'}",${e.converted},"${(e.reason || '').replace(/"/g, '""')}",${e.prob}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `cortex_simulation_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [simulatorReport, eventLog]);

  return (
    <div className="sim-root">
      {/* Header + Campaign Selector */}
      <div className="sim-header">
        <div className="sim-header-left">
          <Users size={20} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 className="text-tech">SYNTHETIC BUYER SANDBOX</h2>
            <p className="text-mono sim-subtitle">Deploy campaigns against 30 virtual buyer personas</p>
          </div>
        </div>
        <div className="sim-controls">
          <select
            className="sim-select text-mono"
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
          >
            <option value="">Select Campaign</option>
            {campaigns.map((c) => (
              <option key={c._id} value={c._id}>{c.campaignName}</option>
            ))}
          </select>
          <button
            className={`sim-deploy-btn text-mono ${simulatorRunning ? 'sim-running' : ''}`}
            onClick={deployCampaign}
            disabled={!selectedCampaign || simulatorRunning}
          >
            {simulatorRunning ? <><Zap size={14} /> SIMULATING...</> : <><Play size={14} /> DEPLOY TO SANDBOX</>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="sim-body">
        {/* Left: Buyer Grid */}
        <div className="sim-grid-wrap">
          <div className="sim-grid" ref={gridRef}>
            {buyers.map((buyer) => (
              <div key={buyer.id} className={`sim-buyer sim-${buyer.status}`}>
                <div className="sim-buyer-avatar" style={{ borderColor: statusColor(buyer.status) }}>
                  {buyer.num}
                </div>
                <div className="sim-buyer-role text-mono">{buyer.role}</div>
                <div className="sim-buyer-status text-mono" style={{ color: statusColor(buyer.status) }}>
                  {buyer.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          {/* Funnel Visualization */}
          <div className="sim-funnel">
            <div className="sim-funnel-title text-mono"><Target size={14} /> CONVERSION FUNNEL</div>
            <div className="sim-funnel-bars">
              <div className="sim-funnel-stage">
                <div className="sim-funnel-bar" style={{ width: '100%', background: 'var(--accent-primary)' }} />
                <span className="text-mono">IMPRESSIONS: {funnel.total}</span>
              </div>
              <div className="sim-funnel-stage">
                <div className="sim-funnel-bar" style={{ width: `${(funnel.converted / Math.max(funnel.total, 1)) * 100 + 10}%`, background: '#22c55e' }} />
                <span className="text-mono">CONVERTED: {funnel.converted}</span>
              </div>
              <div className="sim-funnel-stage">
                <div className="sim-funnel-bar" style={{ width: `${(funnel.ignored / Math.max(funnel.total, 1)) * 100 + 5}%`, background: '#ef4444' }} />
                <span className="text-mono">IGNORED: {funnel.ignored}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Event Log + Results */}
        <div className="sim-right">
          {/* Event Log */}
          <div className="sim-log-panel">
            <div className="sim-panel-title text-mono"><BarChart3 size={14} /> LIVE CONVERSION LOG</div>
            <div className="sim-log" ref={logRef}>
              {eventLog.length === 0 && (
                <div className="sim-log-empty text-mono">Deploy a campaign to see results...</div>
              )}
              {eventLog.map((e, i) => (
                <div key={i} className="sim-log-entry">
                  <span className="sim-log-buyer text-mono" style={{ color: e.converted ? '#22c55e' : '#ef4444' }}>
                    [{e.buyer} — {e.role}]
                  </span>
                  <span className="sim-log-reason">{e.reason}</span>
                  <span className="sim-log-prob text-mono" style={{ color: 'var(--text-muted)' }}>
                    P={e.prob}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          {simulatorReport && (
            <div className="sim-results">
              <div className="sim-panel-title text-mono">
                <TrendingUp size={14} /> SIMULATION RESULTS
                <button className="sim-export-btn text-mono" onClick={exportCSV} title="Export results to CSV">
                  <Download size={12} /> EXPORT CSV
                </button>
              </div>
              <div className="sim-results-grid">
                <div className="sim-result-card">
                  <span className="sim-result-num text-tech">{simulatorReport.totalImpressions}</span>
                  <span className="sim-result-label text-mono">IMPRESSIONS</span>
                </div>
                <div className="sim-result-card">
                  <span className="sim-result-num text-tech" style={{ color: '#22c55e' }}>{simulatorReport.conversions}</span>
                  <span className="sim-result-label text-mono">CONVERSIONS</span>
                </div>
                <div className="sim-result-card">
                  <span className="sim-result-num text-tech" style={{ color: 'var(--color-sim-blue)' }}>{(simulatorReport.conversionRate * 100).toFixed(1)}%</span>
                  <span className="sim-result-label text-mono">CONV. RATE</span>
                </div>
                <div className="sim-result-card">
                  <span className="sim-result-num text-tech" style={{ color: '#a855f7' }}>${simulatorReport.revenueGenerated?.toLocaleString()}</span>
                  <span className="sim-result-label text-mono">REVENUE</span>
                </div>
              </div>
              {/* Donut chart */}
              <div className="sim-donut-wrap">
                <svg viewBox="0 0 100 100" className="sim-donut">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--glass-border)" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="12"
                    strokeDasharray={`${simulatorReport.conversionRate * 251.2} ${251.2}`}
                    strokeLinecap="round" transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="48" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontFamily="Space Grotesk" fontWeight="700">
                    {(simulatorReport.conversionRate * 100).toFixed(0)}%
                  </text>
                  <text x="50" y="60" textAnchor="middle" fill="var(--text-muted)" fontSize="6" fontFamily="Share Tech Mono">
                    CONVERTED
                  </text>
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .sim-root {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          overflow-y: auto;
          height: 100%;
        }

        /* ── Header ────────────────────────────── */
        .sim-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }
        .sim-header-left { display: flex; align-items: center; gap: 14px; }
        .sim-header h2 { font-size: 18px; letter-spacing: 2px; color: var(--text-primary); margin: 0; }
        .sim-subtitle { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        .sim-controls { display: flex; gap: 10px; align-items: center; }
        .sim-select {
          padding: 10px 14px;
          background: var(--neumorphic-press);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 11px;
          outline: none;
          cursor: pointer;
          min-width: 180px;
        }
        .sim-select:focus { border-color: var(--glass-border-focus); }
        .sim-deploy-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: 1px solid var(--accent-primary);
          border-radius: 8px;
          background: rgba(0,242,254,0.08);
          color: var(--accent-primary);
          cursor: pointer;
          font-size: 11px;
          letter-spacing: 1px;
          transition: all 0.3s;
          white-space: nowrap;
        }
        .sim-deploy-btn:hover:not(:disabled) {
          background: rgba(0,242,254,0.18);
          box-shadow: 0 0 20px var(--accent-glow);
        }
        .sim-deploy-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sim-running { animation: simPulse 1.5s ease-in-out infinite; }
        @keyframes simPulse {
          0%,100% { box-shadow: 0 0 8px var(--accent-glow); }
          50%     { box-shadow: 0 0 25px var(--accent-glow); }
        }

        /* ── Body ──────────────────────────────── */
        .sim-body {
          display: flex;
          gap: 20px;
          flex: 1;
          min-height: 0;
        }
        @media (max-width: 900px) { .sim-body { flex-direction: column; } }

        /* ── Buyer Grid ────────────────────────── */
        .sim-grid-wrap { flex: 1; display: flex; flex-direction: column; gap: 16px; }
        .sim-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }
        @media (max-width: 1100px) { .sim-grid { grid-template-columns: repeat(5, 1fr); } }
        @media (max-width: 700px) { .sim-grid { grid-template-columns: repeat(3, 1fr); } }

        .sim-buyer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 6px;
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          transition: all 0.4s ease;
        }
        .sim-converted {
          border-color: rgba(34,197,94,0.3);
          box-shadow: 0 0 12px rgba(34,197,94,0.15);
          background: rgba(34,197,94,0.04);
        }
        .sim-ignored {
          border-color: rgba(239,68,68,0.2);
          opacity: 0.6;
        }
        .sim-buyer-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700;
          border: 2px solid var(--text-muted);
          color: var(--text-secondary);
          transition: all 0.4s;
        }
        .sim-buyer-role { font-size: 7px; letter-spacing: 0.5px; color: var(--text-muted); text-align: center; line-height: 1.2; }
        .sim-buyer-status { font-size: 7px; letter-spacing: 1px; font-weight: 600; }

        /* ── Funnel ────────────────────────────── */
        .sim-funnel {
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 16px;
        }
        .sim-funnel-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 10px; letter-spacing: 1.5px; color: var(--text-secondary); margin-bottom: 12px;
        }
        .sim-funnel-bars { display: flex; flex-direction: column; gap: 8px; }
        .sim-funnel-stage {
          display: flex; align-items: center; gap: 10px;
        }
        .sim-funnel-bar {
          height: 8px; border-radius: 4px; transition: width 0.5s ease; min-width: 8px;
        }
        .sim-funnel-stage span { font-size: 9px; letter-spacing: 1px; color: var(--text-muted); white-space: nowrap; }

        /* ── Right Column ──────────────────────── */
        .sim-right {
          width: 320px; min-width: 260px;
          display: flex; flex-direction: column; gap: 16px;
        }
        @media (max-width: 900px) { .sim-right { width: 100%; } }

        .sim-panel-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 10px; letter-spacing: 1.5px; color: var(--text-secondary);
          padding-bottom: 10px; border-bottom: 1px solid var(--glass-border); margin-bottom: 10px;
        }
        .sim-export-btn {
          margin-left: auto; display: flex; align-items: center; gap: 5px;
          padding: 4px 10px; border: 1px solid var(--accent-primary); border-radius: 6px;
          background: rgba(0,242,254,0.06); color: var(--accent-primary);
          cursor: pointer; font-size: 9px; letter-spacing: 1px; transition: all 0.3s;
        }
        .sim-export-btn:hover { background: rgba(0,242,254,0.15); box-shadow: 0 0 10px var(--accent-glow); }

        /* ── Event Log ─────────────────────────── */
        .sim-log-panel {
          flex: 1;
          background: var(--glass-bg); backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border); border-radius: 14px;
          padding: 16px; display: flex; flex-direction: column;
          min-height: 200px; box-shadow: var(--glass-shadow);
        }
        .sim-log {
          flex: 1; overflow-y: auto; display: flex;
          flex-direction: column; gap: 6px; max-height: 300px;
        }
        .sim-log-empty { font-size: 11px; color: var(--text-muted); }
        .sim-log-entry { font-size: 11px; line-height: 1.5; display: flex; gap: 6px; flex-wrap: wrap; }
        .sim-log-buyer { font-size: 10px; font-weight: 600; white-space: nowrap; }
        .sim-log-reason { color: var(--text-secondary); }
        .sim-log-prob { font-size: 9px; }

        /* ── Results ───────────────────────────── */
        .sim-results {
          background: var(--glass-bg); backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border); border-radius: 14px;
          padding: 16px; box-shadow: var(--glass-shadow);
        }
        .sim-results-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px;
        }
        .sim-result-card {
          display: flex; flex-direction: column; align-items: center;
          padding: 12px; background: var(--neumorphic-press);
          border: 1px solid var(--glass-border); border-radius: 10px;
        }
        .sim-result-num { font-size: 22px; font-weight: 700; }
        .sim-result-label { font-size: 8px; letter-spacing: 1.5px; color: var(--text-muted); margin-top: 2px; }
        .sim-donut-wrap { display: flex; justify-content: center; }
        .sim-donut { width: 100px; height: 100px; }
      `}</style>
    </div>
  );
}
