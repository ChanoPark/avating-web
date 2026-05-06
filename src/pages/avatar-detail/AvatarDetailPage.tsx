import { useState } from 'react';
import { useParams } from 'react-router';
import { Button } from '@shared/ui/Button';
import { MatchRequestModal, type PartnerAvatarSummary } from '@features/match-request';

const placeholderPartner: PartnerAvatarSummary = {
  initials: 'MN',
  name: 'Moonlit Narrator',
  handle: '@moonlit',
  type: '내향·낭만형',
  verified: true,
  status: 'online',
  tags: ['독립서점', '심야 카페'],
};

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
