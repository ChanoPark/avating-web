import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { LoginForm } from '@features/auth/ui/LoginForm';
import { AuthLayout, type AuthAsideItem } from '@features/auth/ui/AuthLayout';
import { useAuthStore } from '@entities/auth/store';

// 오픈 리다이렉트 방지 — 동일 출처 절대 경로(`/path`)만 허용하고 프로토콜-상대(`//evil.com`)·절대 URL 은 막는다.
// useSearchParams().get 이 이미 디코드하므로 decodeURIComponent 를 추가하면 이중 디코드가 된다.
function resolveRedirect(redirect: string | null): string {
  if (redirect && redirect.startsWith('/') && redirect[1] !== '/' && redirect[1] !== '\\') {
    return redirect;
  }
  return '/dashboard';
}

// 로그인 전 화면이라 계정 데이터를 알 수 없다 — 건수 같은 수치를 적으면 방문자 모두에게 같은 가짜 숫자가 보인다.
const ASIDE_ITEMS: readonly AuthAsideItem[] = [
  { title: '진행 중인 매칭', description: '관전 이어보기' },
  { title: '받은 요청', description: '수락·거절 결정하기' },
  { title: '내 아바타', description: '스탯 다듬기' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = resolveRedirect(searchParams.get('redirect'));
  const status = useAuthStore((s) => s.status);

  // 로그인한 채로 이 화면에 들어오면 빈 폼이 로그아웃된 것처럼 보이므로 가려던 곳으로 바로 보낸다.
  useEffect(() => {
    if (status === 'authenticated') {
      void navigate(redirectTo, { replace: true });
    }
  }, [status, redirectTo, navigate]);

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
