# Skill · Avating Design System v2

이 Skill은 아바팅 프로젝트의 **확정된 디자인 시스템**을 Claude Code가 빠르게 참조하도록 압축한 버전이다.
상세 규약은 `docs/design-system/01-foundations.md` ~ `07-patterns.md`를, 전체 컨텍스트는 `README.md`를 참조하라.

## 디자인 결정 (변경 금지)

- **톤**: Deep Navy 다크, 관조적/절제된/구조적
- **참조 스타일**: Linear · Vercel
- **브랜드 컬러**: `#5170FF` (Muted Indigo) — 단일 포인트 컬러
- **이모지**: 완전 배제, Lucide SVG 아이콘만 사용

## 필수 체크리스트 — 모든 UI 코드 작성 시

- [ ] 하드코딩된 색상 값 없음 (`text-[#5170FF]` 금지 → `text-brand`)
- [ ] 이모지 없음 (`🚀`, `💫`, `✨` 등)
- [ ] `border-radius` ≤12px (`rounded-xl` 이하)
- [ ] 그라데이션 없음 (`bg-gradient-*` 금지)
- [ ] `box-shadow` 컬러 없음 (focus ring 제외)
- [ ] `animation: float/pulse/glow` 없음
- [ ] `scale(>1.02)` 호버 없음
- [ ] Font Weight ≤600 (700 bold 금지)
- [ ] Italic 없음 (`italic` 클래스 금지)

## 토큰 Quick Reference

### 색상

| 용도 | Tailwind | CSS var |
|------|----------|---------|
| 페이지 배경 | `bg-bg` | `var(--bg)` |
| 카드 표면 | `bg-bg-1` | `var(--bg-elev-1)` |
| 카드 내부 | `bg-bg-2` | `var(--bg-elev-2)` |
| 호버 상태 | `bg-bg-3` | `var(--bg-elev-3)` |
| 테두리 기본 | `border-border` | `var(--border)` |
| 테두리 강조 | `border-border-hi` | `var(--border-hi)` |
| 주요 텍스트 | `text-text` | `var(--text)` |
| 보조 텍스트 | `text-text-2` | `var(--text-2)` |
| 메타 텍스트 | `text-text-3` | `var(--text-3)` |
| 브랜드 포인트 | `text-brand`, `bg-brand` | `var(--brand)` |
| 성공/증가 | `text-success` | `var(--success)` |
| 경고/중간 | `text-warning` | `var(--warning)` |
| 오류/감소 | `text-danger` | `var(--danger)` |

### 타이포그래피 (9개만)

```tsx
<h1 className="font-ui text-display">...</h1>        {/* 32px 페이지 헤드라인 */}
<h2 className="font-ui text-title">...</h2>          {/* 24px 섹션 제목 */}
<h3 className="font-ui text-heading">...</h3>        {/* 16px 카드 제목 */}
<p className="font-ui text-subheading">...</p>       {/* 14px 소제목 */}
<label className="font-ui text-ui-label">...</label> {/* 13px 라벨 */}
<p className="text-body">...</p>                     {/* 14px 본문 */}
<p className="text-body-sm">...</p>                  {/* 12px 보조 */}
<span className="font-mono text-mono-meta">...</span>  {/* 11px 메타 */}
<span className="font-mono text-mono-micro">...</span> {/* 10px 캡션 */}
```

### 간격 (4px 그리드)

`space-1 (4)` · `space-2 (8)` · `space-3 (12)` · `space-4 (16)` · `space-5 (20)` · `space-6 (24)` · `space-8 (32)` · `space-10 (40)` · `space-12 (48)` · `space-16 (64)`

### 모서리 (≤12px만)

- `rounded-sm` (6) — 버튼, 태그, 입력
- `rounded-md` (8) — 카드, 팝오버
- `rounded-lg` (10) — Avatar, 아이콘 컨테이너
- `rounded-xl` (12) — 프레임, 큰 모달
- `rounded-full` — 28px 이하 원형만

## 컴포넌트 Quick Reference

모든 공용 컴포넌트는 `@/shared/components/ui`에서 import.

### Button

```tsx
import { Button } from '@/shared/components/ui';
import { icons } from '@/shared/icons/manifest';

<Button variant="primary" leadingIcon={icons.dispatch}>파견</Button>
<Button variant="secondary" isLoading>저장</Button>
<Button variant="ghost" size="sm">취소</Button>
<Button variant="ghost" size="icon" aria-label="더보기" />
```

한 화면에 `primary` 버튼은 **최대 1개**.

### Input

```tsx
<Input
  label="이메일"
  type="email"
  placeholder="you@example.com"
  helperText="로그인 시 사용"
  errorMessage={errors.email}
/>
```

### Tag

```tsx
<Tag variant="brand">내향 · 분석형</Tag>
<Tag variant="success" leadingIcon={icons.confirm}>인증</Tag>
```

**`r-sm` 고정, pill 형태 금지**.

### AvatarMark

```tsx
<AvatarMark initials="HW" size={32} status="online" />
<AvatarMark initials="SP" size={24} shape="circle" />
```

이니셜 2글자 고정. 28px 초과는 square만.

### StatBar

```tsx
<StatBar label="감성 지수" value={78} icon={icons.sensitivity} />
<StatBar label="호감도" value={64} variant="compact" />
```

### Icon

```tsx
<Icon icon={icons.dispatch} size={16} />
<Icon icon={icons.diamond} size={16} className="text-brand" />
```

Size: 14 / 16 / 20 / 24 만 허용.

### Kbd

```tsx
<Kbd>⌘</Kbd><Kbd>K</Kbd>  {/* 하나의 키 = 하나의 Kbd */}
```

## 레이아웃 패턴

새 화면을 만들 때 아래 7개 중 하나에 해당하는지 먼저 확인:

| 패턴 | 용도 | 핵심 구조 |
|------|------|-----------|
| A · Auth Split | 회원가입/로그인 | 좌 Brand + 우 Form (360px) |
| B · App Shell | 내부 페이지 | 좌 Sidebar(220) + Header(52) + Main |
| C · Wizard | 순차 단계 | Progress + Title + Content + Footer nav |
| D · Split View | 동시 관찰 | 좌 Main + 우 Panel(280) |
| E · Modal | 확인/결제 | Max 480, Header + Body + Actions |
| F · Stats Dashboard | 지표 요약 | 4개 Stat Card grid |
| G · Data List | 다수 항목 | Table 형식 (카드 그리드 지양) |

이 중 어느 것에도 해당하지 않으면 **새 패턴이 정말 필요한지 재검토**.

## Good / Bad 예시

### ❌ Bad — AI스러운 UI

```tsx
// 문제: 그라데이션, 이모지, 과도한 radius, 과장된 카피
<div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 shadow-purple-500/50">
  <h1 className="text-5xl font-bold italic">✨ 운명의 상대를 만났어요! ✨</h1>
  <button className="bg-white text-purple-600 rounded-full px-8 py-4 hover:scale-110">
    🚀 지금 바로 연결하기
  </button>
</div>
```

### ✅ Good — Avating 규약 준수

```tsx
<div className="bg-bg-1 border border-border rounded-xl p-6 shadow-2">
  <span className="inline-flex items-center gap-1.5 text-mono-meta text-success bg-success-soft border border-success-border rounded-sm px-2 py-0.5">
    <Icon icon={icons.confirm} size={14} />
    호감도 임계값 돌파
  </span>
  <h2 className="font-ui text-heading text-text mt-3">본캐 연결 가능</h2>
  <p className="text-body-sm text-text-2 mt-1">
    두 아바타의 최종 호감도 87 · 매칭 성공 확률 상위 12%
  </p>
  <div className="flex gap-2 mt-5">
    <Button variant="secondary" className="flex-1">나중에</Button>
    <Button variant="primary" size="lg" trailingIcon={icons.arrowRight} className="flex-[2]">
      본인 인증 후 연결
    </Button>
  </div>
</div>
```

## 신규 컴포넌트/화면 추가 워크플로우

```
1. /design [화면명] 설계해줘
     └→ design-agent가 design-system/ 참조
          └→ dsd/_template.md 기반으로 DSD 작성
               └→ 사용자 리뷰 → status: approved
                    └→ 2. /dev DSD 기반 구현 요청
                         └→ dev-agent가 implementation/components 재사용
                              └→ 재사용 불가 시 DSD에 신규 컴포넌트 justify
                                   └→ 승인 후 implementation/에 추가
                                        └→ 06-components.md 카탈로그 업데이트
```

**임의로 새 컴포넌트를 만들지 않는다.**

## 금지 사항 요약

| 카테고리 | 금지 |
|----------|------|
| 색상 | 보라 그라데이션, 네온 글로우, 3색 이상 그라데이션 |
| 레이아웃 | Hero+3카드 클리셰, 대각선/비대칭, 떠다니는 요소 |
| 컴포넌트 | 20px+ radius, 글래스모피즘, 1.05+ scale 호버 |
| 타이포그래피 | Italic, Display 폰트, 무지개 텍스트, 700+ weight |
| 카피 | 이모지, "신비로운/마법 같은", 느낌표 남용 |
| 애니메이션 | float, heartbeat, glow, 파티클/컨페티 |
| 아이콘 | Lucide 외 라이브러리, filled(소셜 제외), 그라데이션 |

---

**참고**:
- `docs/design-system/01-foundations.md` — Anti-AI Aesthetics 상세
- `docs/design-system/06-components.md` — 컴포넌트 카탈로그 전체
- `docs/design-system/07-patterns.md` — 레이아웃 패턴 상세
- `reference/avating-design-v2.html` — 시각적 참조 (프로토타입)

이 Skill은 **디자인 시스템의 압축본**이다. 상세 결정이 필요하면 반드시 원 문서를 참조하라.
