import { useAuthStore } from './store/authStore';
import AuthScreen from './components/AuthScreen';
import { LogOut, Activity, Database, Cpu, Heart, CheckCircle2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

function App() {
  const { isAuthenticated, user, logout, theme, toggleTheme } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const terminalEndRef = useRef(null);

  // Simulated telemetry log flow for the dashboard sandbox
  useEffect(() => {
    if (!isAuthenticated) {
      setLogs([]);
      return;
    }

    const logMessages = [
      'SYS: Initializing clinical diagnostic pipeline...',
      `SYS: Active session registered: ${user?.username} (${user?.specialty})`,
      'DB: Connecting to genomic core nodes... OK',
      'AI: Neural engine listening on cellular frequencies...',
      'BIO: Mock telemetry stream: Pulse=72bpm, Oxygen=98%, Stress=Nominal',
      'SYS: All terminal systems running at maximum performance.',
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < logMessages.length) {
        setLogs((prev) => [...prev, logMessages[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // Scroll to bottom of terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Entrance animation for dashboard card
  useEffect(() => {
    if (isAuthenticated) {
      gsap.fromTo('.dashboard-card',
        { scale: 0.9, opacity: 0, y: 40 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.2)' }
      );
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="dashboard-wrapper">
      {/* Grid line backdrop follows theme */}
      <div className="dashboard-card">
        {/* Top Header */}
        <header className="dash-header">
          <div className="dash-logo text-tech glow-text">
            <Activity className="pulse-icon" />
            <span>HEALOS // TERMINAL</span>
          </div>
          <div className="dash-actions">
            <button 
              onClick={logout} 
              className="logout-btn text-tech"
              title="Logout Session"
              aria-label="Logout Session"
            >
              <LogOut size={16} />
              <span>TERMINATE SESSION</span>
            </button>
          </div>
        </header>

        {/* Diagnostic Panel layout */}
        <main className="dash-content">
          <section className="welcome-banner">
            <div className="badge-row">
              <span className="clinical-badge text-mono">{user?.specialty.toUpperCase()}</span>
              <span className="status-badge text-mono">
                <CheckCircle2 size={12} style={{ color: 'var(--accent-primary)' }} />
                SESSION ACTIVE
              </span>
            </div>
            <h1 className="text-tech">Welcome back, {user?.username}</h1>
            <p>Your biometric data tunnels and neural models are ready for diagnostic analysis.</p>
          </section>

          {/* Diagnostic Stats Grid */}
          <div className="stats-grid text-mono">
            <div className="stat-card">
              <Heart className="stat-icon heart-pulse" />
              <div className="stat-label">HEART RATE</div>
              <div className="stat-value">72 <span className="stat-unit">BPM</span></div>
            </div>
            <div className="stat-card">
              <Cpu className="stat-icon" />
              <div className="stat-label">NEURAL SYNC</div>
              <div className="stat-value">98.4 <span className="stat-unit">%</span></div>
            </div>
            <div className="stat-card">
              <Database className="stat-icon" />
              <div className="stat-label">GENOMIC DEPTH</div>
              <div className="stat-value">4.2 <span className="stat-unit">GB</span></div>
            </div>
          </div>

          {/* Terminal telemetry console */}
          <section className="terminal-console">
            <div className="terminal-header">
              <div className="dot red"></div>
              <div className="dot yellow"></div>
              <div className="dot green"></div>
              <span className="terminal-title text-mono">SYSTEM LOGS - active_pipeline.log</span>
            </div>
            <div className="terminal-body text-mono">
              {logs.map((log, idx) => (
                <div key={idx} className="terminal-line">
                  <span className="prompt">&gt;</span> {log}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </section>
        </main>
      </div>

      <style>{`
        .dashboard-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 100vh;
          padding: 40px 20px;
          z-index: 10;
        }

        .dashboard-card {
          width: 800px;
          max-width: 100%;
          background: var(--glass-bg);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          box-shadow: var(--glass-shadow);
          padding: 30px;
          transition: var(--theme-transition);
          background-image: var(--card-noise);
          background-size: 8px 8px;
        }

        .dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .dash-logo {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pulse-icon {
          color: var(--accent-primary);
          animation: beat 1.5s ease-in-out infinite;
        }

        @keyframes beat {
          0%, 100% { transform: scale(1); }
          30% { transform: scale(1.15); }
          45% { transform: scale(1.05); }
          60% { transform: scale(1.2); }
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          letter-spacing: 0.5px;
          transition: all 0.25s ease;
        }

        .logout-btn:hover {
          color: var(--accent-warn);
          border-color: var(--accent-warn);
          background: rgba(239, 68, 68, 0.05);
          box-shadow: 0 0 10px var(--accent-warn-glow);
        }

        .dash-content {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .welcome-banner {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .badge-row {
          display: flex;
          gap: 10px;
        }

        .clinical-badge {
          background: var(--neumorphic-press);
          border: 1px solid var(--glass-border);
          padding: 4px 10px;
          font-size: 10px;
          border-radius: 4px;
          color: var(--accent-primary);
          letter-spacing: 1px;
          text-shadow: 0 0 4px var(--accent-glow);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: var(--neumorphic-press);
          border: 1px solid var(--glass-border);
          padding: 4px 10px;
          font-size: 10px;
          border-radius: 4px;
          color: var(--text-secondary);
          letter-spacing: 1px;
        }

        .welcome-banner h1 {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 4px 0 0 0;
          letter-spacing: -0.5px;
        }

        .welcome-banner p {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          background: var(--neumorphic-press);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          overflow: hidden;
        }

        .stat-icon {
          position: absolute;
          right: 15px;
          top: 15px;
          color: var(--text-muted);
          opacity: 0.2;
          width: 32px;
          height: 32px;
        }

        .heart-pulse {
          animation: beat 1.5s ease-in-out infinite;
        }

        .stat-label {
          font-size: 10px;
          color: var(--text-secondary);
          letter-spacing: 1px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: var(--text-primary);
        }

        .stat-unit {
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: normal;
        }

        .terminal-console {
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.4);
        }

        .terminal-header {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--glass-border);
          padding: 10px 14px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot.red { background: #ef4444; }
        .dot.yellow { background: #eab308; }
        .dot.green { background: #22c55e; }

        .terminal-title {
          font-size: 10px;
          color: var(--text-secondary);
          margin-left: 10px;
          letter-spacing: 0.5px;
        }

        .terminal-body {
          padding: 15px;
          font-size: 12px;
          color: #a7f3d0;
          height: 180px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
          background-color: #040508;
        }

        .terminal-line {
          line-height: 1.4;
          letter-spacing: 0.5px;
          white-space: pre-wrap;
        }

        .prompt {
          color: var(--accent-primary);
          margin-right: 6px;
        }
      `}</style>
    </div>
  );
}

export default App;
