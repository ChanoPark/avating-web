import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { STATUS_PAGE_URL } from '@shared/config/constants';

/**
 * — 아이콘·일러스트 없이 타입 중심으로 그리고, 에러 코드·요청 ID 는 사용자에게 보여주지 않는다.
 */
export type ErrorVariant =
  | 'session-expired' // S-11-01 · 401
  | 'forbidden' // S-11-02 · 403
  | 'not-found' // S-11-03 · 404
  | 'server-error' // S-11-04 · 500
  | 'offline' // 정본 외
  | 'maintenance'; // 정본 외

type MaintenanceWindow = {
  startsAt: string;
  endsAt: string;
  durationMin: number;
  brief: string;
};

export type ErrorPageProps = {
  variant: ErrorVariant;
  /** 앱 셸 안에 놓일 때 true. 셸의 `<main>` 과 중복되지 않도록 랜드마크를 새로 만들지 않는다(`session-expired` 는 예외). */
  embedded?: boolean;
  canGoBack?: boolean;
  isAuthenticated?: boolean;
  maintenanceWindow?: MaintenanceWindow;
  maintenanceStatusUrl?: string;
};

type Copy = { eyebrow: string; title: string; body: string };

const COPY: Record<ErrorVariant, Copy> = {
  'session-expired': {
    eyebrow: '세션 만료',
    title: '다시 로그인해주세요',
    body: '일정 시간 활동이 없어 자동으로 로그아웃됐어요. 다시 로그인하면 보던 화면으로 돌아갑니다.',
  },
  forbidden: {
    eyebrow: '접근 권한 없음',
    title: '이 페이지를 볼 권한이 없어요',
    body: '다른 사람의 아바타나 대화는 열 수 없어요. 공유받은 링크라면 주소를 다시 확인해 주세요.',
  },
  'not-found': {
    eyebrow: '없는 페이지',
    title: '찾는 페이지가 없어요',
    body: '주소가 바뀌었거나 삭제된 화면이에요. 대시보드에서 다시 시작해 주세요.',
  },
  'server-error': {
    eyebrow: '일시적인 오류',
    title: '문제가 생겼어요',
    body: '요청을 처리하지 못했어요. 잠시 후 다시 시도하면 대부분 해결됩니다.',
  },
  // offline · maintenance 는 정본에 대응 화면이 없다 — 기존 판본 문구를 그대로 쓴다.
  offline: {
    eyebrow: '연결 끊김',
    title: '인터넷 연결이 불안정해요',
    body: '연결 상태를 확인하고 다시 시도해 주세요.',
  },
  maintenance: {
    eyebrow: '점검 중',
    title: '잠깐 점검 중이에요',
    body: '점검이 끝나면 다시 이용할 수 있어요.',
  },
};

function detectHasHistory(): boolean {
  if (typeof window === 'undefined') return false;
  return window.history.length > 1;
}

function ErrorBody({
  copy,
  actions,
  extra,
}: {
  copy: Copy;
  actions?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div role="alert" className="flex w-full max-w-[470px] flex-col items-center text-center">
      <div aria-hidden="true" className="bg-subtle mb-[22px] h-px w-[26px]" />
      <div className="text-caption text-secondary font-medium">{copy.eyebrow}</div>
      <h1 className="text-title text-primary mt-3 text-balance">{copy.title}</h1>
      <p className="text-caption text-secondary mt-2.5 text-pretty">{copy.body}</p>
      {actions && <div className="mt-[26px] flex flex-wrap justify-center gap-2.5">{actions}</div>}
      {extra}
    </div>
  );
}

export function ErrorPage({
  variant,
  embedded = false,
  canGoBack,
  isAuthenticated,
  maintenanceWindow,
  maintenanceStatusUrl,
}: ErrorPageProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // 정본 문구를 그대로 쓰면 비인증 사용자에게는 있지도 않은 대시보드 버튼을 가리키게 되므로, 그
  // 문장만 뺀다.
  const loggedOutNotFound = variant === 'not-found' && isAuthenticated === false;
  const copy = loggedOutNotFound
    ? { ...COPY['not-found'], body: '주소가 바뀌었거나 삭제된 화면이에요.' }
    : COPY[variant];
  const showBack = canGoBack ?? detectHasHistory();

  // 세션이 끊긴 화면은 셸이 존재할 수 없다 — 셸 자체가 인증을 전제한다.
  const flat = variant === 'session-expired' || !embedded;

  function goHome() {
    void navigate('/');
  }
  function goDashboard() {
    void navigate('/dashboard');
  }
  function goLogin() {
    void navigate('/login');
  }
  function goBack() {
    void navigate(-1);
  }
  function reloginWithRedirect() {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    void navigate(`/login?redirect=${redirect}`);
  }
  let actions: ReactNode = null;
  let extra: ReactNode = null;

  if (variant === 'session-expired') {
    actions = (
      <>
        <Button onClick={reloginWithRedirect}>다시 로그인</Button>
        <Button variant="ghost" onClick={goHome}>
          서비스 소개로
        </Button>
      </>
    );
  } else if (variant === 'forbidden') {
    actions = (
      <>
        <Button onClick={goDashboard}>대시보드로 돌아가기</Button>
        {showBack && (
          <Button variant="ghost" onClick={goBack}>
            이전 페이지
          </Button>
        )}
      </>
    );
  } else if (variant === 'not-found') {
    actions =
      isAuthenticated === false ? (
        <>
          <Button onClick={goHome}>서비스 소개로</Button>
          <Button variant="ghost" onClick={goLogin}>
            로그인
          </Button>
        </>
      ) : (
        // 정본은 버튼을 2개(탐색 둘러보기 포함) 두지만, 탐색 화면 라우트가 아직 없어 하나만 둔다.
        <Button onClick={goDashboard}>대시보드로</Button>
      );
  } else if (variant === 'maintenance') {
    extra = (
      <>
        {maintenanceWindow && (
          <div className="text-meta text-secondary mt-4">
            <div className="tnum">
              {maintenanceWindow.startsAt} - {maintenanceWindow.endsAt}
            </div>
            <div className="tnum mt-1">약 {maintenanceWindow.durationMin}분 소요 예정</div>
            <div className="text-secondary mt-2">점검 내용: {maintenanceWindow.brief}</div>
          </div>
        )}
        <a
          href={maintenanceStatusUrl ?? STATUS_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption text-action hover:text-action-hover ease-standard mt-6 inline-flex items-center gap-1 rounded-full font-medium transition-colors duration-[var(--dur-fast)]"
        >
          상태 페이지
          <ArrowUpRight size={13} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </>
    );
  } else {
    actions = embedded ? (
      <Button onClick={goDashboard}>대시보드로</Button>
    ) : (
      <Button onClick={goHome}>서비스 소개로</Button>
    );
  }

  const body = <ErrorBody copy={copy} actions={actions} extra={extra} />;

  if (!flat) {
    // 셸에 이미 <main> 이 있으므로, 여기서는 본문 영역만 교체하고 랜드마크는 새로 만들지 않는다.
    return <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">{body}</div>;
  }

  return (
    <div className="bg-canvas flex min-h-screen flex-col">
      <div className="border-subtle bg-canvas flex h-17 shrink-0 items-center justify-between border-b px-6 md:px-16">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="bg-action rounded-chip size-4.5" />
          <span className="text-ink text-title font-bold tracking-[-0.03em]">Avating</span>
        </div>
        <span className="text-caption text-secondary">
          {variant === 'session-expired' ? '로그인 화면' : '오류'}
        </span>
      </div>
      <main className="flex flex-1 items-center justify-center px-6 py-12">{body}</main>
    </div>
  );
}
