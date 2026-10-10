import { create } from 'zustand';

type SessionPaneState = {
  collapsed: boolean;
  lastSessionId: string | null;
  toggle: () => void;
  remember: (sessionId: string) => void;
};

export const useSessionPaneStore = create<SessionPaneState>()((set) => ({
  collapsed: false,
  lastSessionId: null,
  toggle: () => {
    set((state) => ({ collapsed: !state.collapsed }));
  },
  remember: (sessionId) => {
    set({ lastSessionId: sessionId });
  },
}));
