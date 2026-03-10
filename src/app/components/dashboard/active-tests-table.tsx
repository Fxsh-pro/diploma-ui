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

function elapsed(startedAt: string | null): string {
  if (!startedAt) return '—';
  const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

interface ActiveTestsTableProps {
  onView?: (runId: string) => void;
}

export function ActiveTestsTable({ onView }: ActiveTestsTableProps) {
  const [runs, setRuns] = useState<TestRunResponse[]>([]);
  const [scenarios, setScenarios] = useState<Record<string, ScenarioResponse>>({});

  const fetchData = async () => {
    try {
      const [active, pending, allScenarios] = await Promise.all([
        runsApi.list('RUNNING'),
        runsApi.list('PENDING'),
        scenariosApi.list(),
      ]);
      setRuns([...active, ...pending]);
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
        <h3 className="text-lg font-semibold">Выполняемые тесты</h3>
        <Button variant="link" className="text-sm">Показать все</Button>
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
                  Нет активных тестов
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
                  <TableCell>
                    <StatusBadge status={run.status === 'RUNNING' ? 'running' : 'warning'}>
                      {run.status === 'RUNNING' ? '🟣 Running' : '⏳ Pending'}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground font-mono text-sm">{elapsed(run.startedAt)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onView?.(run.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleStop(run.id)}>
                        <Square className="h-4 w-4" />
                      </Button>
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
