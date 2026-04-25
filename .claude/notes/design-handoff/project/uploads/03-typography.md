# 03 · Typography

## 폰트 패밀리

3종 고정. 이 외의 폰트는 추가하지 않는다.

| 역할 | 폰트 | 용도 |
|------|------|------|
| UI | **Inter Tight** | 버튼, 라벨, 제목, 네비게이션 (압축된 모던 sans) |
| Body | **Inter** | 본문, 문단 텍스트 |
| Mono | **JetBrains Mono** | 메타 정보, 타임스탬프, 코드, 수치 |

```css
--font-ui:   'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif;
--font-text: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
```

### 한국어 폰트

Inter/Inter Tight는 한국어를 지원하지 않으므로 시스템 폰트가 fallback된다.
**Phase 1에서는 fallback만 사용**하되, 한국어 비중이 높아질 경우 Phase 2에 `Pretendard Variable` 추가 검토.

## 타입 스케일

8개 스타일만 정의. 이 외의 조합은 만들지 않는다.

### 스케일 표

| 이름 | 폰트 | Weight | Size / Line-height | Letter-spacing | 용도 |
|------|------|--------|-------------------|----------------|------|
| `display` | Inter Tight | 600 | 32 / 1.15 | -1px | 히어로 헤드라인 (회원가입 페이지 등) |
| `title` | Inter Tight | 600 | 24 / 1.3 | -0.5px | 섹션 대제목, 모달 타이틀 |
| `heading` | Inter Tight | 600 | 16 / 1.4 | -0.2px | 카드 제목, 리스트 타이틀 |
| `subheading` | Inter Tight | 500 | 14 / 1.4 | -0.1px | 소제목, 강조 본문 |
| `ui-label` | Inter Tight | 500 | 13 / 1.5 | -0.1px | 버튼, 입력 라벨 |
| `body` | Inter | 400 | 14 / 1.5 | 0 | 본문 기본 |
| `body-sm` | Inter | 400 | 12 / 1.5 | 0 | 카드 설명, 보조 본문 |
| `mono-meta` | JetBrains Mono | 400 | 11 / 1.4 | 0 | 타임스탬프, 메타 정보 |
| `mono-micro` | JetBrains Mono | 400 | 10 / 1.4 | 0.5px | 섹션 레이블, 캡션 |

## Tailwind 매핑

```ts
// tailwind.config.ts
fontSize: {
  'display':    ['2rem',     { lineHeight: '1.15', letterSpacing: '-0.0625em', fontWeight: '600' }],
  'title':      ['1.5rem',   { lineHeight: '1.3',  letterSpacing: '-0.021em',  fontWeight: '600' }],
  'heading':    ['1rem',     { lineHeight: '1.4',  letterSpacing: '-0.0125em', fontWeight: '600' }],
  'subheading': ['0.875rem', { lineHeight: '1.4',  letterSpacing: '-0.007em',  fontWeight: '500' }],
  'ui-label':   ['0.8125rem',{ lineHeight: '1.5',  letterSpacing: '-0.007em',  fontWeight: '500' }],
  'body':       ['0.875rem', { lineHeight: '1.5' }],
  'body-sm':    ['0.75rem',  { lineHeight: '1.5' }],
  'mono-meta':  ['0.6875rem',{ lineHeight: '1.4' }],
  'mono-micro': ['0.625rem', { lineHeight: '1.4', letterSpacing: '0.05em' }],
}
```

## 사용 규칙

### Weight 제약

- **600(Semibold)**: UI 제목, 강조 (display, title, heading)
- **500(Medium)**: 라벨, 버튼, 소제목
- **400(Regular)**: 본문, 메타

**Bold(700) 이상은 사용하지 않는다.** Weight 대비만으로도 충분한 위계를 만든다.

### Letter-spacing 제약

- Display/Title은 반드시 **음수 letter-spacing** (압축감)
- Body는 letter-spacing 조정 없음 (0)
- Mono-micro만 **양수 letter-spacing** (캡션 가독성)

### 색상 조합 (권장)

| 스타일 | 기본 색상 |
|--------|-----------|
| display, title | `--text` |
| heading, subheading | `--text` |
| ui-label | `--text` or `--text-2` |
| body | `--text-2` |
| body-sm | `--text-2` or `--text-3` |
| mono-meta, mono-micro | `--text-3` |

## 금지 사항

- ❌ **이탤릭** (`font-style: italic`) — Serif의 잔재
- ❌ **Underline 장식** — 링크는 색상으로만 구분 (`text-decoration: none`이 기본)
- ❌ **Text shadow** — 그림자로 텍스트 강조 금지
- ❌ **Gradient text** — `background-clip: text`로 다색 텍스트 금지
- ❌ **모든 글자 대문자 변환** — `text-transform: uppercase`는 `mono-micro` 레이블에만 허용
- ❌ **Drop cap, 이니셜 확대** — 신문 스타일 장식 금지

## 예시

### 회원가입 페이지 헤드라인

```tsx
<h1 className="text-display text-[var(--text)]">
  연애의 긴장은 아바타가, 결정은 당신이.
</h1>
<p className="text-body text-[var(--text-2)] mt-4">
  AI 대리인을 소개팅에 파견하고, 관전하고, 결정적인 순간에만 개입하세요.
</p>
```

### 대시보드 Stats 카드

```tsx
<div className="bg-[var(--bg-elev-2)] p-4 rounded-md">
  <div className="font-mono text-mono-meta text-[var(--text-3)] uppercase tracking-wider">
    총 파견 횟수
  </div>
  <div className="text-title text-[var(--text)] mt-1">47</div>
  <div className="font-mono text-mono-meta text-[var(--success)] mt-1">
    +8 지난주 대비
  </div>
</div>
```

### 메시지 버블

```tsx
<div>
  <div className="font-mono text-mono-meta text-[var(--text-3)] mb-1">
    spring · 14:25
  </div>
  <div className="text-body text-[var(--text)]">
    서촌 골목길 좋아하시는군요.
  </div>
</div>
```
