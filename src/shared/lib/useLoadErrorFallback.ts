import { useEffect, useState } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useLoadErrorToast } from '@shared/ui/Toast/useLoadErrorToast';

// suspense 쿼리는 캐시에 에러가 남아 있으면 다시 마운트돼도 재요청 없이 그 에러를 던진다 —
// 화면을 떠날 때 실패한 쿼리를 초기 상태로 되돌려야 다시 들어왔을 때 재요청한다.
// 다른 화면이 같은 쿼리를 구독 중일 수 있어 캐시에서 떼어내지 않고 reset 한다.
export function useLoadErrorFallback(title: string, queryKey: QueryKey): void {
  const queryClient = useQueryClient();
  // 호출부는 매 렌더 새 배열을 넘긴다 — 처음 받은 키를 고정해 effect 가 다시 돌지 않게 한다.
  const [failedQueryKey] = useState(queryKey);

  useLoadErrorToast(true, title);

  useEffect(() => {
    return () => {
      void queryClient.resetQueries({ queryKey: failedQueryKey });
    };
  }, [queryClient, failedQueryKey]);
}
