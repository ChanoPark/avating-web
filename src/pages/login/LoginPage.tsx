import { useNavigate, useSearchParams } from 'react-router';
import { LoginForm } from '@features/auth/ui/LoginForm';
import { AuthLayout, type AuthAsideItem } from '@features/auth/ui/AuthLayout';

// 오픈 리다이렉트 방지: AuthGuard 가 심은 redirect 파라미터를 그대로 navigate 에 넘기되,
// 동일 출처 절대 경로(`/path`)만 허용한다. `//evil.com`(프로토콜-상대)·절대 URL 은 차단.
// useSearchParams().get 이 이미 URL 디코드를 수행하므로 추가 decodeURIComponent 금지.
function resolveRedirect(redirect: string | null): string {
  if (redirect && redirect.startsWith('/') && redirect[1] !== '/' && redirect[1] !== '\\') {
    return redirect;
  }
  return '/dashboard';
}

// 정본 `ScreenSignin` 의 AuthAside 3항목.
// 로그인 전 화면이라 계정 데이터를 알 수 없다 — 건수 같은 수치를 적으면 방문자 모두에게
// 같은 가짜 숫자가 보인다(`수락·거절 대기 3건` 하드코딩이 실제로 그랬다). 설명은 수치 없이 쓴다.
const ASIDE_ITEMS: readonly AuthAsideItem[] = [
  { title: '진행 중인 매칭', description: '관전 이어보기' },
  { title: '받은 요청', description: '수락·거절 결정하기' },
  { title: '내 아바타', description: '스탯 다듬기' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = resolveRedirect(searchParams.get('redirect'));

  // 정본 v2 `ScreenSignin`: 좌 폼 페인 + 우 AuthAside 340 의 2단 구성.
  return (
    <AuthLayout
      headingId="login-heading"
      title="다시 만나서 반가워요"
      subtitle="아바타의 대화가 기다리고 있어요."
      asideItems={ASIDE_ITEMS}
    >
      <LoginForm
        onSuccess={() => {
          void navigate(redirectTo);
        }}
      />
    </AuthLayout>
  );
}
