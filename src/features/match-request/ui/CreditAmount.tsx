import { Diamond } from 'lucide-react';
import { cn } from '@shared/lib/cn';

type CreditAmountProps = {
  amount: number;
  className?: string;
};

// components.css `.av-credit` — Diamond 라인 아이콘 + tnum 숫자, gap .22em, 아이콘 .82em.
// `◇` 문자 글리프는 Pretendard 에 없어 시스템 폰트로 폴백하며 자간이 깨진다
// (LAYOUT-NUMBERS § 아이콘 매핑 "문자 글리프로 도형을 그리지 않는다").
export function CreditAmount({ amount, className }: CreditAmountProps) {
  return (
    <span className={cn('inline-flex items-center gap-[0.22em]', className)}>
      <Diamond strokeWidth={1.5} aria-hidden="true" className="h-[0.82em] w-[0.82em] shrink-0" />
      <span className="tnum">{amount}</span>
      <span className="sr-only">다이아</span>
    </span>
  );
}
