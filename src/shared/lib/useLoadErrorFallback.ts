import { useEffect, useState } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useLoadErrorToast } from '@shared/ui/Toast/useLoadErrorToast';

// suspense 쿼리는 error reset boundary 가 리셋되기 전엔 재마운트해도 캐시된 에러를 재요청 없이 다시 던진다.
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
