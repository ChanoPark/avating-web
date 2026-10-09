import { create } from 'zustand';

// AppShellLayout 의 breadcrumb 슬롯이다 — 페이지가 로드된 뒤 trail 을 채우고 언마운트 시 비운다.
// 비어 있으면 AppShellLayout 이 pathname 기반 기본값을 쓴다.
export type ChromeCrumb = {
  label: string;
  /** 상위 항목이 갈 경로. 없으면 글자로 그린다. 마지막 항목은 이 값과 상관없이 현재 경로로 간다. */
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
