import { useNavigate } from 'react-router';
import { AvatarList } from '@features/dashboard/ui/AvatarList';

export function ExplorePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-title text-ink font-bold">둘러보기</h1>
        <p className="text-meta text-secondary">공개된 아바타 중에서 무작위로 골라 보여줘요</p>
      </div>
      <AvatarList
        onAvatarClick={(id) => {
          void navigate(`/avatars/${id}`);
        }}
      />
    </div>
  );
}
