import { create } from 'zustand';

// AppShellLayout 의 chrome breadcrumb 슬롯.
// 페이지가 데이터 로드 후 trail 을 push 하고, 언마운트 시 비운다.
// trail 이 비어 있으면 AppShellLayout 의 pathname 기본 매핑이 적용된다.
type ChromeBreadcrumbState = {
  trail: readonly string[] | null;
  setTrail: (next: readonly string[]) => void;
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
