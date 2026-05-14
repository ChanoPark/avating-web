import { createContext, useContext } from 'react';

type SidebarContextValue = {
  collapsed: boolean;
};

const SidebarContext = createContext<SidebarContextValue>({ collapsed: false });

export function useSidebarContext(): SidebarContextValue {
  return useContext(SidebarContext);
}

export const SidebarContextProvider = SidebarContext.Provider;
