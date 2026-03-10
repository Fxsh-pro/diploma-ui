import { useEffect, useState } from "react";
import { Search, Download, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { StatusBadge } from "../components/status-badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import { runsApi } from "../../api/runs";
import type { TestRunResponse, ReportResponse } from "../../api/types";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'STOPPED', 'DONE'];

export function ReportsPage() {
  const [runs, setRuns] = useState<TestRunResponse[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const all = await runsApi.list();
        const finished = all.filter((r) => TERMINAL_STATUSES.includes(r.status));
        // newest first
        finished.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRuns(finished);
        if (finished.length > 0 && !selectedRunId) setSelectedRunId(finished[0].id);
      } catch {
        // silently ignore
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedRunId) { setReport(null); return; }
    setReportLoading(true);
    setReport(null);
    runsApi.report(selectedRunId)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  }, [selectedRunId]);

  const displayed = runs.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter.toUpperCase()) return false;
    if (search && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Отчёты по тестам</h2>
          <p className="text-muted-foreground">Просмотр и анализ результатов нагрузочных тестов</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по ID…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Runs list */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>ID теста</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        Нет завершённых тестов
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayed.map((run) => (
                      <TableRow
                        key={run.id}
                        className={`cursor-pointer ${selectedRunId === run.id ? 'bg-accent/50' : ''}`}
                        onClick={() => setSelectedRunId(run.id)}
                      >
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(run.createdAt)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{run.id.slice(0, 12)}…</TableCell>
                        <TableCell>
                          <StatusBadge
                            status={run.status === 'COMPLETED' || run.status === 'DONE' ? 'completed' : 'failed'}
                          >
                            {run.status === 'COMPLETED' || run.status === 'DONE' ? '✓ OK' : '✗ ' + run.status}
                          </StatusBadge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Report detail panel */}
        <div>
          {reportLoading && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">Загрузка отчёта…</CardContent>
            </Card>
          )}
          {!reportLoading && report && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{report.scenarioName}</CardTitle>
                <p className="text-sm text-muted-foreground font-mono">{report.runId.slice(0, 12)}…</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Метрики</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Длительность:</span>
                      <span className="font-mono font-semibold">{formatDuration(report.durationSeconds)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Всего запросов:</span>
                      <span className="font-mono font-semibold">{report.totalRequests.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg RPS:</span>
                      <span className="font-mono font-semibold">{report.avgRps.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ошибки:</span>
                      <span className={`font-mono font-semibold ${report.errorRate > 0.01 ? 'text-destructive' : 'text-success'}`}>
                        {(report.errorRate * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <h4 className="text-sm font-semibold mb-3">Латентность</h4>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'P50', val: report.latencyP50 },
                      { label: 'P90', val: report.latencyP90 },
                      { label: 'P99', val: report.latencyP99 },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-muted-foreground">{label}:</span>
                        <span className="font-mono font-semibold">{val.toFixed(0)} ms</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-border">
                  <Button className="w-full gap-2">
                    <FileText className="h-4 w-4" />
                    Полный отчёт
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Экспорт
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {!reportLoading && !report && selectedRunId && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Отчёт недоступен для данного теста
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
