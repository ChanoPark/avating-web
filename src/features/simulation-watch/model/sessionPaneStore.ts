import { create } from 'zustand';

// 셸이 이동마다 본문을 새로 세우므로, 접힘과 보던 대화는 컴포넌트 밖에 둬야 화면을 옮겨도 남는다.
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
