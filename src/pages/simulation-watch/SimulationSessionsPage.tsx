import { WatchSessionList } from '@features/simulation-watch';

export function SimulationSessionsPage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-7">
      <div className="flex max-w-270 flex-col gap-5">
        <h1 className="text-title text-ink font-bold">시뮬레이션</h1>
        <WatchSessionList />
      </div>
    </div>
  );
}
