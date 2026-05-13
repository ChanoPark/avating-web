import { LoginForm } from '@features/auth/ui/LoginForm';

export function LoginPage() {
  return (
    <div className="bg-bg text-text flex min-h-screen items-center justify-center px-4 py-8">
      <div className="border-border bg-bg-elev-1 grid w-full max-w-[960px] overflow-hidden rounded-xl border md:grid-cols-[1.4fr_1fr]">
        <aside
          aria-label="브랜드 소개"
          className="border-border bg-bg-elev-1 flex flex-col justify-center gap-5 border-b p-8 md:border-r md:border-b-0 md:p-10"
        >
          <span className="font-ui text-heading text-brand select-none">Avating</span>

          <h2 className="font-ui text-title text-text whitespace-pre-line select-none">
            {'귀찮은 밀당은 아바타가,\n결정은 당신이.'}
          </h2>
          <p className="text-body-sm text-text-2 whitespace-pre-line select-none">
            {'AI 아바타를 소개팅에 매칭하고, 관전하고,\n결정적인 순간에만 개입하세요.'}
          </p>
        </aside>

        <section aria-labelledby="login-heading" className="bg-bg-elev-1 p-8 md:p-10">
          <h1 id="login-heading" className="font-ui text-heading text-text mb-6">
            로그인
          </h1>
          <LoginForm />
        </section>
      </div>
    </div>
  );
}
