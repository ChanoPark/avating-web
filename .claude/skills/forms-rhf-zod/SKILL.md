---
name: forms-rhf-zod
description: React Hook Form + Zod — 스키마 단일화, 서버 에러 매핑, 접근성, 위저드 폼, 파일 업로드, 결제 입력 위임
version: 2.0.0
source:
  - CLAUDE.md#기술-스택(폼-검증)
  - CLAUDE.md#개발-규칙
scope: avating-web
authority: MUST
maintainer: frontend-core
---

# React Hook Form + Zod — Production Forms

## 1. 철학

1. **스키마가 진실이다** — 타입 + 검증 + 폼 필드 초기값이 모두 동일한 Zod 스키마에서 파생.
2. **비제어 기본** — RHF 의 `register` 로 DOM 에 위임. 제어(`Controller`) 는 커스텀 UI 필요 시만.
3. **경계 검증** — `handleSubmit` 에서 Zod 로 한 번, HTTP 레이어에서 다시 한 번(→ `data-tanstack-axios-zod`).
4. **접근성 기본** — label/aria/error 연결은 공통 Field 컴포넌트로 고정.

## 2. Install

```bash
pnpm add react-hook-form zod @hookform/resolvers
```

## 3. 공용 Field 컴포넌트 — 접근성 고정

```tsx
// src/shared/ui/Form/Field.tsx
import { useId } from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@shared/lib/cn';

interface FieldProps {
  name: string;
  label: string;
  hint?: string;
  children: (props: {
    id: string;
    describedBy: string;
    invalid: boolean;
  }) => React.ReactNode;
}

export const Field = ({ name, label, hint, children }: FieldProps) => {
  const id = useId();
  const { formState: { errors } } = useFormContext();
  const err = errors[name];
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const invalid = Boolean(err);

  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children({ id, describedBy: cn(hint && hintId, err && errId), invalid })}
      {hint && !err && <p id={hintId} className="text-xs text-foreground-muted">{hint}</p>}
      {err && <p id={errId} role="alert" className="text-xs text-danger">{String(err.message)}</p>}
    </div>
  );
};
```

## 4. 기본 폼 — 회원 닉네임 변경

```tsx
// src/features/profile/ui/NicknameForm.tsx
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field } from '@shared/ui/Form/Field';
import { Button } from '@shared/ui/Button';
import { useUpdateNickname } from '@features/profile/api';

const Schema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, '닉네임은 2자 이상')
    .max(24, '최대 24자')
    .regex(/^[가-힣a-zA-Z0-9_]+$/, '한글·영문·숫자·_ 만 허용'),
});
type FormValues = z.input<typeof Schema>;
type FormOut    = z.output<typeof Schema>;

export const NicknameForm = ({ initial }: { initial: string }) => {
  const mutation = useUpdateNickname();

  const methods = useForm<FormValues, unknown, FormOut>({
    resolver: zodResolver(Schema),
    mode: 'onBlur',
    defaultValues: { nickname: initial },
  });
  const { register, handleSubmit, setError, formState: { isSubmitting, isDirty } } = methods;

  const onSubmit = handleSubmit(async (values) => {
    const parsed = Schema.parse(values); // 최종 방어
    try {
      await mutation.mutateAsync(parsed);
    } catch (err) {
      // 서버 사이드 검증 → 필드 에러 매핑
      if (isNicknameDuplicateError(err)) {
        setError('nickname', { type: 'server', message: '이미 사용 중인 닉네임입니다.' });
      } else { throw err; }
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <Field name="nickname" label="닉네임" hint="2~24자, 한글/영문/숫자/_ 가능">
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              aria-invalid={invalid}
              aria-describedby={describedBy || undefined}
              autoComplete="nickname"
              {...register('nickname')}
              className="h-10 rounded-md border px-3"
            />
          )}
        </Field>
        <Button type="submit" disabled={isSubmitting || !isDirty}>저장</Button>
      </form>
    </FormProvider>
  );
};
```

## 5. 스키마 위치 & 재사용

- **도메인 스키마는 `entities/<domain>/model.ts`** — API 응답/요청과 공유.
- **폼 전용 스키마는 `features/<feature>/model/<form>.ts`** — UI 제약(trim, 문자 집합, 필수) 추가.
- `z.output<T>` 을 API 요청 타입과 일치시켜 **변환(transform) 결과 그대로 송신**.

```ts
// features/profile/model/nickname.ts
import { Nickname } from '@entities/member/model';
export const NicknameForm = z.object({ nickname: Nickname });
```

## 6. 서버 에러 매핑 규약

서버 에러 `{ code, message, details: { field?: string } }` 를 받아 **필드 에러로 매핑**:

```ts
const mapServerErrors = (err: unknown, setError: UseFormSetError<FormValues>) => {
  if (!isAppError(err)) return false;
  const field = (err.details?.field ?? null) as keyof FormValues | null;
  if (field) {
    setError(field, { type: 'server', message: err.message });
    return true;
  }
  return false;
};
```

- **Unknown 에러는 throw** → ErrorBoundary / 전역 토스트.
- **서버 에러 코드 → 한국어 메시지 매핑 테이블** 을 features 에 두어 화면별로 톤 조절.

## 7. 위저드(Step) 폼

온보딩, 결제 전처럼 여러 단계가 필요한 폼.

```ts
// 단계별 부분 스키마
const Step1 = z.object({ gender: z.enum(['F','M','X']) });
const Step2 = z.object({ birthYear: z.number().int().min(1920).max(2010) });
const Step3 = z.object({ personaTags: z.array(z.string()).min(3).max(10) });

export const OnboardingSchema = Step1.and(Step2).and(Step3);
type OnboardingForm = z.infer<typeof OnboardingSchema>;
```

- 전 단계 값은 `useForm` 하나로 공유(루트 provider).
- 각 스텝 컴포넌트는 자신의 필드만 `register`.
- 스텝 이동 시 **해당 스텝 서브 스키마** `safeParse` 로 검증.
- 마지막 제출 시 전체 `OnboardingSchema.parse`.

## 8. 파일/이미지 업로드

```ts
const AvatarImage = z
  .instanceof(File)
  .refine((f) => ['image/png', 'image/jpeg', 'image/webp'].includes(f.type), '이미지만 가능')
  .refine((f) => f.size <= 5 * 1024 * 1024, '5MB 이하');

const ProfileImageForm = z.object({ image: AvatarImage });
```

- 업로드는 **서버 서명 URL** 기반 PUT 이 기본(직접 S3 PUT). 서명 API 는 백엔드.
- `Controller` 로 제어 컴포넌트(드래그앤드롭) 구성.

## 9. 숫자 / 날짜 / 통화

- **숫자 입력**: `z.coerce.number()` — input 은 항상 문자열.
- **날짜**: `z.coerce.date()` 또는 `z.iso.datetime()`.
- **한국 원화**: `z.number().int().nonnegative().brand<'KRW'>()`. 입력 UI 는 `Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })` 로 표시 포맷.

## 10. 접근성 체크리스트

- [ ] 모든 input 에 `<label htmlFor>` 연결.
- [ ] 에러는 `role="alert"` + `aria-describedby`.
- [ ] `aria-invalid` 상태 바인딩.
- [ ] 제출 중 `disabled` + 스피너(aria-busy).
- [ ] `autoComplete` 값 지정 (`nickname`, `email`, `new-password`, `one-time-code`, `cc-number`…).
- [ ] 키보드 만으로 이동/제출 가능, 포커스 링 보임.
- [ ] IME 고려 — 한글 입력 중 검증은 `mode: 'onBlur'` 기본.

## 11. 결제/민감 입력

- **카드번호/CVC** 직접 입력받지 않음 — 토스페이먼츠/포트원 위젯(iframe) 으로 위임.
- RHF 는 결제 요청에 필요한 **주문 메타(금액, 상품, 배송지)** 만 수집.
- 실패 메시지에 서버 원문(내부 코드) 노출 금지 — 사용자 친화 메시지로 치환.

## 12. 성능

- 큰 폼은 **`FormProvider` + 하위 컴포넌트로 분할**, `useController` / `useWatch` 로 개별 필드만 리렌더.
- 기본은 `shouldUnregister: false` — 동적 필드 추가/삭제 시 값 유지.
- `mode: 'onBlur'` 기본, 안내가 중요한 필드만 `onChange` 로 상향.

## 13. 테스트

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NicknameForm } from './NicknameForm';

test('닉네임 검증 + 제출', async () => {
  render(<NicknameForm initial="" />);
  const input = screen.getByLabelText('닉네임');
  await userEvent.type(input, '일'); // 1자
  await userEvent.tab();
  expect(await screen.findByRole('alert')).toHaveTextContent('2자 이상');

  await userEvent.clear(input);
  await userEvent.type(input, '홍길동');
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  // MSW 핸들러로 201 응답 검증
});
```

- MSW 로 서버 응답/에러 시나리오 각각 테스트.
- Playwright 로 **키보드 전용 흐름** E2E 1개 이상.

## 14. 안티패턴

- `useState` 로 각 필드 상태 관리 — RHF 로 전환.
- 스키마 없는 폼 제출 — resolver 필수.
- `reset()` 없이 성공 후 UI 만 수동 초기화.
- 에러 메시지를 스타일 class 로만 전달 — alert 역할 누락.
- `Controller` 남발 — `register` 로 충분한 곳은 비제어 유지.
- 결제 카드번호 수기 입력.

## 15. References

- [React Hook Form docs](https://react-hook-form.com/)
- [@hookform/resolvers zod](https://github.com/react-hook-form/resolvers#zod)
- [Zod docs](https://zod.dev)
- [web.dev — Sign-in form best practices](https://web.dev/articles/sign-in-form-best-practices)
- 내부: [data-tanstack-axios-zod](../data-tanstack-axios-zod/SKILL.md), [styling-tailwind-motion](../styling-tailwind-motion/SKILL.md)
