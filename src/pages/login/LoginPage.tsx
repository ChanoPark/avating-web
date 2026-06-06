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

  return (
    <div className="bg-bg text-text flex min-h-screen items-center justify-center px-4 py-8">
      <div className="border-border bg-bg-elev-1 grid w-full max-w-[960px] overflow-hidden rounded-xl border md:grid-cols-[1.4fr_1fr]">
        <aside
          aria-label="브랜드 소개"
          className="border-border bg-bg-elev-1 flex flex-col justify-center gap-5 border-b p-8 md:border-r md:border-b-0 md:p-10"
        >
          <span className="font-ui text-heading text-brand select-none">Avating</span>

          <div className="font-ui text-title text-text whitespace-pre-line select-none">
            {'귀찮은 밀당은 아바타가,\n결정은 당신이.'}
          </div>
          <p className="text-body-sm text-text-2 whitespace-pre-line select-none">
            {'AI 아바타를 소개팅에 매칭하고, 관전하고,\n결정적인 순간에만 개입하세요.'}
          </p>
        </aside>

        <section aria-labelledby="login-heading" className="bg-bg-elev-1 p-8 md:p-10">
          <h1 id="login-heading" className="font-ui text-heading text-text mb-6">
            로그인
          </h1>
          <LoginForm
            onSuccess={() => {
              void navigate(redirectTo);
            }}
          />
        </section>
      </div>
    </div>
  );
}
