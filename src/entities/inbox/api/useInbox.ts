import { useSuspenseQuery } from '@tanstack/react-query';
import { http } from '@shared/api/http';
import { apiResponseInbox, type InboxResponse } from '../model';
import { inboxKeys } from '../queryKeys';

async function fetchInbox(): Promise<InboxResponse> {
  const response = await http.get('/api/inbox');
  const parsed = apiResponseInbox.parse(response.data);
  return parsed.data;
}

export function useInboxSuspense(): InboxResponse {
  const { data } = useSuspenseQuery({
    queryKey: inboxKeys.list(),
    queryFn: fetchInbox,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  return data;
}
