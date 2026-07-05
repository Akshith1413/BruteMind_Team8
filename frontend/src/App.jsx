/**
 * App.jsx — Cortex OS Root Application Shell
 * Orchestrates auth flow, socket lifecycle, ambient audio, and view routing.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from './store/authStore';
import { useDashboardStore } from './store/dashboardStore';
import { connectSocket, disconnectSocket, getSocket } from './utils/socketClient';
import { AudioSynth } from './utils/AudioSynth';

// Auth screens
import AuthScreen from './components/AuthScreen';
import LandingTerminalTransition from './components/LandingTerminalTransition';

// Layout
import TopBar from './components/Layout/TopBar';
import Sidebar from './components/Layout/Sidebar';

// Dashboard views
import ControlRoom from './components/Dashboard/ControlRoom';
import Boardroom from './components/Dashboard/Boardroom';
import Onboarding from './components/Dashboard/Onboarding';
import Simulator from './components/Dashboard/Simulator';
import AICopilot from './components/Dashboard/AICopilot';
import CampaignBuilder from './components/Dashboard/CampaignBuilder';
import Settings from './components/Dashboard/Settings';
import Analytics from './components/Dashboard/Analytics';
import Profile from './components/Dashboard/Profile';
import CommandPalette from './components/CommandPalette';

/* ── View renderer ───────────────────────────────────────── */
const VIEW_MAP = {
  'control-room': ControlRoom,
  'analytics': Analytics,
  'boardroom': Boardroom,
  'onboarding': Onboarding,
  'campaigns': CampaignBuilder,
  'simulator': Simulator,
  'copilot': AICopilot,
  'profile': Profile,
  'settings': Settings,
};

function App() {
  const { isAuthenticated } = useAuthStore();
  const {
    activeView, setSocketConnected,
    addTelemetryTick, setCrisisAlert,
  } = useDashboardStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* ── Socket lifecycle — connect on auth, disconnect on logout ── */
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setSocketConnected(false);
      AudioSynth.stopAmbientHum();
      return;
    }

    const socket = connectSocket();

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    // Start telemetry stream
    socket.emit('telemetry_stream_start');

    // Live telemetry ticks
    socket.on('telemetry_tick', (tick) => addTelemetryTick(tick));

    // Crisis alerts
    socket.on('crisis_alert', (alert) => {
      setCrisisAlert(alert);
      AudioSynth.playCrisis();
    });

    // Start ambient hum
    AudioSynth.startAmbientHum();

    return () => {
      socket.emit('telemetry_stream_stop');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('telemetry_tick');
      socket.off('crisis_alert');
      disconnectSocket();
      setSocketConnected(false);
      AudioSynth.stopAmbientHum();
    };
  }, [isAuthenticated]);

  /* ── Transition delay to allow login animation to complete ── */
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowDashboard(false);
    }
  }, [isAuthenticated]);

  /* ── Render ────────────────────────────────────────────── */
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (!showDashboard) {
    return <LandingTerminalTransition onComplete={() => setShowDashboard(true)} />;
  }

  const ActiveView = VIEW_MAP[activeView] || ControlRoom;

  return (
    <div className="app-shell">
      <CommandPalette />
      <TopBar />
      <div className="app-body">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
        <main className="app-main">
          <ActiveView />
        </main>
      </div>

      <style>{`
        .app-shell {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }

        .app-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .app-main {
          flex: 1;
          overflow: hidden;
          position: relative;
        }
      `}</style>
    </div>
  );
}

export default App;
