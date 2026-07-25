import { createContext, useContext } from 'react';

// expanded   = 항상 라벨 표시 (데스크톱 레일 / 모바일 드로어)
// collapsed  = 항상 아이콘 전용 (56px)
// responsive = 태블릿 아이콘 전용(md) → 데스크톱 라벨(lg)
export type SidebarMode = 'expanded' | 'collapsed' | 'responsive';

type SidebarContextValue = {
  mode: SidebarMode;
};

const SidebarContext = createContext<SidebarContextValue>({ mode: 'expanded' });

export function useSidebarContext(): SidebarContextValue {
  return useContext(SidebarContext);
}

export const SidebarContextProvider = SidebarContext.Provider;
