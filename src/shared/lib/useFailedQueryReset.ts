import { useEffect, useState } from 'react';
import { useQueryClient, type Query, type QueryKey } from '@tanstack/react-query';

function isFailed(query: Query): boolean {
  return query.state.status === 'error';
}

// suspense 쿼리는 error reset boundary 가 리셋되기 전엔 재마운트해도 캐시된 에러를 재요청 없이 다시 던진다.
// 초기화가 끝나기 전에는 false 를 돌려준다 — 그동안 suspense 자식을 마운트하면 캐시된 에러를 먼저 던진다.
export function useFailedQueryReset(queryKey: QueryKey): boolean {
  const queryClient = useQueryClient();
  // 호출부는 매 렌더 새 배열을 넘긴다 — 처음 받은 키를 고정해 effect 가 다시 돌지 않게 한다.
  const [enteredQueryKey] = useState(queryKey);
  const [ready, setReady] = useState(
    () =>
      queryClient.getQueryCache().findAll({ queryKey: enteredQueryKey, predicate: isFailed })
        .length === 0
  );

  useEffect(() => {
    if (ready) return;
    void queryClient.resetQueries({ queryKey: enteredQueryKey, predicate: isFailed });
    setReady(true);
  }, [ready, queryClient, enteredQueryKey]);

  return ready;
}
