import { useEffect, useState } from "react";
import { Search, Download, FileText, RotateCcw, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { runsApi } from "../../api/runs";
import type { TestRunResponse, ReportResponse, RunComparisonResponse, MetricPointResponse } from "../../api/types";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'STOPPED', 'DONE'];

// ── Delta helpers ─────────────────────────────────────────────────────────────

function pct(current: number, baseline: number): number {
  if (baseline === 0) return 0;
  return ((current - baseline) / baseline) * 100;
}

type DeltaDir = 'better' | 'worse' | 'neutral';

function DeltaBadge({ current, baseline, higherIsBetter = false }: {
  current: number; baseline: number; higherIsBetter?: boolean;
}) {
  const diff = current - baseline;
  const p = pct(current, baseline);
  if (Math.abs(p) < 0.5) return <span className="text-muted-foreground text-xs">—</span>;
  const improved = higherIsBetter ? diff > 0 : diff < 0;
  const color = improved ? 'text-success' : 'text-destructive';
  const Icon = diff > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      <Icon className="h-3 w-3" />
      {diff > 0 ? '+' : ''}{p.toFixed(1)}%
    </span>
  );
}

// ── Comparison charts ─────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    fontSize: '12px',
  },
};

interface CmpPoint {
  t: number; // seconds since start
  cur_rps?: number;
  base_rps?: number;
  cur_p50?: number;  cur_p90?: number;  cur_p99?: number;
  base_p50?: number; base_p90?: number; base_p99?: number;
  cur_err?: number;
  base_err?: number;
}

function mergeMetrics(
  curPoints: MetricPointResponse[], curStart: string,
  basePoints: MetricPointResponse[], baseStart: string,
): CmpPoint[] {
  const toSec = (iso: string, startIso: string) =>
    Math.round((new Date(iso).getTime() - new Date(startIso).getTime()) / 1000);

  const map = new Map<number, CmpPoint>();
  for (const p of curPoints) {
    const t = toSec(p.time, curStart);
    map.set(t, {
      t,
      cur_rps: +p.rps.toFixed(1),
      cur_p50: +p.latencyP50.toFixed(0),
      cur_p90: +p.latencyP90.toFixed(0),
      cur_p99: +p.latencyP99.toFixed(0),
      cur_err: +(p.errorRate * 100).toFixed(2),
    });
  }
  for (const p of basePoints) {
    const t = toSec(p.time, baseStart);
    const existing = map.get(t) ?? { t };
    map.set(t, {
      ...existing,
      base_rps: +p.rps.toFixed(1),
      base_p50: +p.latencyP50.toFixed(0),
      base_p90: +p.latencyP90.toFixed(0),
      base_p99: +p.latencyP99.toFixed(0),
      base_err: +(p.errorRate * 100).toFixed(2),
    });
  }
  return Array.from(map.values()).sort((a, b) => a.t - b.t);
}

function ComparisonCharts({ currentRun, baselineRun }: {
  currentRun: TestRunResponse;
  baselineRun: TestRunResponse;
}) {
  const [data, setData] = useState<CmpPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentRun.startedAt || !baselineRun.startedAt) { setLoading(false); return; }
    const fetchBoth = async () => {
      try {
        const [curMetrics, baseMetrics] = await Promise.all([
          runsApi.metrics(
            currentRun.id,
            currentRun.startedAt!,
            currentRun.finishedAt ?? new Date().toISOString(),
            30,
          ),
          runsApi.metrics(
            baselineRun.id,
            baselineRun.startedAt!,
            baselineRun.finishedAt ?? new Date().toISOString(),
            30,
          ),
        ]);
        setData(mergeMetrics(curMetrics, currentRun.startedAt!, baseMetrics, baselineRun.startedAt!));
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    };
    fetchBoth();
  }, [currentRun.id, baselineRun.id]);

  if (loading) return <p className="text-xs text-muted-foreground py-2">Загрузка графиков…</p>;
  if (data.length === 0) return <p className="text-xs text-muted-foreground py-2">Нет данных для графиков</p>;

  const xFmt = (v: number) => `${v}s`;

  const charts = [
    {
      title: 'RPS',
      lines: [
        { key: 'cur_rps',  name: 'Current',  color: 'var(--color-primary)',  dashed: false },
        { key: 'base_rps', name: 'Baseline', color: 'var(--color-muted-foreground)', dashed: true },
      ],
      unit: '',
    },
    {
      title: 'Латентность (ms)',
      lines: [
        { key: 'cur_p99',  name: 'P99 cur',  color: '#ef4444', dashed: false },
        { key: 'base_p99', name: 'P99 base', color: '#ef4444', dashed: true },
        { key: 'cur_p90',  name: 'P90 cur',  color: '#f97316', dashed: false },
        { key: 'base_p90', name: 'P90 base', color: '#f97316', dashed: true },
        { key: 'cur_p50',  name: 'P50 cur',  color: '#22c55e', dashed: false },
        { key: 'base_p50', name: 'P50 base', color: '#22c55e', dashed: true },
      ],
      unit: 'ms',
    },
    {
      title: 'Ошибки (%)',
      lines: [
        { key: 'cur_err',  name: 'Current',  color: '#ef4444', dashed: false },
        { key: 'base_err', name: 'Baseline', color: '#f97316', dashed: true },
      ],
      unit: '%',
    },
  ] as const;

  return (
    <div className="space-y-4">
      {charts.map(({ title, lines, unit }) => (
        <div key={title}>
          <p className="text-xs font-semibold text-muted-foreground mb-1">{title}</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="t" tickFormatter={xFmt} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit={unit} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}${unit}`, undefined]} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              {lines.map(({ key, name, color, dashed }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={name}
                  stroke={color}
                  strokeWidth={dashed ? 1.5 : 2}
                  strokeDasharray={dashed ? '4 3' : undefined}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}

// ── Comparison table ──────────────────────────────────────────────────────────

function ComparisonTable({ cmp }: { cmp: RunComparisonResponse }) {
  const { current: c, baseline: b } = cmp;
  const rows = [
    { label: 'Avg RPS', cur: c.avgRps, base: b.avgRps, fmt: (v: number) => v.toFixed(1), higherIsBetter: true },
    { label: 'P50 (ms)', cur: c.latencyP50, base: b.latencyP50, fmt: (v: number) => v.toFixed(0) },
    { label: 'P90 (ms)', cur: c.latencyP90, base: b.latencyP90, fmt: (v: number) => v.toFixed(0) },
    { label: 'P99 (ms)', cur: c.latencyP99, base: b.latencyP99, fmt: (v: number) => v.toFixed(0) },
    { label: 'Ошибки (%)', cur: c.errorRate * 100, base: b.errorRate * 100, fmt: (v: number) => v.toFixed(2) },
    { label: 'Длительность', cur: c.durationSeconds, base: b.durationSeconds, fmt: formatDuration },
    { label: 'Запросов', cur: c.totalRequests, base: b.totalRequests, fmt: (v: number) => v.toLocaleString(), higherIsBetter: true },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{b.runId.slice(0, 8)}…</span>
        <span>→ baseline</span>
        <span className="mx-1">vs</span>
        <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{c.runId.slice(0, 8)}…</span>
        <span>→ current</span>
      </div>
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-3 py-2 font-medium text-xs">Метрика</th>
              <th className="text-right px-3 py-2 font-medium text-xs">Baseline</th>
              <th className="text-right px-3 py-2 font-medium text-xs">Current</th>
              <th className="text-right px-3 py-2 font-medium text-xs">Delta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, cur, base, fmt, higherIsBetter }) => (
              <tr key={label} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-1.5 text-muted-foreground text-xs">{label}</td>
                <td className="px-3 py-1.5 font-mono text-right text-xs">{fmt(base)}</td>
                <td className="px-3 py-1.5 font-mono text-right text-xs font-semibold">{fmt(cur)}</td>
                <td className="px-3 py-1.5 text-right">
                  <DeltaBadge current={cur} baseline={base} higherIsBetter={higherIsBetter} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface ReportsPageProps {
  onStartTest: (runId: string) => void;
}

export function ReportsPage({ onStartTest }: ReportsPageProps) {
  const [runs, setRuns] = useState<TestRunResponse[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [baselineRunId, setBaselineRunId] = useState<string>('none');
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [comparison, setComparison] = useState<RunComparisonResponse | null>(null);
  const [compLoading, setCompLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    runsApi.list().then((all) => {
      const finished = all
        .filter((r) => TERMINAL_STATUSES.includes(r.status))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRuns(finished);
      if (finished.length > 0 && !selectedRunId) setSelectedRunId(finished[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedRunId) { setReport(null); setComparison(null); return; }
    setReportLoading(true);
    setReport(null);
    setComparison(null);
    setBaselineRunId('none');

    runsApi.report(selectedRunId)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  }, [selectedRunId]);

  useEffect(() => {
    if (!selectedRunId || baselineRunId === 'none') { setComparison(null); return; }
    setCompLoading(true);
    setComparison(null);
    runsApi.compare(selectedRunId, baselineRunId)
      .then(setComparison)
      .catch(() => setComparison(null))
      .finally(() => setCompLoading(false));
  }, [selectedRunId, baselineRunId]);

  const handleRerun = async () => {
    if (!selectedRunId) return;
    setRerunning(true);
    try {
      const newRun = await runsApi.rerun(selectedRunId);
      onStartTest(newRun.id);
    } catch {
      // silently ignore
    } finally {
      setRerunning(false);
    }
  };

  const displayed = runs.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter.toUpperCase()) return false;
    if (search && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedRun = runs.find((r) => r.id === selectedRunId);

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
                        <TableCell className="font-mono text-sm">
                          <div>{run.id.slice(0, 12)}…</div>
                          {run.parentRunId && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              re-run of {run.parentRunId.slice(0, 8)}…
                            </div>
                          )}
                        </TableCell>
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
        <div className="space-y-4">
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
                    {[
                      { label: 'Длительность', val: formatDuration(report.durationSeconds) },
                      { label: 'Всего запросов', val: report.totalRequests.toLocaleString() },
                      { label: 'Avg RPS', val: report.avgRps.toFixed(1) },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-muted-foreground">{label}:</span>
                        <span className="font-mono font-semibold">{val}</span>
                      </div>
                    ))}
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

                {/* Baseline selector */}
                <div className="pt-3 border-t border-border">
                  <h4 className="text-sm font-semibold mb-2">Сравнить с</h4>
                  <Select value={baselineRunId} onValueChange={setBaselineRunId}>
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Выбрать baseline…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— не сравнивать —</SelectItem>
                      {runs
                        .filter((r) => r.id !== selectedRunId && r.scenarioId === selectedRun?.scenarioId)
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            <span className="font-mono">{r.id.slice(0, 10)}…</span>
                            <span className="text-muted-foreground ml-1 text-xs">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-border">
                  <Button
                    className="w-full gap-2"
                    onClick={handleRerun}
                    disabled={rerunning}
                  >
                    <RotateCcw className="h-4 w-4" />
                    {rerunning ? 'Запуск…' : 'Повторить тест'}
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Экспорт
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparison card */}
          {(compLoading || comparison) && selectedRun && (() => {
            const baselineRun = runs.find((r) => r.id === baselineRunId);
            return (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Сравнение</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {compLoading && <p className="text-xs text-muted-foreground">Загрузка…</p>}
                  {!compLoading && comparison && baselineRun && (
                    <ComparisonCharts currentRun={selectedRun} baselineRun={baselineRun} />
                  )}
                  {!compLoading && comparison && (
                    <ComparisonTable cmp={comparison} />
                  )}
                </CardContent>
              </Card>
            );
          })()}

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
