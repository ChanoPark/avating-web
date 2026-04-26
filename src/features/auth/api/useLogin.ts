import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponseAuthToken, apiResponsePublicKey } from '@entities/auth/model';
import type { AuthTokenResponse } from '@entities/auth/model';
import { authKeys } from '@entities/auth/queryKeys';
import { useAuthStore } from '@entities/auth/store';
import { encryptPassword } from '../lib/encryptPassword';
import type { ApiError } from '@shared/lib/errors';

type LoginInput = {
  email: string;
  password: string;
};

async function fetchPublicKeyDirect(): Promise<string> {
  const response = await http.get('/api/crypto/public-key');
  const parsed = apiResponsePublicKey.parse(response.data);
  return parsed.data.publicKey;
}

async function loginRequest(email: string, encryptedPassword: string): Promise<AuthTokenResponse> {
  const response = await http.post('/api/auth/login', { email, encryptedPassword });
  const parsed = apiResponseAuthToken.parse(response.data);
  return parsed.data;
}

export function useLogin() {
  const queryClient = useQueryClient();
  const setToken = useAuthStore((s) => s.setToken);

  return useMutation<AuthTokenResponse, ApiError, LoginInput>({
    mutationFn: async ({ email, password }) => {
      const cachedPublicKey = queryClient.getQueryData<string>(authKeys.publicKey());
      const publicKey = cachedPublicKey ?? (await fetchPublicKeyDirect());
      const encrypted = encryptPassword(password, publicKey);
      return loginRequest(email, encrypted);
    },
    onSuccess: (data) => {
      setToken(data);
      queryClient.removeQueries({ queryKey: authKeys.publicKey() });
    },
    onError: () => {
      queryClient.removeQueries({ queryKey: authKeys.publicKey() });
    },
    throwOnError: false,
  });
}
