/**
 * dashboardStore.js — Cortex OS Central Nervous System
 * Zustand store that manages ALL dashboard state: navigation, telemetry,
 * boardroom debates, simulator ticks, campaigns, crisis alerts, and copilot messages.
 */
import { create } from 'zustand';

export const useDashboardStore = create((set, get) => ({
  // ─── Navigation ──────────────────────────────────────────────
  activeView: 'control-room',
  setActiveView: (view) => set({ activeView: view }),

  // ─── Dashboard Stats (9 key metrics) ────────────────────────
  dashboardStats: null,
  statsLoading: false,
  setDashboardStats: (stats) => set({ dashboardStats: stats, statsLoading: false }),
  setStatsLoading: (v) => set({ statsLoading: v }),

  // ─── Live Telemetry Stream ──────────────────────────────────
  telemetryHistory: [],
  latestTelemetry: null,
  addTelemetryTick: (tick) =>
    set((s) => ({
      latestTelemetry: tick,
      telemetryHistory: [...s.telemetryHistory.slice(-59), { ...tick, _t: Date.now() }],
    })),
  clearTelemetry: () => set({ telemetryHistory: [], latestTelemetry: null }),

  // ─── Crisis Alerts ──────────────────────────────────────────
  crisisAlert: null,
  crisisHistory: [],
  setCrisisAlert: (alert) =>
    set((s) => ({
      crisisAlert: alert,
      crisisHistory: [...s.crisisHistory.slice(-19), { ...alert, _t: Date.now() }],
    })),
  dismissCrisis: () => set({ crisisAlert: null }),

  // ─── Boardroom (Multi-Agent Debate) ─────────────────────────
  boardroomActive: false,
  boardroomLogs: [],
  boardroomTopic: '',
  agentVotes: {},
  boardroomFinalVerdict: null,
  startBoardroom: (topic) =>
    set({
      boardroomActive: true,
      boardroomLogs: [],
      agentVotes: {},
      boardroomTopic: topic || '',
      boardroomFinalVerdict: null,
    }),
  addBoardroomPacket: (packet) =>
    set((s) => {
      const newVotes = { ...s.agentVotes };
      if (packet.vote) newVotes[packet.agentName] = packet.vote;
      return {
        boardroomLogs: [...s.boardroomLogs, packet],
        agentVotes: newVotes,
        boardroomFinalVerdict: packet.type === 'verdict' ? packet : s.boardroomFinalVerdict,
      };
    }),
  endBoardroom: () => set({ boardroomActive: false }),

  // ─── Onboarding / Document Ingestion ────────────────────────
  onboardingStatus: null,   // 'uploading' | 'processing' | 'complete' | 'error'
  businessProfile: null,
  setOnboardingStatus: (status) => set({ onboardingStatus: status }),
  setBusinessProfile: (profile) => set({ businessProfile: profile }),

  // ─── Synthetic Buyer Simulator ──────────────────────────────
  simulatorRunning: false,
  simulatorTicks: [],
  simulatorReport: null,
  startSimulator: () =>
    set({ simulatorRunning: true, simulatorTicks: [], simulatorReport: null }),
  addSimulatorTick: (tick) =>
    set((s) => ({ simulatorTicks: [...s.simulatorTicks, tick] })),
  setSimulatorReport: (report) =>
    set({ simulatorReport: report, simulatorRunning: false }),

  // ─── Campaigns ──────────────────────────────────────────────
  campaigns: [],
  campaignsLoading: false,
  setCampaigns: (list) => set({ campaigns: list, campaignsLoading: false }),
  setCampaignsLoading: (v) => set({ campaignsLoading: v }),

  // ─── AI Copilot Chat ───────────────────────────────────────
  copilotMessages: [],
  copilotLoading: false,
  addCopilotMessage: (msg) =>
    set((s) => ({ copilotMessages: [...s.copilotMessages, msg] })),
  setCopilotLoading: (v) => set({ copilotLoading: v }),
  clearCopilot: () => set({ copilotMessages: [], copilotLoading: false }),

  // ─── Socket Connection Status ──────────────────────────────
  socketConnected: false,
  setSocketConnected: (v) => set({ socketConnected: v }),

  // App mode controls terminology (healthcare vs enterprise)
  appMode: 'enterprise', // 'healthcare' | 'enterprise'
  setAppMode: (mode) => set({ appMode: mode }),

  // ─── System Model Configuration ──────────────────────────────
  systemConfig: { routingMode: 'auto', manualProvider: 'nvidia' },
  setSystemConfig: (cfg) => set({ systemConfig: cfg }),
}));
