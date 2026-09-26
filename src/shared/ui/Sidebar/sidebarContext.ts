import { createContext, useContext } from 'react';

// expanded = 라벨 항상 표시, collapsed = 아이콘 전용 고정.
export type SidebarMode = 'expanded' | 'collapsed';

type SidebarContextValue = {
  mode: SidebarMode;
};

const SidebarContext = createContext<SidebarContextValue>({ mode: 'expanded' });

export function useSidebarContext(): SidebarContextValue {
  return useContext(SidebarContext);
}

export const SidebarContextProvider = SidebarContext.Provider;
