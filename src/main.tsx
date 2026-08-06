import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@app/App';
import { configureHttp } from '@app/configureHttp';
import { bootstrapAuth } from '@app/bootstrapAuth';
import { env } from '@shared/config/env';
import '@app/styles/index.css';

async function bootstrap() {
  configureHttp();

  if (env.VITE_API_MODE === 'mock') {
    const { worker } = await import('@shared/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  // MSW 기동 뒤에 부른다 — 저장된 세션이 만료 상태면 여기서 곧바로 refresh 요청이 나가는데,
  // worker.start() 전에 발사하면 mock 모드에서 그 요청만 서비스워커를 우회한다.
  // await 하지 않는 이유: 토큰이 유효하거나 아예 없는 경우는 동기로 끝나 첫 렌더 전에 확정되고,
  // refresh 왕복이 필요한 경우에만 restoring 상태로 렌더가 먼저 나간다.
  void bootstrapAuth();

  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root container #root not found in index.html');
  }

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void bootstrap();
