import { create } from 'zustand';
import { setAuthToken, clearAuthToken } from '../services/api';

interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  tosAccepted: boolean;
  credibilityScore: number;
  login: (token: string, userId: string, username: string, tosAccepted: boolean, credibilityScore: number) => void;
  setTosAccepted: () => void;
  setCredibilityScore: (score: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  username: null,
  tosAccepted: false,
  credibilityScore: 0,

  login: (token, userId, username, tosAccepted, credibilityScore) => {
    setAuthToken(token);
    set({ token, userId, username, tosAccepted, credibilityScore });
  },

  setTosAccepted: () => {
    set({ tosAccepted: true });
  },

  setCredibilityScore: (score) => {
    set({ credibilityScore: score });
  },

  logout: () => {
    clearAuthToken();
    set({ token: null, userId: null, username: null, tosAccepted: false, credibilityScore: 0 });
  },
}));
