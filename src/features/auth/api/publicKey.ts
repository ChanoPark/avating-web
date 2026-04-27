import { useQuery, type QueryClient } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponsePublicKey } from '@entities/auth/model';
import { authKeys } from '@entities/auth/queryKeys';

const PUBLIC_KEY_STALE_TIME_MS = 5 * 60_000;
const PUBLIC_KEY_GC_TIME_MS = 10 * 60_000;

export async function fetchPublicKey(): Promise<string> {
  const response = await http.get('/api/crypto/public-key');
  const parsed = apiResponsePublicKey.parse(response.data);
  return parsed.data.publicKey;
}

export function ensurePublicKey(queryClient: QueryClient): Promise<string> {
  return queryClient.fetchQuery({
    queryKey: authKeys.publicKey(),
    queryFn: fetchPublicKey,
    staleTime: PUBLIC_KEY_STALE_TIME_MS,
  });
}

export function usePublicKey() {
  return useQuery({
    queryKey: authKeys.publicKey(),
    queryFn: fetchPublicKey,
    staleTime: PUBLIC_KEY_STALE_TIME_MS,
    gcTime: PUBLIC_KEY_GC_TIME_MS,
  });
}
