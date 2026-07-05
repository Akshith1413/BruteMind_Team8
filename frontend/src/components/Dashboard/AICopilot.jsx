/**
 * AICopilot.jsx — Cortex OS Intelligence Terminal
 * Premium chat interface with engine selector, typewriter effect, quick action chips.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { api } from '../../utils/api';
import { AudioSynth } from '../../utils/AudioSynth';
import gsap from 'gsap';
import { Send, Bot, User, Sparkles, Brain, TrendingUp, Target, DollarSign, Users, BarChart3 } from 'lucide-react';

const ENGINES = [
  { id: 'strategy',         label: 'STRATEGY',         icon: Brain,       color: 'var(--color-ceo)' },
  { id: 'marketing',        label: 'MARKETING',        icon: TrendingUp,  color: 'var(--color-cmo)' },
  { id: 'lead-gen',         label: 'LEAD GEN',         icon: Target,      color: 'var(--color-cso)' },
  { id: 'sales',            label: 'SALES',            icon: DollarSign,  color: 'var(--color-cfo)' },
  { id: 'analytics',        label: 'ANALYTICS',        icon: BarChart3,   color: 'var(--color-rnd)' },
  { id: 'customer-success', label: 'CUSTOMER SUCCESS', icon: Users,       color: 'var(--color-cs)' },
];

const QUICK_PROMPTS = [
  'Analyze my growth trajectory',
  'Generate a marketing campaign',
  'Identify pipeline bottlenecks',
  'Assess financial risk exposure',
];

const WELCOME_MSG = {
  role: 'ai',
  text: 'Welcome to the Cortex Intelligence Terminal. I am your multi-agent AI copilot. Select an engine above and ask anything about your business strategy, marketing, sales, or operations.',
  timestamp: Date.now(),
  engine: 'strategy',
};

export default function AICopilot() {
  const {
    copilotMessages, addCopilotMessage, copilotLoading, setCopilotLoading,
  } = useDashboardStore();

  const [input, setInput] = useState('');
  const [activeEngine, setActiveEngine] = useState('strategy');
  const [displayedMessages, setDisplayedMessages] = useState([WELCOME_MSG]);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  /* ── Send message ──────────────────────────────────────── */
  const sendMessage = useCallback(async (text, engine = activeEngine) => {
    if (!text.trim() || copilotLoading) return;
    const userMsg = { role: 'user', text: text.trim(), timestamp: Date.now() };
    addCopilotMessage(userMsg);
    setDisplayedMessages((prev) => [...prev, userMsg]);
    setInput('');
    setCopilotLoading(true);
    AudioSynth.playClick();

    try {
      const payload = {
        prompt: text.trim(),
        productName: 'Cortex Copilot Target',
        industry: 'General Enterprise',
        targetAudience: 'Executives',
        budget: 5000,
        competitors: ['Incumbents']
      };
      
      const res = await api.post(`/engines/${engine}`, payload);
      
      let aiText = res.result || res.response || res;
      if (typeof aiText === 'object') {
        // Format the JSON keys nicely for the chat
        aiText = Object.entries(aiText)
          .map(([k, v]) => `**${k.toUpperCase()}**\n${Array.isArray(v) ? v.map(i => '• ' + i).join('\n') : (typeof v === 'object' ? JSON.stringify(v, null, 2) : v)}`)
          .join('\n\n');
      }

      const aiMsg = { role: 'ai', text: aiText, timestamp: Date.now(), engine };
      addCopilotMessage(aiMsg);
      // Typewriter effect
      typewriterAppend(aiMsg);
    } catch (err) {
      const errMsg = { role: 'ai', text: `⚠ Error: ${err.message}`, timestamp: Date.now(), engine };
      addCopilotMessage(errMsg);
      setDisplayedMessages((prev) => [...prev, errMsg]);
    }
    setCopilotLoading(false);
  }, [activeEngine, copilotLoading, addCopilotMessage, setCopilotLoading]);

  /* ── Typewriter effect ─────────────────────────────────── */
  const typewriterAppend = useCallback((msg) => {
    setIsTyping(true);
    setTypingText('');
    let i = 0;
    const chars = msg.text;
    const iv = setInterval(() => {
      if (i < chars.length) {
        setTypingText((prev) => prev + chars[i]);
        i++;
      } else {
        clearInterval(iv);
        setIsTyping(false);
        setDisplayedMessages((prev) => [...prev, msg]);
        setTypingText('');
      }
    }, 12);
  }, []);

  /* ── Auto-scroll ───────────────────────────────────────── */
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [displayedMessages, typingText]);

  /* ── Keyboard submit ───────────────────────────────────── */
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  /* ── Format timestamp ──────────────────────────────────── */
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  /* ── Engine color ──────────────────────────────────────── */
  const engineColor = (id) => ENGINES.find((e) => e.id === id)?.color || 'var(--accent-primary)';

  return (
    <div className="cp-root">
      {/* Engine Selector */}
      <div className="cp-engines">
        {ENGINES.map((eng) => {
          const Icon = eng.icon;
          const isActive = activeEngine === eng.id;
          return (
            <button
              key={eng.id}
              className={`cp-engine-pill text-mono ${isActive ? 'cp-engine-active' : ''}`}
              onClick={() => { setActiveEngine(eng.id); AudioSynth.playHover(); }}
              style={isActive ? { borderColor: eng.color, color: eng.color, boxShadow: `0 0 10px ${eng.color}33` } : {}}
            >
              <Icon size={12} />
              {eng.label}
            </button>
          );
        })}
      </div>

      {/* Quick Action Chips */}
      <div className="cp-chips">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button key={i} className="cp-chip text-mono" onClick={() => sendMessage(prompt)}>
            <Sparkles size={10} /> {prompt}
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div className="cp-messages" ref={messagesRef}>
        {displayedMessages.map((msg, i) => (
          <div key={i} className={`cp-msg cp-msg-${msg.role}`}>
            <div className="cp-msg-avatar">
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} style={{ color: engineColor(msg.engine) }} />}
            </div>
            <div className="cp-msg-body">
              <div className="cp-msg-text">{msg.text}</div>
              <div className="cp-msg-meta text-mono">
                {fmtTime(msg.timestamp)}
                {msg.engine && msg.role === 'ai' && (
                  <span className="cp-msg-engine" style={{ color: engineColor(msg.engine) }}>
                    {msg.engine.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="cp-msg cp-msg-ai">
            <div className="cp-msg-avatar"><Bot size={14} style={{ color: engineColor(activeEngine) }} /></div>
            <div className="cp-msg-body">
              <div className="cp-msg-text">{typingText}<span className="cp-cursor">▊</span></div>
            </div>
          </div>
        )}

        {/* Loading dots */}
        {copilotLoading && !isTyping && (
          <div className="cp-msg cp-msg-ai">
            <div className="cp-msg-avatar"><Bot size={14} /></div>
            <div className="cp-msg-body">
              <div className="cp-thinking text-mono">
                <span>Cortex is thinking</span>
                <span className="cp-dots"><span>.</span><span>.</span><span>.</span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="cp-input-bar">
        <input
          ref={inputRef}
          className="cp-input text-mono"
          type="text"
          placeholder={`Ask the ${activeEngine.toUpperCase()} engine...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={copilotLoading}
        />
        <button
          className="cp-send-btn"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || copilotLoading}
        >
          <Send size={16} />
        </button>
      </div>

      <style>{`
        .cp-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 20px;
          gap: 12px;
        }

        /* ── Engine Pills ──────────────────────── */
        .cp-engines {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .cp-engine-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          background: var(--neumorphic-press);
          color: var(--text-muted);
          cursor: pointer;
          font-size: 9px;
          letter-spacing: 0.8px;
          transition: all 0.25s;
          white-space: nowrap;
        }
        .cp-engine-pill:hover { color: var(--text-secondary); border-color: var(--glass-border-focus); }
        .cp-engine-active { background: var(--glass-bg); }

        /* ── Quick Chips ───────────────────────── */
        .cp-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .cp-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border: 1px solid var(--glass-border);
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 9px;
          letter-spacing: 0.3px;
          transition: all 0.2s;
        }
        .cp-chip:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          background: rgba(0,242,254,0.04);
        }

        /* ── Messages ──────────────────────────── */
        .cp-messages {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 10px 0;
        }
        .cp-msg {
          display: flex;
          gap: 10px;
          max-width: 85%;
          animation: cpSlideIn 0.3s ease;
        }
        @keyframes cpSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cp-msg-user { align-self: flex-end; flex-direction: row-reverse; }
        .cp-msg-ai { align-self: flex-start; }

        .cp-msg-avatar {
          width: 30px; height: 30px; flex-shrink: 0;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: var(--neumorphic-press);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
        }
        .cp-msg-user .cp-msg-avatar {
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          color: #fff; border: none;
        }

        .cp-msg-body { display: flex; flex-direction: column; gap: 4px; }
        .cp-msg-text {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-primary);
          white-space: pre-wrap;
          word-break: break-word;
        }
        .cp-msg-user .cp-msg-text {
          background: linear-gradient(135deg, rgba(0,242,254,0.12), rgba(127,0,255,0.08));
          border: 1px solid rgba(0,242,254,0.2);
          border-radius: 12px 12px 0 12px;
        }
        .cp-msg-ai .cp-msg-text {
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          border-radius: 12px 12px 12px 0;
        }

        .cp-msg-meta {
          font-size: 9px;
          color: var(--text-muted);
          display: flex;
          gap: 8px;
          padding: 0 4px;
        }
        .cp-msg-user .cp-msg-meta { justify-content: flex-end; }
        .cp-msg-engine { letter-spacing: 1px; font-weight: 600; }

        /* ── Cursor ────────────────────────────── */
        .cp-cursor {
          animation: cpBlink 0.8s step-end infinite;
          color: var(--accent-primary);
        }
        @keyframes cpBlink { 50% { opacity: 0; } }

        /* ── Thinking Dots ─────────────────────── */
        .cp-thinking {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 12px 12px 12px 0;
          font-size: 11px;
          color: var(--text-muted);
        }
        .cp-dots span {
          animation: cpDotBounce 1.4s ease-in-out infinite;
          display: inline-block;
        }
        .cp-dots span:nth-child(2) { animation-delay: 0.2s; }
        .cp-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes cpDotBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }

        /* ── Input Bar ─────────────────────────── */
        .cp-input-bar {
          display: flex;
          gap: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--glass-border);
        }
        .cp-input {
          flex: 1;
          padding: 14px 18px;
          background: var(--neumorphic-press);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 12px;
          outline: none;
          transition: all 0.3s;
        }
        .cp-input:focus {
          border-color: var(--glass-border-focus);
          box-shadow: 0 0 15px var(--accent-glow);
        }
        .cp-input:disabled { opacity: 0.5; }

        .cp-send-btn {
          width: 48px; height: 48px;
          border-radius: 12px;
          border: 1px solid var(--accent-primary);
          background: rgba(0,242,254,0.08);
          color: var(--accent-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .cp-send-btn:hover:not(:disabled) {
          background: rgba(0,242,254,0.2);
          box-shadow: 0 0 18px var(--accent-glow);
          transform: scale(1.05);
        }
        .cp-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
