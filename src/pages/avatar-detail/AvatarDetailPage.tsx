import { useState } from 'react';
import { useParams } from 'react-router';
import { Button } from '@shared/ui/Button';
import { MatchRequestModal } from '@features/match-request';
import { placeholderPartner } from './fixtures';

// docs/spec/match-request.md §4.1 의 CTA 가드(차단/탈퇴/이미 요청 보냄)와 §4.4 의
// WAITING 상태 전이는 GET /api/avatars/:id 와 MemberStatus 스토어가 도입된 뒤 후속 PR 에서 연결.
// 본 PR 은 모달 트리거만 placeholder 페이지에 부착한다.
export function AvatarDetailPage() {
  const { id = 'avatar-1' } = useParams<{ id: string }>();
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <section className="flex flex-col gap-4 p-6">
      <header>
        <h1 className="font-ui text-title text-text">아바타 상세</h1>
        <p className="text-body-sm text-text-2 mt-1">
          {placeholderPartner.handle} · {placeholderPartner.type}
        </p>
      </header>
      <Button
        type="button"
        variant="primary"
        onClick={() => {
          setRequestOpen(true);
        }}
        aria-haspopup="dialog"
      >
        매칭 요청
      </Button>
      <MatchRequestModal
        open={requestOpen}
        partnerAvatarId={id}
        partner={placeholderPartner}
        onClose={() => {
          setRequestOpen(false);
        }}
      />
    </section>
  );
}
