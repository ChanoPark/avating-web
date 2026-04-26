import { useQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponsePublicKey } from '@entities/auth/model';
import { authKeys } from '@entities/auth/queryKeys';

async function fetchPublicKey(): Promise<string> {
  const response = await http.get('/api/crypto/public-key');
  const parsed = apiResponsePublicKey.parse(response.data);
  return parsed.data.publicKey;
}

export function usePublicKey() {
  return useQuery({
    queryKey: authKeys.publicKey(),
    queryFn: fetchPublicKey,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}
