import { useNavigate, useSearchParams } from 'react-router';
import { LoginForm } from '@features/auth/ui/LoginForm';

// 오픈 리다이렉트 방지: AuthGuard 가 심은 redirect 파라미터를 그대로 navigate 에 넘기되,
// 동일 출처 절대 경로(`/path`)만 허용한다. `//evil.com`(프로토콜-상대)·절대 URL 은 차단.
// useSearchParams().get 이 이미 URL 디코드를 수행하므로 추가 decodeURIComponent 금지.
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

  // signin.md §3/§6: Auth Split 의 단일 패널 변형 — 브랜드 비주얼 생략, 폼만 중앙 정렬(520px).
  return (
    <div className="bg-bg text-text flex min-h-screen items-center justify-center px-4 py-8">
      <section
        aria-labelledby="login-heading"
        className="border-border bg-bg-elev-1 shadow-2 w-full max-w-[520px] rounded-xl border p-8 md:p-10"
      >
        <h1 id="login-heading" className="font-ui text-title text-text">
          돌아오신 걸 환영합니다
        </h1>
        <div className="mt-6">
          <LoginForm
            onSuccess={() => {
              void navigate(redirectTo);
            }}
          />
        </div>
      </section>
    </div>
  );
}
