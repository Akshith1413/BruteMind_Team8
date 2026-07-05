/**
 * Analytics.jsx — Cortex OS Business Intelligence Dashboard
 * Real-time charts, KPI cards, and trend analysis for campaign performance.
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { AudioSynth } from '../../utils/AudioSynth';
import gsap from 'gsap';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Eye,
  ArrowUpRight, ArrowDownRight, Activity, PieChart, Layers
} from 'lucide-react';
import { api } from '../../utils/api';

/* ── Mock KPI Data ──────────────────────────────────── */
const KPI_DATA = [
  { label: 'TOTAL REVENUE', value: '$284,500', change: '+12.4%', up: true, icon: DollarSign, color: '#22c55e' },
  { label: 'ACTIVE CAMPAIGNS', value: '14', change: '+3', up: true, icon: Layers, color: 'var(--accent-primary)' },
  { label: 'CONVERSION RATE', value: '18.7%', change: '+2.1%', up: true, icon: TrendingUp, color: '#a855f7' },
  { label: 'TOTAL LEADS', value: '3,842', change: '-4.2%', up: false, icon: Users, color: '#f59e0b' },
];

/* ── Mock chart data (7-day trend) ──────────────────── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const REVENUE_DATA = [32000, 41000, 28000, 51000, 47000, 38000, 55000];
const LEADS_DATA = [120, 185, 142, 210, 195, 160, 230];
const CHANNEL_DATA = [
  { name: 'LinkedIn', value: 35, color: '#0a66c2' },
  { name: 'Email', value: 28, color: '#ea4335' },
  { name: 'SEO', value: 20, color: '#34a853' },
  { name: 'Seminars', value: 12, color: '#f59e0b' },
  { name: 'Paid Ads', value: 5, color: '#ec4899' },
];

const RECENT_CAMPAIGNS_MOCK = [
  { name: 'LinkedIn Growth Blitz', status: 'active', conv: '22%', revenue: '$48,200' },
  { name: 'Email Nurture Q3', status: 'active', conv: '15%', revenue: '$31,400' },
];

export default function Analytics() {
  const { dashboardStats, campaigns } = useDashboardStore();
  const rootRef = useRef(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    if (rootRef.current) {
      gsap.fromTo(
        rootRef.current.querySelectorAll('.an-section'),
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' }
      );
    }
  }, []);

  /* ── Fetch dashboard stats & campaigns periodically ────────────────────── */
  useEffect(() => {
    const fetchData = () => {
      api.get('/business/dashboard-stats')
        .then(useDashboardStore.getState().setDashboardStats)
        .catch(console.error);
      api.get('/business/campaigns')
        .then((res) => {
          if (res?.campaigns) useDashboardStore.getState().setCampaigns(res.campaigns);
        })
        .catch(console.error);
    };
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  /* ── Dynamic Data Wiring ──────────────────────────── */
  const stats = dashboardStats || {};
  const totalRev = stats.revenue || 284500;
  const activeCampCount = campaigns?.length || stats.marketingCampaigns || 14;
  const convRate = stats.avgConversionRate ? (stats.avgConversionRate * 100).toFixed(1) : '18.7';
  const totalLeads = stats.pipelineValue || 3842;

  const KPI_DATA_DYNAMIC = [
    { label: 'TOTAL REVENUE', value: `$${totalRev.toLocaleString()}`, change: '+12.4%', up: true, icon: DollarSign, color: '#22c55e' },
    { label: 'ACTIVE CAMPAIGNS', value: activeCampCount.toString(), change: '+3', up: true, icon: Layers, color: 'var(--accent-primary)' },
    { label: 'CONVERSION RATE', value: `${convRate}%`, change: '+2.1%', up: true, icon: TrendingUp, color: '#a855f7' },
    { label: 'TOTAL LEADS', value: totalLeads.toLocaleString(), change: '-4.2%', up: false, icon: Users, color: '#f59e0b' },
  ];

  /* ── SVG Bar chart ────────────────────────────────── */
  const maxRevenue = Math.max(...REVENUE_DATA, 10000);
  const barWidth = 30;
  const chartH = 160;
  const chartW = DAYS.length * (barWidth + 18) + 20;

  /* ── SVG Line chart ───────────────────────────────── */
  const maxLeads = Math.max(...LEADS_DATA);
  const linePoints = LEADS_DATA.map((v, i) => {
    const x = 30 + i * ((chartW - 40) / (LEADS_DATA.length - 1));
    const y = chartH - 20 - (v / maxLeads) * (chartH - 40);
    return `${x},${y}`;
  }).join(' ');

  /* ── Donut for channels ───────────────────────────── */
  const totalChannel = CHANNEL_DATA.reduce((a, b) => a + b.value, 0);
  let cumulativeAngle = 0;

  const statusColor = (s) => {
    if (s === 'active') return '#22c55e';
    if (s === 'completed') return 'var(--accent-primary)';
    return '#f59e0b';
  };

  return (
    <div className="an-root" ref={rootRef}>
      {/* Header */}
      <div className="an-header an-section">
        <div className="an-header-left">
          <BarChart3 size={22} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 className="text-tech">ANALYTICS</h2>
            <p className="text-mono an-subtitle">Business intelligence & performance metrics</p>
          </div>
        </div>
        <div className="an-period-group">
          {['24h', '7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              className={`an-period-btn text-mono ${selectedPeriod === p ? 'an-period-active' : ''}`}
              onClick={() => { setSelectedPeriod(p); AudioSynth.playClick(); }}
            >{p.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="an-kpi-row">
        {KPI_DATA_DYNAMIC.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="an-section an-kpi-card">
              <div className="an-kpi-top">
                <div className="an-kpi-icon" style={{ color: kpi.color }}>
                  <Icon size={18} />
                </div>
                <span className={`an-kpi-change text-mono ${kpi.up ? 'an-up' : 'an-down'}`}>
                  {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {kpi.change}
                </span>
              </div>
              <div className="an-kpi-value text-tech">{kpi.value}</div>
              <div className="an-kpi-label text-mono">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="an-charts-row">
        {/* Revenue Bar Chart */}
        <div className="an-section an-chart-card">
          <div className="an-chart-title text-mono"><DollarSign size={13} /> REVENUE TREND</div>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="an-bar-svg">
            {REVENUE_DATA.map((v, i) => {
              const h = (v / maxRevenue) * (chartH - 40);
              const x = 20 + i * (barWidth + 18);
              const y = chartH - 20 - h;
              return (
                <g key={i}>
                  <defs>
                    <linearGradient id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>
                  <rect x={x} y={y} width={barWidth} height={h} rx="4" fill={`url(#barGrad${i})`} opacity="0.85" />
                  <text x={x + barWidth / 2} y={chartH - 5} textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="Share Tech Mono">
                    {DAYS[i]}
                  </text>
                  <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fill="var(--text-secondary)" fontSize="7" fontFamily="Share Tech Mono">
                    ${(v / 1000).toFixed(0)}k
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Leads Line Chart */}
        <div className="an-section an-chart-card">
          <div className="an-chart-title text-mono"><Activity size={13} /> LEADS TREND</div>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="an-line-svg">
            <defs>
              <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-secondary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area fill */}
            <polygon
              points={`30,${chartH - 20} ${linePoints} ${30 + (LEADS_DATA.length - 1) * ((chartW - 40) / (LEADS_DATA.length - 1))},${chartH - 20}`}
              fill="url(#lineAreaGrad)"
            />
            {/* Line */}
            <polyline points={linePoints} fill="none" stroke="var(--accent-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Dots + Labels */}
            {LEADS_DATA.map((v, i) => {
              const x = 30 + i * ((chartW - 40) / (LEADS_DATA.length - 1));
              const y = chartH - 20 - (v / maxLeads) * (chartH - 40);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="var(--accent-secondary)" stroke="var(--bg-color)" strokeWidth="2" />
                  <text x={x} y={chartH - 5} textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily="Share Tech Mono">{DAYS[i]}</text>
                  <text x={x} y={y - 10} textAnchor="middle" fill="var(--text-secondary)" fontSize="7" fontFamily="Share Tech Mono">{v}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="an-bottom-row">
        {/* Channel Breakdown */}
        <div className="an-section an-chart-card an-channel-card">
          <div className="an-chart-title text-mono"><PieChart size={13} /> CHANNEL BREAKDOWN</div>
          <div className="an-channel-body">
            <svg viewBox="0 0 120 120" className="an-donut-svg">
              {CHANNEL_DATA.map((ch, i) => {
                const pct = ch.value / totalChannel;
                const dashLen = pct * 251.2;
                const offset = cumulativeAngle * 251.2;
                cumulativeAngle += pct;
                return (
                  <circle
                    key={i} cx="60" cy="60" r="40" fill="none"
                    stroke={ch.color} strokeWidth="16"
                    strokeDasharray={`${dashLen} ${251.2 - dashLen}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 60 60)"
                  />
                );
              })}
              <text x="60" y="58" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontFamily="Space Grotesk" fontWeight="700">100%</text>
              <text x="60" y="70" textAnchor="middle" fill="var(--text-muted)" fontSize="6" fontFamily="Share Tech Mono">TOTAL</text>
            </svg>
            <div className="an-channel-legend">
              {CHANNEL_DATA.map((ch) => (
                <div key={ch.name} className="an-legend-item">
                  <div className="an-legend-dot" style={{ background: ch.color }} />
                  <span className="text-mono an-legend-name">{ch.name}</span>
                  <span className="text-tech an-legend-val">{ch.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Campaigns Table */}
        <div className="an-section an-chart-card an-table-card">
          <div className="an-chart-title text-mono"><Layers size={13} /> RECENT CAMPAIGNS</div>
          <div className="an-table-wrap">
            <table className="an-table">
              <thead>
                <tr>
                  <th className="text-mono">CAMPAIGN</th>
                  <th className="text-mono">STATUS</th>
                  <th className="text-mono">CONV.</th>
                  <th className="text-mono">REVENUE</th>
                </tr>
              </thead>
              <tbody>
                {(campaigns && campaigns.length > 0 ? campaigns.slice(0, 5) : RECENT_CAMPAIGNS_MOCK).map((c, i) => (
                  <tr key={i}>
                    <td>{c.campaignName || c.name}</td>
                    <td><span className="an-status-badge" style={{ color: statusColor(c.status || 'active'), borderColor: statusColor(c.status || 'active') }}>{(c.status || 'active').toUpperCase()}</span></td>
                    <td className="text-tech">{c.cacScore ? `${c.cacScore}%` : c.conv}</td>
                    <td className="text-tech" style={{ color: '#22c55e' }}>{c.budget ? `$${c.budget * 10}` : c.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .an-root { display: flex; flex-direction: column; gap: 18px; padding: 24px; overflow-y: auto; height: 100%; }
        .an-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .an-header-left { display: flex; align-items: center; gap: 14px; }
        .an-header h2 { font-size: 18px; letter-spacing: 2px; color: var(--text-primary); margin: 0; }
        .an-subtitle { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        .an-period-group { display: flex; border: 1px solid var(--glass-border); border-radius: 8px; overflow: hidden; }
        .an-period-btn {
          padding: 8px 14px; font-size: 9px; letter-spacing: 1px;
          background: var(--glass-bg); color: var(--text-muted);
          border: none; cursor: pointer; transition: all 0.3s;
        }
        .an-period-active {
          background: linear-gradient(135deg, rgba(0,242,254,0.12), rgba(127,0,255,0.08));
          color: var(--accent-primary);
        }

        /* KPI */
        .an-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        @media (max-width: 900px) { .an-kpi-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .an-kpi-row { grid-template-columns: 1fr; } }
        .an-kpi-card {
          background: var(--glass-bg); backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border); border-radius: 14px;
          padding: 18px; box-shadow: var(--glass-shadow);
        }
        .an-kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .an-kpi-icon {
          width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
          background: rgba(0,242,254,0.06); border: 1px solid var(--glass-border);
        }
        .an-kpi-change { display: flex; align-items: center; gap: 2px; font-size: 10px; letter-spacing: 0.5px; }
        .an-up { color: #22c55e; }
        .an-down { color: #ef4444; }
        .an-kpi-value { font-size: 26px; font-weight: 700; color: var(--text-primary); letter-spacing: 1px; }
        .an-kpi-label { font-size: 9px; letter-spacing: 1.5px; color: var(--text-muted); margin-top: 4px; }

        /* Charts */
        .an-charts-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        @media (max-width: 800px) { .an-charts-row { grid-template-columns: 1fr; } }
        .an-chart-card {
          background: var(--glass-bg); backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border); border-radius: 14px;
          padding: 18px; box-shadow: var(--glass-shadow);
        }
        .an-chart-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 10px; letter-spacing: 1.5px; color: var(--text-secondary);
          margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--glass-border);
        }
        .an-bar-svg, .an-line-svg { width: 100%; height: auto; }

        /* Bottom Row */
        .an-bottom-row { display: grid; grid-template-columns: 1fr 2fr; gap: 14px; }
        @media (max-width: 800px) { .an-bottom-row { grid-template-columns: 1fr; } }

        /* Channel Donut */
        .an-channel-body { display: flex; align-items: center; gap: 20px; }
        @media (max-width: 600px) { .an-channel-body { flex-direction: column; } }
        .an-donut-svg { width: 120px; height: 120px; flex-shrink: 0; }
        .an-channel-legend { display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .an-legend-item { display: flex; align-items: center; gap: 8px; }
        .an-legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
        .an-legend-name { font-size: 10px; letter-spacing: 0.5px; color: var(--text-secondary); flex: 1; }
        .an-legend-val { font-size: 13px; font-weight: 600; color: var(--text-primary); }

        /* Table */
        .an-table-wrap { overflow-x: auto; }
        .an-table { width: 100%; border-collapse: collapse; }
        .an-table th {
          text-align: left; font-size: 9px; letter-spacing: 1.5px; color: var(--text-muted);
          padding: 8px 12px; border-bottom: 1px solid var(--glass-border);
        }
        .an-table td {
          padding: 10px 12px; font-size: 12px; color: var(--text-secondary);
          border-bottom: 1px solid var(--glass-border);
        }
        .an-table tr:hover td { background: rgba(0,242,254,0.02); }
        .an-status-badge {
          font-size: 9px; letter-spacing: 1px; padding: 3px 8px;
          border: 1px solid; border-radius: 4px; font-family: var(--font-mono);
        }
      `}</style>
    </div>
  );
}
