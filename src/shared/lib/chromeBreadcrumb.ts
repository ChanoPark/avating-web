import { create } from 'zustand';

// AppShellLayout 의 breadcrumb 슬롯이다 — 페이지가 로드된 뒤 trail 을 채우고 언마운트 시 비운다.
// 비어 있으면 AppShellLayout 이 pathname 기반 기본값을 쓴다.
export type ChromeCrumb = {
  label: string;
  to?: string;
};

type ChromeBreadcrumbState = {
  trail: readonly ChromeCrumb[] | null;
  setTrail: (next: readonly ChromeCrumb[]) => void;
  clearTrail: () => void;
};

export const useChromeBreadcrumbStore = create<ChromeBreadcrumbState>()((set) => ({
  trail: null,
  setTrail: (next) => {
    set({ trail: next });
  },
  clearTrail: () => {
    set({ trail: null });
  },
}));
