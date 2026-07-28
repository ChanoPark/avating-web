import type { LucideIcon } from 'lucide-react';
import { Button } from '@shared/ui/Button';

type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
};

// 빈 상태 공용 패턴 (empty-states-and-errors §2): 아이콘 24px + 제목 + 설명 + 선택 ghost CTA, 수직 패딩 48px.
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon size={24} strokeWidth={1.5} className="text-ink-mute" aria-hidden="true" />
      <p className="text-body-sm text-ink-secondary mt-3">{title}</p>
      {description !== undefined && (
        <p className="text-caption text-ink-mute mt-1">{description}</p>
      )}
      {action && (
        <Button variant="ghost" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
