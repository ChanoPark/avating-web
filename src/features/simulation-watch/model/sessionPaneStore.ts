import { create } from 'zustand';

// 셸이 이동마다 본문을 새로 세우므로, 접힘은 컴포넌트 밖에 둬야 다른 세션으로 옮겨도 남는다.
type SessionPaneState = {
  collapsed: boolean;
  toggle: () => void;
};

export const useSessionPaneStore = create<SessionPaneState>()((set) => ({
  collapsed: false,
  toggle: () => {
    set((state) => ({ collapsed: !state.collapsed }));
  },
}));
