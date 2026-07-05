import { create } from 'zustand';
import { AudioSynth } from '../utils/AudioSynth';
import { useDashboardStore } from './dashboardStore';

export const useAuthStore = create((set, get) => {
  // Read initial user and theme from localStorage
  const savedUser = localStorage.getItem('healos_user');
  const initialUser = savedUser ? JSON.parse(savedUser) : null;
  const initialTheme = localStorage.getItem('healos_theme') || 'dark';

  // Apply initial theme to document root
  document.documentElement.setAttribute('data-theme', initialTheme);

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    theme: initialTheme,
    isMuted: false,

    toggleMute: () => {
      const currentMuted = AudioSynth.toggleMute();
      set({ isMuted: currentMuted });
    },

    toggleTheme: () => {
      const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('healos_theme', nextTheme);
      AudioSynth.playThemeSwitch();
      set({ theme: nextTheme });
    },

    signup: async (username, email, specialty, pin) => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, specialty, pin })
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Diagnostic enrollment rejected by server.');
        }

        localStorage.setItem('healos_user', JSON.stringify(data.user));
        AudioSynth.playSuccess();
        set({ user: data.user, isAuthenticated: true });
      } catch (error) {
        console.error('Signup error:', error);
        throw error;
      }
    },

    login: async (email, pin) => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, pin })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Access key decrypted error.');
        }

        localStorage.setItem('healos_user', JSON.stringify(data.user));
        AudioSynth.playSuccess();
        set({ user: data.user, isAuthenticated: true });
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },

    logout: () => {
      localStorage.removeItem('healos_user');
      AudioSynth.playTransition();
      useDashboardStore.getState().resetStore();
      set({ user: null, isAuthenticated: false });
    },
  };
});
