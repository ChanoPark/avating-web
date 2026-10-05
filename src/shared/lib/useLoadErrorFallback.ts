import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLoadErrorToast } from '@shared/ui/Toast/useLoadErrorToast';

// suspense 쿼리는 캐시에 에러가 남아 있으면 다시 마운트돼도 재요청 없이 그 에러를 던진다 —
// 화면을 떠날 때 실패한 쿼리를 캐시에서 지워야 다시 들어왔을 때 재요청한다.
export function useLoadErrorFallback(title: string): void {
  const queryClient = useQueryClient();

  useLoadErrorToast(true, title);

  useEffect(() => {
    return () => {
      queryClient.removeQueries({
        type: 'inactive',
        predicate: (query) => query.state.status === 'error',
      });
    };
  }, [queryClient]);
}
