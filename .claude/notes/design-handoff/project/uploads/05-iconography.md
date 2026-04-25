# 05 · Iconography

## 원칙

- **Lucide React 전용**: 다른 아이콘 라이브러리 혼용 금지
- **이모지 완전 배제**: UI 어디에도 이모지 사용하지 않는다
- **4가지 크기만**: 14 / 16 / 20 / 24 px
- **Stroke 1.5 고정**: Lucide 기본값 유지
- **색상은 currentColor**: 부모 텍스트 색상 상속

## 라이브러리

```bash
pnpm add lucide-react
```

```tsx
import { Heart, Send, Eye, Lock } from 'lucide-react';
```

## 크기 규칙

| 컨텍스트 | 크기 | 예시 |
|----------|------|------|
| Inline with body text | `14` | 본문 안의 체크 아이콘 |
| **Default (대부분)** | `16` | 버튼, 라벨, 리스트 아이템 |
| Emphasized | `20` | 상태 표시, 큰 버튼 |
| Feature | `24` | 온보딩 일러스트, 빈 상태 |

**15, 17, 18, 22px 같은 중간값 사용 금지.**

## 색상 규칙

### 기본 원칙

아이콘은 **스스로 색상을 가지지 않는다**. 부모 텍스트 색상을 상속한다.

```tsx
<Icon size={16} />  // currentColor (부모 color 상속)
```

### 컨텍스트별 색상

| 상황 | 색상 |
|------|------|
| 비활성/보조 아이콘 | `--text-3` |
| 활성/기본 아이콘 | `--text` or `--text-2` |
| 브랜드 강조 | `--brand` |
| 성공 상태 | `--success` |
| 경고 상태 | `--warning` |
| 오류 상태 | `--danger` |

### 금지

- ❌ **아이콘 그라데이션** — `<svg fill="url(#gradient)">`
- ❌ **Filled 아이콘 사용** (Heart가 채워진 상태로 표시 등) — 소셜 로고(Google/Apple/GitHub) 외 모든 아이콘은 stroke
- ❌ **아이콘 box-shadow** 추가
- ❌ **아이콘 단독 애니메이션** — 스피너, 로딩 제외

## 아바팅 프로젝트 공식 아이콘 매핑

기능별로 **아이콘을 고정**한다. 같은 기능에 다른 아이콘 사용 금지.

### 내비게이션

| 기능 | Lucide 아이콘 |
|------|--------------|
| 대시보드 | `Activity` |
| 아바타 탐색 | `Compass` |
| 관전 중 | `Eye` |
| 매칭 | `Heart` |
| 메시지 | `MessageSquare` |
| 설정 | `Settings` |
| 알림 | `Bell` |
| 검색 | `Search` |
| 사용자 프로필 | `User` |
| 로그아웃 | `LogOut` |

### 액션

| 기능 | Lucide 아이콘 |
|------|--------------|
| 파견하기 (Send) | `Send` |
| 개입/훈수 (Zap) | `Zap` |
| 본캐 연결 | `Link` |
| 관전하기 | `Eye` |
| 복사 | `Copy` |
| 붙여넣기 | `Clipboard` |
| 확인 | `Check` |
| 취소/닫기 | `X` |
| 더보기 | `MoreHorizontal` |
| 필터 | `ListFilter` or `Filter` |
| 정렬 | `ArrowUpDown` |

### 상태/정보

| 기능 | Lucide 아이콘 |
|------|--------------|
| 호감도 | `Heart` |
| 다이아 (재화) | `Gem` |
| 턴/시간 | `Clock` |
| 증가 추세 | `TrendingUp` |
| 감소 추세 | `TrendingDown` |
| 경고 | `AlertTriangle` |
| 정보 | `Info` |
| 잠금 (Blind text) | `Lock` |
| 해제 | `Unlock` |
| 암호 숨김 | `EyeOff` |

### 성향/태그 (Avatar)

| 기능 | Lucide 아이콘 |
|------|--------------|
| 외향성 | `Users` |
| 감성 | `Heart` (반복 사용 OK — 의미론이 명확하면) |
| 적극성 | `Flame` |
| 스타일 | `Compass` |
| 내향 | `Moon` |
| 에너지 | `Sparkles` |

## 컴포넌트 구현

### Icon 래퍼 컴포넌트 (권장)

```tsx
// src/shared/components/ui/Icon.tsx
import type { LucideIcon } from 'lucide-react';

interface IconProps {
  icon: LucideIcon;
  size?: 14 | 16 | 20 | 24;
  className?: string;
}

export function Icon({ icon: LucideComponent, size = 16, className }: IconProps) {
  return (
    <LucideComponent
      size={size}
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    />
  );
}
```

### 사용 예시

```tsx
import { Send, Heart, Zap } from 'lucide-react';
import { Icon } from '@/shared/components/ui';

// 버튼 안에서
<button className="btn">
  <Icon icon={Send} size={16} />
  파견
</button>

// 스탯바 레이블
<div className="flex items-center gap-2 text-[var(--text-2)]">
  <Icon icon={Heart} size={16} />
  <span>감성 지수</span>
</div>

// 시스템 메시지
<div className="flex items-center gap-2 text-[var(--warning)]">
  <Icon icon={Zap} size={16} />
  이벤트 주입 — 공통 관심사 발견
</div>
```

## 소셜/외부 브랜드 아이콘 예외

다음의 경우에만 `fill` 스타일 아이콘을 허용한다.

- Google 로그인 버튼 (공식 브랜드 컬러)
- Apple 로그인 버튼 (공식 브랜드 컬러 또는 monochrome)
- GitHub 로그인 버튼
- 서비스 연동 로고 (ChatGPT 등)

이 경우 **공식 브랜드 가이드**를 따르며, Lucide 외 라이브러리 또는 직접 SVG를 삽입한다.

## 아이콘 접근성

- `aria-hidden="true"` 기본 (텍스트와 함께 사용 시)
- 아이콘만 있는 버튼은 `aria-label` 필수
- 데코레이션 아이콘은 **텍스트를 대체하지 않는다** (단순히 시각적 강조만)

```tsx
{/* ✅ 텍스트 있는 버튼: aria-hidden */}
<button>
  <Send size={16} aria-hidden="true" />
  파견
</button>

{/* ✅ 아이콘만 있는 버튼: aria-label */}
<button aria-label="더 많은 옵션">
  <MoreHorizontal size={16} />
</button>

{/* ❌ 잘못된 사용: 의미 있는 정보를 아이콘만으로 전달 */}
<button>
  <Trash2 size={16} />  {/* 사용자는 이것이 삭제인지 모를 수 있음 */}
</button>
```
