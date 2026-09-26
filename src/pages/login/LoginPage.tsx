import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { LoginForm } from '@features/auth/ui/LoginForm';
import { AuthLayout } from '@features/auth/ui/AuthLayout';
import { SiteHeader } from '@features/auth/ui/SiteHeader';
import { useAuthStore } from '@entities/auth/store';

// 오픈 리다이렉트 방지 — 동일 출처 절대 경로(`/path`)만 허용하고 프로토콜-상대(`//evil.com`)·절대 URL 은 막는다.
// useSearchParams().get 이 이미 디코드하므로 decodeURIComponent 를 추가하면 이중 디코드가 된다.
function resolveRedirect(redirect: string | null): string {
  if (redirect && redirect.startsWith('/') && redirect[1] !== '/' && redirect[1] !== '\\') {
    return redirect;
  }
  return '/dashboard';
}

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
      header={
        <SiteHeader
          onNavigate={(targetId) => {
            // 내비가 가리키는 밴드는 랜딩에만 있다 — 랜딩이 해시를 보고 스크롤한다.
            void navigate(`/#${targetId}`);
          }}
        />
      }
    >
      <LoginForm
        onSuccess={() => {
          void navigate(redirectTo);
        }}
      />
    </AuthLayout>
  );
}
