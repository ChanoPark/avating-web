import type { ReactNode } from 'react';
import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { ToastProvider } from '@shared/ui/Toast/Toast';

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

type RenderOptions = {
  queryClient?: QueryClient;
  initialRoute?: string;
  /**
   * 실제 앱(main.tsx)은 StrictMode 로 렌더한다. effect 이중 실행에서만 드러나는 결함
   * (ref 가드가 구독을 끊어 화면이 멈추는 부류)을 재현할 때 켠다.
   */
  strictMode?: boolean;
};

export function renderWithProviders(
  ui: ReactNode,
  {
    queryClient = createTestQueryClient(),
    initialRoute = '/',
    strictMode = false,
  }: RenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    const tree = (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <ToastProvider>{children}</ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
    return strictMode ? <StrictMode>{tree}</StrictMode> : tree;
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper }) };
}
