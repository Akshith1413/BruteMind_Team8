/**
 * Boardroom.jsx — Cortex OS Multi-Agent Debate Arena
 * SVG node ring of 10 AI agents, voting matrix, live debate transcript, and trigger controls.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { getSocket } from '../../utils/socketClient';
import { AudioSynth } from '../../utils/AudioSynth';
import gsap from 'gsap';
import { Brain, Vote, MessageSquare, Zap, Send, Download } from 'lucide-react';

const AGENTS = [
  { id: 'ceo', name: 'CEO', color: 'var(--color-ceo)' },
  { id: 'cfo', name: 'CFO', color: 'var(--color-cfo)' },
  { id: 'cmo', name: 'CMO', color: 'var(--color-cmo)' },
  { id: 'cso', name: 'CSO', color: 'var(--color-cso)' },
  { id: 'coo', name: 'COO', color: 'var(--color-coo)' },
  { id: 'rnd', name: 'R&D', color: 'var(--color-rnd)' },
  { id: 'cs',  name: 'CS',  color: 'var(--color-cs)' },
  { id: 'legal', name: 'LEGAL', color: 'var(--color-legal)' },
  { id: 'hr',  name: 'HR',  color: 'var(--color-hr)' },
  { id: 'data', name: 'DATA', color: 'var(--color-data)' },
];

const RING_RADIUS = 140;
const CENTER = 180;

export default function Boardroom() {
  const {
    boardroomActive, boardroomLogs, agentVotes, boardroomTopic,
    boardroomFinalVerdict, startBoardroom, addBoardroomPacket, endBoardroom,
  } = useDashboardStore();

  const [topic, setTopic] = useState('');
  const [speakingAgent, setSpeakingAgent] = useState(null);
  const transcriptRef = useRef(null);
  const ringRef = useRef(null);

  /* ── Socket listeners ──────────────────────────────────── */
  useEffect(() => {
    const socket = getSocket();
    const onPacket = (packet) => {
      addBoardroomPacket(packet);
      if (packet.agentName) setSpeakingAgent(packet.agentName);
      AudioSynth.playClick();
      // Clear speaking highlight after delay
      setTimeout(() => setSpeakingAgent(null), 1500);
    };
    const onError = (err) => {
      addBoardroomPacket({ agentName: 'SYSTEM', text: `Error: ${err.error}`, type: 'error' });
      endBoardroom();
    };

    socket.on('boardroom_debate_packet', onPacket);
    socket.on('boardroom_error', onError);
    return () => {
      socket.off('boardroom_debate_packet', onPacket);
      socket.off('boardroom_error', onError);
    };
  }, []);

  /* ── Auto-scroll transcript ────────────────────────────── */
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [boardroomLogs]);

  /* ── Trigger debate ────────────────────────────────────── */
  const triggerDebate = useCallback(() => {
    if (!topic.trim()) return;
    startBoardroom(topic);
    const socket = getSocket();
    socket.emit('boardroom_debate_trigger', { topic, businessContext: 'general' });
    AudioSynth.playTransition();
  }, [topic, startBoardroom]);

  /* ── GSAP ring entrance ────────────────────────────────── */
  useEffect(() => {
    if (ringRef.current) {
      gsap.fromTo(ringRef.current, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.3)' });
    }
  }, []);

  /* ── Get agent color by name ───────────────────────────── */
  const agentColor = (name) => AGENTS.find((a) => a.name === name?.toUpperCase())?.color || 'var(--text-secondary)';

  /* ── Vote status badge ─────────────────────────────────── */
  const voteBadge = (agentName) => {
    const v = agentVotes[agentName];
    if (!v) return { text: 'PENDING', cls: 'br-vote-pending' };
    if (v === 'APPROVE' || v === 'approve') return { text: 'APPROVE', cls: 'br-vote-approve' };
    if (v === 'REJECT' || v === 'reject') return { text: 'REJECT', cls: 'br-vote-reject' };
    return { text: v.toUpperCase(), cls: 'br-vote-pending' };
  };

  /* ── Export to CSV ──────────────────────────────────── */
  const exportCSV = useCallback(() => {
    if (boardroomLogs.length === 0) return;
    AudioSynth.playSuccess();
    const header = 'Agent,Message,Vote\n';
    const rows = boardroomLogs.map((log) => {
      const agent = log.agentName || 'SYSTEM';
      let rawText = log.text || log.message || '';
      if (typeof rawText !== 'string') rawText = JSON.stringify(rawText);
      const text = rawText.replace(/"/g, '""');
      const vote = agentVotes[agent] || 'PENDING';
      return `"${agent}","${text}","${vote}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `cortex_boardroom_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [boardroomLogs, agentVotes]);

  return (
    <div className="br-root">
      {/* Left Column: SVG Ring + Trigger */}
      <div className="br-left">
        <div className="br-ring-wrap" ref={ringRef}>
          <svg viewBox="0 0 360 360" className="br-ring-svg">
            <defs>
              <filter id="brGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <radialGradient id="hubGrad">
                <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            {/* Connection lines */}
            {AGENTS.map((agent, i) => {
              const angle = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
              const x = CENTER + RING_RADIUS * Math.cos(angle);
              const y = CENTER + RING_RADIUS * Math.sin(angle);
              const isSpeaking = speakingAgent?.toUpperCase() === agent.name;
              return (
                <line
                  key={`line-${agent.id}`}
                  x1={CENTER} y1={CENTER} x2={x} y2={y}
                  stroke={agent.color}
                  strokeWidth={isSpeaking ? 2 : 0.5}
                  opacity={isSpeaking ? 0.8 : 0.15}
                  strokeDasharray={isSpeaking ? 'none' : '4 6'}
                />
              );
            })}

            {/* Center hub */}
            <circle cx={CENTER} cy={CENTER} r="35" fill="url(#hubGrad)" stroke="var(--accent-primary)" strokeWidth="1" opacity="0.6" />
            <circle cx={CENTER} cy={CENTER} r="20" fill="var(--glass-bg)" stroke="var(--accent-primary)" strokeWidth="1.5" filter="url(#brGlow)">
              <animate attributeName="r" values="18;22;18" dur="3s" repeatCount="indefinite" />
            </circle>
            <text x={CENTER} y={CENTER - 4} textAnchor="middle" fill="var(--accent-primary)" fontSize="6" fontFamily="Share Tech Mono" letterSpacing="1">CONSENSUS</text>
            <text x={CENTER} y={CENTER + 5} textAnchor="middle" fill="var(--accent-primary)" fontSize="5" fontFamily="Share Tech Mono" opacity="0.7">ENGINE</text>

            {/* Agent nodes */}
            {AGENTS.map((agent, i) => {
              const angle = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
              const x = CENTER + RING_RADIUS * Math.cos(angle);
              const y = CENTER + RING_RADIUS * Math.sin(angle);
              const isSpeaking = speakingAgent?.toUpperCase() === agent.name;
              const vote = agentVotes[agent.name];
              const nodeStroke = vote === 'REJECT' || vote === 'reject' ? '#ef4444' : vote === 'APPROVE' || vote === 'approve' ? '#22c55e' : agent.color;

              return (
                <g key={agent.id}>
                  {isSpeaking && (
                    <circle cx={x} cy={y} r="28" fill="none" stroke={agent.color} strokeWidth="1" opacity="0.4">
                      <animate attributeName="r" values="24;32;24" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={x} cy={y} r="22" fill="var(--glass-bg)" stroke={nodeStroke} strokeWidth={isSpeaking ? 2.5 : 1.5} filter={isSpeaking ? 'url(#brGlow)' : 'none'} />
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fill={agent.color} fontSize="8" fontFamily="Space Grotesk" fontWeight="700" letterSpacing="0.5">
                    {agent.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Trigger Controls */}
        <div className="br-trigger">
          <input
            className="br-input text-mono"
            type="text"
            placeholder="Enter boardroom topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && triggerDebate()}
          />
          <button
            className={`br-fire-btn text-mono ${boardroomActive ? 'br-active' : ''}`}
            onClick={triggerDebate}
            disabled={boardroomActive}
          >
            {boardroomActive ? (
              <><Zap size={14} /> DEBATING...</>
            ) : (
              <><Send size={14} /> INITIATE SWARM DEBATE</>
            )}
          </button>
        </div>
      </div>

      {/* Right Column: Voting Matrix + Transcript */}
      <div className="br-right">
        {/* Voting Matrix */}
        <div className="br-votes-panel">
          <div className="br-panel-title text-mono">
            <Vote size={14} /> AGENT VOTES
            <button className="br-export-btn text-mono" onClick={exportCSV} title="Export debate to CSV">
              <Download size={12} /> EXPORT
            </button>
          </div>
          <div className="br-votes-list">
            {AGENTS.map((agent) => {
              const badge = voteBadge(agent.name);
              return (
                <div key={agent.id} className="br-vote-row">
                  <span className="br-vote-name" style={{ color: agent.color }}>{agent.name}</span>
                  <span className={`br-vote-badge text-mono ${badge.cls}`}>{badge.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transcript Feed */}
        <div className="br-transcript-panel">
          <div className="br-panel-title text-mono"><MessageSquare size={14} /> DEBATE TRANSCRIPT</div>
          <div className="br-transcript" ref={transcriptRef}>
            {boardroomLogs.length === 0 && (
              <div className="br-empty text-mono">No debate in progress. Enter a topic and initiate.</div>
            )}
            {boardroomLogs.map((log, i) => (
              <div key={i} className="br-log-line">
                <span className="br-log-agent text-mono" style={{ color: agentColor(log.agentName) }}>
                  [{log.agentName || 'SYSTEM'}]
                </span>
                <span className="br-log-text">{log.text || log.message || JSON.stringify(log)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Final Verdict */}
        {boardroomFinalVerdict && (
          <div className="br-verdict">
            <Brain size={16} style={{ color: 'var(--accent-primary)' }} />
            <div className="br-verdict-text text-mono">
              <strong>FINAL VERDICT</strong>
              <p>{boardroomFinalVerdict.text || boardroomFinalVerdict.message}</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .br-root {
          display: flex;
          gap: 20px;
          height: 100%;
          padding: 24px;
          overflow-y: auto;
        }
        @media (max-width: 900px) { .br-root { flex-direction: column; } }

        /* ── Left Column ───────────────────────── */
        .br-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 320px;
        }
        .br-ring-wrap {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 16px;
          box-shadow: var(--glass-shadow);
          display: flex;
          justify-content: center;
        }
        .br-ring-svg { width: 100%; max-width: 360px; height: auto; }

        /* ── Trigger ───────────────────────────── */
        .br-trigger {
          display: flex;
          gap: 10px;
        }
        .br-input {
          flex: 1;
          padding: 12px 16px;
          background: var(--neumorphic-press);
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 12px;
          letter-spacing: 0.5px;
          outline: none;
          transition: all 0.3s;
        }
        .br-input:focus {
          border-color: var(--glass-border-focus);
          box-shadow: 0 0 12px var(--accent-glow);
        }
        .br-fire-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: 1px solid var(--accent-primary);
          border-radius: 10px;
          background: rgba(0,242,254,0.08);
          color: var(--accent-primary);
          cursor: pointer;
          font-size: 11px;
          letter-spacing: 1px;
          transition: all 0.3s;
          white-space: nowrap;
        }
        .br-fire-btn:hover:not(:disabled) {
          background: rgba(0,242,254,0.18);
          box-shadow: 0 0 20px var(--accent-glow);
        }
        .br-fire-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .br-fire-btn.br-active {
          animation: brGlowPulse 1.5s ease-in-out infinite;
        }
        @keyframes brGlowPulse {
          0%,100% { box-shadow: 0 0 8px var(--accent-glow); }
          50%     { box-shadow: 0 0 25px var(--accent-glow); }
        }

        /* ── Right Column ──────────────────────── */
        .br-right {
          width: 340px;
          min-width: 280px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (max-width: 900px) { .br-right { width: 100%; } }

        .br-panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          letter-spacing: 1.5px;
          color: var(--text-secondary);
          padding-bottom: 10px;
          border-bottom: 1px solid var(--glass-border);
          margin-bottom: 10px;
        }
        .br-export-btn {
          margin-left: auto; display: flex; align-items: center; gap: 5px;
          padding: 4px 10px; border: 1px solid var(--accent-primary); border-radius: 6px;
          background: rgba(0,242,254,0.06); color: var(--accent-primary);
          cursor: pointer; font-size: 9px; letter-spacing: 1px; transition: all 0.3s;
        }
        .br-export-btn:hover { background: rgba(0,242,254,0.15); box-shadow: 0 0 10px var(--accent-glow); }

        /* ── Votes Panel ───────────────────────── */
        .br-votes-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          padding: 16px;
          box-shadow: var(--glass-shadow);
        }
        .br-votes-list { display: flex; flex-direction: column; gap: 6px; }
        .br-vote-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          border-radius: 6px;
          background: var(--neumorphic-press);
        }
        .br-vote-name { font-size: 11px; font-weight: 600; letter-spacing: 1px; }
        .br-vote-badge {
          font-size: 9px;
          letter-spacing: 1px;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .br-vote-pending { color: var(--text-muted); background: rgba(255,255,255,0.03); }
        .br-vote-approve {
          color: #22c55e;
          background: rgba(34,197,94,0.1);
          box-shadow: 0 0 6px rgba(34,197,94,0.2);
        }
        .br-vote-reject {
          color: #ef4444;
          background: rgba(239,68,68,0.1);
          box-shadow: 0 0 6px rgba(239,68,68,0.2);
        }

        /* ── Transcript Panel ──────────────────── */
        .br-transcript-panel {
          flex: 1;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 14px;
          padding: 16px;
          box-shadow: var(--glass-shadow);
          display: flex;
          flex-direction: column;
          min-height: 200px;
        }
        .br-transcript {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 320px;
        }
        .br-empty { font-size: 11px; color: var(--text-muted); padding: 10px 0; }
        .br-log-line { font-size: 12px; line-height: 1.5; }
        .br-log-agent { font-size: 10px; letter-spacing: 0.5px; margin-right: 6px; font-weight: 600; }
        .br-log-text { color: var(--text-secondary); }

        /* ── Verdict ───────────────────────────── */
        .br-verdict {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(0,242,254,0.06);
          border: 1px solid rgba(0,242,254,0.2);
          border-radius: 12px;
          animation: brGlowPulse 2s ease-in-out infinite;
        }
        .br-verdict-text strong {
          display: block;
          font-size: 10px;
          letter-spacing: 1.5px;
          color: var(--accent-primary);
          margin-bottom: 4px;
        }
        .br-verdict-text p {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* ── Mobile Responsive ────────────────── */
        @media (max-width: 768px) {
          .br-root { padding: 16px; gap: 14px; }
          .br-left { min-width: unset; }
          .br-ring-svg { max-width: 260px; }
          .br-trigger { flex-direction: column; }
          .br-fire-btn { justify-content: center; }
          .br-right { width: 100%; }
          .br-transcript { max-height: 200px; }
          .br-vote-row { padding: 8px 10px; }
        }
      `}</style>
    </div>
  );
}
