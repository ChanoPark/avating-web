import { createContext, useContext } from 'react';

// expanded = 라벨 항상 표시, collapsed = 아이콘 전용 고정, responsive = 태블릿까지 아이콘
// 전용이다가 데스크톱에서 라벨로 바뀐다.
export type SidebarMode = 'expanded' | 'collapsed' | 'responsive';

type SidebarContextValue = {
  mode: SidebarMode;
};

const SidebarContext = createContext<SidebarContextValue>({ mode: 'expanded' });

export function useSidebarContext(): SidebarContextValue {
  return useContext(SidebarContext);
}

export const SidebarContextProvider = SidebarContext.Provider;
