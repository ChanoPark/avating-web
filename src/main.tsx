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

  // MSW 기동 뒤에 부른다 — 저장된 세션이 있으면 여기서 곧바로 검증 요청이 나가는데,
  // worker.start() 전에 발사하면 mock 모드에서 그 요청만 서비스워커를 우회한다.
  // await 하지 않는 이유: 저장된 세션이 없으면 동기로 끝나 첫 렌더 전에 확정되고,
  // 세션이 있으면 서버 검증 왕복 동안 restoring 상태로 렌더가 먼저 나간다(AuthGuard 대기 화면).
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
