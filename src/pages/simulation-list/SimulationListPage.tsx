import { SimulationSessionList } from '@features/simulation-list';

export function SimulationListPage() {
  return (
    <div className="flex max-w-270 flex-col gap-5">
      <h1 className="text-title text-ink font-bold">시뮬레이션 목록</h1>
      <SimulationSessionList />
    </div>
  );
}
