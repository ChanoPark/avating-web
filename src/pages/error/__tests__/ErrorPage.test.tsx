import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { STATUS_PAGE_URL, SUPPORT_EMAIL_HREF } from '@shared/config/constants';
import { ErrorPage } from '../ErrorPage';
import type { ErrorPageProps, ErrorVariant } from '../ErrorPage';

/**
 * 정본: `.claude/design/2026-08-06-wireframe-v2.3/wf/wf-s6-errors.jsx` (S-11-01 ~ S-11-05)
 *
 * 이 파일은 2026-08-07 에 **전면 재작성**됐다. 이전 판본은 v2.3 이 폐기한 동작
 * (offline 자동 재시도 · forbidden 의 로그인 CTA · server-error 1차 실패의 문의하기)을
 * 단언하고 있어 "구현이 아니라 테스트가 낡은" 경우였다.
 */

function LocationDisplay() {
  const loc = useLocation();
  return <div data-testid="location">{`${loc.pathname}${loc.search}`}</div>;
}

function renderErrorPage(
  variant: ErrorVariant,
  options: Omit<ErrorPageProps, 'variant'> & { initialEntries?: string[] } = {}
) {
  const { initialEntries = ['/garbage'], ...pageProps } = options;
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<div>HOME_PAGE</div>} />
        <Route
          path="/login"
          element={
            <>
              <div>LOGIN_PAGE</div>
              <LocationDisplay />
            </>
          }
        />
        <Route path="/dashboard" element={<div>DASHBOARD_PAGE</div>} />
        <Route
          path="*"
          element={
            <>
              <ErrorPage variant={variant} {...pageProps} />
              <LocationDisplay />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ErrorPage — 공통 시각 계약 (S-11 ErrBody)', () => {
  it('모든 화면이 eyebrow + 제목 + 본문을 갖는다', () => {
    renderErrorPage('server-error');
    expect(screen.getByText('일시적인 오류')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '문제가 생겼어요. 다시 시도해 주세요.' })
    ).toBeInTheDocument();
  });

  it('정본이 금지한 장식을 그리지 않는다 — 아이콘 박스·격자 배경·워드마크', () => {
    const { container } = renderErrorPage('not-found');
    // "그래픽 없이 타입 중심" (wf-s6-errors.jsx 헤더). 이전 판본의 56px 아이콘 박스와
    // 하단 `AVATING · {year}` 워드마크는 정본에 없다.
    expect(screen.queryByText(/AVATING ·/)).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"][style*="backgroundImage"]')).toBeNull();
  });

  it('에러 코드·요청 ID 를 사용자에게 노출하지 않는다', () => {
    const variants: ErrorVariant[] = [
      'session-expired',
      'forbidden',
      'not-found',
      'server-error',
      'offline',
    ];
    for (const v of variants) {
      const { unmount } = renderErrorPage(v);
      expect(screen.queryByText(/\b(401|403|404|500)\b/)).not.toBeInTheDocument();
      unmount();
    }
  });

  it('alert 컨테이너가 main 랜드마크와 분리되고 aria-live 를 중복 지정하지 않는다', () => {
    renderErrorPage('server-error');
    const alert = screen.getByRole('alert');
    expect(alert.tagName).not.toBe('MAIN');
    expect(alert).not.toHaveAttribute('aria-live');
  });
});

describe('ErrorPage — S-11-01 세션 만료 (401)', () => {
  it('세션 만료 문구를 표시한다', () => {
    renderErrorPage('session-expired');
    expect(screen.getByText('세션 만료')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '다시 로그인해 주세요.' })).toBeInTheDocument();
    expect(screen.getByText(/일정 시간 활동이 없어 자동으로 로그아웃됐어요/)).toBeInTheDocument();
  });

  it('앱 셸 없이 상단바만 있는 플랫 레이아웃이다', () => {
    renderErrorPage('session-expired');
    // 정본: "셸 없음 (사이드바·상단 바를 그리지 않습니다)" — 대신 로고 + 우측 라벨의
    // 얇은 상단바를 둔다.
    expect(screen.getByText('로그인 화면')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('"다시 로그인" 은 돌아갈 경로를 redirect 파라미터로 유지한다', async () => {
    const user = userEvent.setup();
    renderErrorPage('session-expired', { initialEntries: ['/avatars/abc'] });
    await user.click(screen.getByRole('button', { name: '다시 로그인' }));
    expect(screen.getByTestId('location')).toHaveTextContent(
      `/login?redirect=${encodeURIComponent('/avatars/abc')}`
    );
  });

  it('"서비스 소개로" 는 랜딩으로 이동한다', async () => {
    const user = userEvent.setup();
    renderErrorPage('session-expired');
    await user.click(screen.getByRole('button', { name: '서비스 소개로' }));
    expect(screen.getByText('HOME_PAGE')).toBeInTheDocument();
  });

  it('embedded 를 줘도 셸에 들어가지 않는다 — 세션이 끊긴 화면은 셸이 없다', () => {
    renderErrorPage('session-expired', { embedded: true });
    expect(screen.getByText('로그인 화면')).toBeInTheDocument();
  });
});

describe('ErrorPage — S-11-02 접근 권한 없음 (403)', () => {
  it('권한 없음 문구를 표시하고 리소스 존재 여부는 밝히지 않는다', () => {
    renderErrorPage('forbidden');
    expect(screen.getByText('접근 권한 없음')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '이 페이지를 볼 권한이 없어요.' })
    ).toBeInTheDocument();
    expect(screen.getByText(/다른 사람의 아바타나 대화는 열 수 없어요/)).toBeInTheDocument();
    // 정본: "문구는 항상 '권한이 없다'로 고정" — 없는 리소스인지 남의 것인지 구분하지 않는다.
    expect(screen.queryByText(/찾을 수 없|존재하지 않/)).not.toBeInTheDocument();
  });

  it('로그인 CTA 를 노출하지 않는다 — 이미 로그인한 사용자의 화면이다', () => {
    renderErrorPage('forbidden');
    expect(screen.queryByRole('button', { name: '로그인' })).not.toBeInTheDocument();
  });

  it('"탐색으로 돌아가기" 가 주 액션이다', async () => {
    const user = userEvent.setup();
    renderErrorPage('forbidden');
    await user.click(screen.getByRole('button', { name: '탐색으로 돌아가기' }));
    expect(screen.getByText('DASHBOARD_PAGE')).toBeInTheDocument();
  });

  it('canGoBack=true 일 때만 "이전 페이지" 를 함께 노출한다', () => {
    const { unmount } = renderErrorPage('forbidden', { canGoBack: true });
    expect(screen.getByRole('button', { name: '이전 페이지' })).toBeInTheDocument();
    unmount();

    renderErrorPage('forbidden', { canGoBack: false });
    expect(screen.queryByRole('button', { name: '이전 페이지' })).not.toBeInTheDocument();
  });
});

describe('ErrorPage — S-11-03 없는 페이지 (404)', () => {
  it('인증 상태에서는 대시보드 복귀 경로를 준다', () => {
    renderErrorPage('not-found', { isAuthenticated: true });
    expect(screen.getByText('없는 페이지')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '찾는 페이지가 없어요.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '대시보드로' })).toBeInTheDocument();
  });

  it('비인증이면 액션이 "서비스 소개로 · 로그인" 으로 교체된다', () => {
    renderErrorPage('not-found', { isAuthenticated: false });
    expect(screen.getByRole('button', { name: '서비스 소개로' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '대시보드로' })).not.toBeInTheDocument();
  });

  it('비인증 404 의 "로그인" 은 /login 으로 이동한다', async () => {
    const user = userEvent.setup();
    renderErrorPage('not-found', { isAuthenticated: false });
    await user.click(screen.getByRole('button', { name: '로그인' }));
    expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument();
  });

  it('서버 에러 문구와 구분된다', () => {
    renderErrorPage('not-found', { isAuthenticated: true });
    expect(screen.queryByText(/일시적인 오류/)).not.toBeInTheDocument();
  });
});

describe('ErrorPage — S-11-04 서버 에러 (500)', () => {
  it('1차 실패에는 문의 경로를 노출하지 않는다', () => {
    renderErrorPage('server-error');
    // 정본은 문의·상태 페이지를 S-11-05(3회 실패)에서만 보여 준다.
    expect(screen.queryByRole('button', { name: '문의하기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /상태 페이지/ })).not.toBeInTheDocument();
  });

  it('"다시 시도" 가 onRetry 를 호출한다', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderErrorPage('server-error', { onRetry });
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('onRetry 미제공 시 "다시 시도" 는 reload 폴백을 부른다', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...original, reload },
    });
    try {
      renderErrorPage('server-error');
      await user.click(screen.getByRole('button', { name: '다시 시도' }));
      expect(reload).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original });
    }
  });

  it('자동 재시도를 걸지 않는다', () => {
    vi.useFakeTimers();
    try {
      const onRetry = vi.fn();
      renderErrorPage('server-error', { onRetry });
      vi.advanceTimersByTime(30_000);
      // 정본: "자동 재시도는 하지 않습니다." 사용자가 누른 적이 없으면 0회여야 한다.
      expect(onRetry).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('셸 안에서는 부가 액션이 "대시보드로" 다', async () => {
    const user = userEvent.setup();
    renderErrorPage('server-error', { embedded: true });
    await user.click(screen.getByRole('button', { name: '대시보드로' }));
    expect(screen.getByText('DASHBOARD_PAGE')).toBeInTheDocument();
  });

  it('셸 밖(비인증 가능)에서는 "서비스 소개로" 로 바뀐다', async () => {
    const user = userEvent.setup();
    renderErrorPage('server-error');
    // 대시보드는 AuthGuard 뒤에 있다. 비로그인 사용자를 그쪽으로 보내면 로그인으로
    // 튕겨 나가므로, 셸 밖에서는 항상 열려 있는 랜딩을 준다.
    expect(screen.queryByRole('button', { name: '대시보드로' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '서비스 소개로' }));
    expect(screen.getByText('HOME_PAGE')).toBeInTheDocument();
  });
});

describe('ErrorPage — S-11-05 반복 실패', () => {
  it('재시도 3회 실패 시 반복 실패 화면으로 교체된다', () => {
    renderErrorPage('server-error', { retryCount: 3 });
    expect(screen.getByText('반복 실패')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '여러 번 시도해도 처리되지 않아요.' })
    ).toBeInTheDocument();
  });

  it('2회까지는 교체하지 않는다', () => {
    renderErrorPage('server-error', { retryCount: 2 });
    expect(screen.queryByText('반복 실패')).not.toBeInTheDocument();
    expect(screen.getByText('일시적인 오류')).toBeInTheDocument();
  });

  it('문의 · 상태 페이지 두 경로를 노출한다', () => {
    renderErrorPage('server-error', { retryCount: 3 });
    expect(screen.getByText('문의 남기기')).toBeInTheDocument();
    expect(screen.getByText('보통 하루 안에 답변해요')).toBeInTheDocument();
    expect(screen.getByText('서비스 상태 확인')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /상태 페이지/ })).toHaveAttribute(
      'href',
      STATUS_PAGE_URL
    );
  });

  it('onContact 가 있으면 "문의하기" 가 그 핸들러를 부른다', async () => {
    const user = userEvent.setup();
    const onContact = vi.fn();
    renderErrorPage('server-error', { retryCount: 3, onContact });
    await user.click(screen.getByRole('button', { name: '문의하기' }));
    expect(onContact).toHaveBeenCalledTimes(1);
  });

  it('onContact 가 없으면 mailto 링크로 폴백한다', () => {
    renderErrorPage('server-error', { retryCount: 3 });
    expect(screen.getByRole('link', { name: '문의하기' })).toHaveAttribute(
      'href',
      SUPPORT_EMAIL_HREF
    );
  });

  it('offline 도 3회 실패하면 같은 화면으로 넘어간다', () => {
    renderErrorPage('offline', { retryCount: 3 });
    expect(screen.getByText('반복 실패')).toBeInTheDocument();
  });

  it('not-found·forbidden 은 재시도 개념이 없어 교체되지 않는다', () => {
    const { unmount } = renderErrorPage('not-found', { retryCount: 9, isAuthenticated: true });
    expect(screen.queryByText('반복 실패')).not.toBeInTheDocument();
    unmount();

    renderErrorPage('forbidden', { retryCount: 9 });
    expect(screen.queryByText('반복 실패')).not.toBeInTheDocument();
  });
});

describe('ErrorPage — offline · maintenance (정본 외 · 유지 결정)', () => {
  it('offline 은 수동 재시도만 제공하고 자동 재시도 문구가 없다', () => {
    vi.useFakeTimers();
    try {
      const onRetry = vi.fn();
      renderErrorPage('offline', { onRetry });
      expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
      vi.advanceTimersByTime(30_000);
      expect(onRetry).not.toHaveBeenCalled();
      expect(screen.queryByText(/재연결 시도 중/)).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('maintenance 는 점검창 정보와 상태 페이지 링크를 준다', () => {
    renderErrorPage('maintenance', {
      maintenanceWindow: {
        startsAt: '2026-08-08 02:00',
        endsAt: '2026-08-08 04:00',
        durationMin: 120,
        brief: '데이터베이스 이관',
      },
    });
    expect(screen.getByRole('heading', { name: '잠깐 점검 중이에요.' })).toBeInTheDocument();
    expect(screen.getByText(/2026-08-08 02:00/)).toBeInTheDocument();
    expect(screen.getByText(/데이터베이스 이관/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /상태 페이지/ })).toHaveAttribute(
      'href',
      STATUS_PAGE_URL
    );
  });

  it('maintenanceStatusUrl 로 상태 페이지 링크를 덮어쓸 수 있다', () => {
    renderErrorPage('maintenance', { maintenanceStatusUrl: 'https://example.test/status' });
    expect(screen.getByRole('link', { name: /상태 페이지/ })).toHaveAttribute(
      'href',
      'https://example.test/status'
    );
  });
});

describe('ErrorPage — embedded (셸 안에서 본문만 교체)', () => {
  it('embedded 면 main 랜드마크를 새로 만들지 않는다', () => {
    renderErrorPage('forbidden', { embedded: true });
    // 셸(AppShellLayout)이 이미 main 을 갖고 있다. 두 개가 되면 랜드마크가 중복된다.
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('embedded 가 아니면 main 랜드마크를 만든다', () => {
    renderErrorPage('forbidden');
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('embedded 여도 같은 문구를 쓴다', () => {
    renderErrorPage('server-error', { embedded: true });
    expect(
      screen.getByRole('heading', { name: '문제가 생겼어요. 다시 시도해 주세요.' })
    ).toBeInTheDocument();
  });
});

describe('ErrorPage — 비로그인 404 카피 정합', () => {
  it('갈 수 없는 대시보드를 본문에서 가리키지 않는다', () => {
    render(
      <MemoryRouter initialEntries={['/garbage']}>
        <ErrorPage variant="not-found" isAuthenticated={false} />
      </MemoryRouter>
    );
    // 액션이 "서비스 소개로 · 로그인" 인데 본문만 "대시보드에서 다시 시작해 주세요" 로
    // 남으면 존재하지 않는 경로를 안내하게 된다.
    expect(screen.queryByText(/대시보드에서 다시 시작해 주세요/)).not.toBeInTheDocument();
    expect(screen.getByText('주소가 바뀌었거나 삭제된 화면이에요.')).toBeInTheDocument();
  });

  it('로그인 상태에서는 정본 문구를 그대로 쓴다', () => {
    render(
      <MemoryRouter initialEntries={['/garbage']}>
        <ErrorPage variant="not-found" isAuthenticated />
      </MemoryRouter>
    );
    expect(screen.getByText(/대시보드에서 다시 시작해 주세요/)).toBeInTheDocument();
  });
});
