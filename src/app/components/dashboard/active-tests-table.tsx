import { useEffect, useState } from "react";
import { Eye, Square } from "lucide-react";
import { Button } from "../ui/button";
import { StatusBadge } from "../status-badge";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { runsApi } from "../../../api/runs";
import { scenariosApi } from "../../../api/scenarios";
import type { TestRunResponse, ScenarioResponse } from "../../../api/types";

const TERMINAL = new Set(['COMPLETED', 'DONE', 'FAILED', 'STOPPED']);

function elapsed(run: TestRunResponse): string {
  if (!run.startedAt) return '—';
  const end = run.finishedAt && TERMINAL.has(run.status)
    ? new Date(run.finishedAt).getTime()
    : Date.now();
  const secs = Math.floor((end - new Date(run.startedAt).getTime()) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

interface ActiveTestsTableProps {
  onView?: (runId: string) => void;
  showAll?: boolean;
  onShowAll?: () => void;
}

function runStatusBadge(status: string) {
  if (status === 'RUNNING') return <StatusBadge status="running">🟣 Running</StatusBadge>;
  if (status === 'PENDING') return <StatusBadge status="warning">⏳ Pending</StatusBadge>;
  if (status === 'COMPLETED' || status === 'DONE') return <StatusBadge status="completed">✓ Completed</StatusBadge>;
  if (status === 'FAILED') return <StatusBadge status="failed">✗ Failed</StatusBadge>;
  if (status === 'STOPPED') return <StatusBadge status="idle">⏹ Stopped</StatusBadge>;
  return <StatusBadge status="idle">{status}</StatusBadge>;
}

export function ActiveTestsTable({ onView, showAll = false, onShowAll }: ActiveTestsTableProps) {
  const [runs, setRuns] = useState<TestRunResponse[]>([]);
  const [scenarios, setScenarios] = useState<Record<string, ScenarioResponse>>({});

  const fetchData = async () => {
    try {
      let fetchedRuns: TestRunResponse[];
      if (showAll) {
        fetchedRuns = await runsApi.list();
        fetchedRuns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        const [active, pending] = await Promise.all([
          runsApi.list('RUNNING'),
          runsApi.list('PENDING'),
        ]);
        fetchedRuns = [...active, ...pending];
      }
      const allScenarios = await scenariosApi.list();
      setRuns(fetchedRuns);
      const map: Record<string, ScenarioResponse> = {};
      allScenarios.forEach((s) => { map[s.id] = s; });
      setScenarios(map);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 10_000);
    return () => clearInterval(id);
  }, []);

  const handleStop = async (runId: string) => {
    await runsApi.stop(runId).catch(() => {});
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{showAll ? 'Все тесты' : 'Выполняемые тесты'}</h3>
        {!showAll && <Button variant="link" className="text-sm" onClick={onShowAll}>Показать все</Button>}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID теста</TableHead>
              <TableHead>Сценарий</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Длительность</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {showAll ? 'Нет тестов' : 'Нет активных тестов'}
                </TableCell>
              </TableRow>
            ) : (
              runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-mono text-sm">{run.id.slice(0, 8)}…</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {scenarios[run.scenarioId]?.name ?? run.scenarioId.slice(0, 8) + '…'}
                    </Badge>
                  </TableCell>
                  <TableCell>{runStatusBadge(run.status)}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground font-mono text-sm">{elapsed(run)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onView?.(run.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!TERMINAL.has(run.status) && (
                        <Button variant="ghost" size="icon" onClick={() => handleStop(run.id)}>
                          <Square className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
