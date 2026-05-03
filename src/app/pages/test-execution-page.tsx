import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Square, Download, RotateCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { StatusBadge } from "../components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { runsApi } from "../../api/runs";
import { scenariosApi } from "../../api/scenarios";
import type { TestRunResponse, MetricPointResponse, RunErrorResponse, ReportResponse } from "../../api/types";

interface ChartPoint {
  time: string;
  rps: number;
  p50: number;
  p90: number;
  p99: number;
  errorRate: number;
}

interface TestExecutionPageProps {
  runId: string;
  onBack: () => void;
  onStartTest?: (runId: string) => void;
}

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
  },
};

const TERMINAL = new Set(['COMPLETED', 'FAILED', 'STOPPED', 'DONE']);

export function TestExecutionPage({ runId, onBack, onStartTest }: TestExecutionPageProps) {
  const { canDo } = useAuth();
  const [run, setRun] = useState<TestRunResponse | null>(null);
  const [scenarioName, setScenarioName] = useState<string>('');
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [errors, setErrors] = useState<RunErrorResponse[]>([]);
  const [activeTab, setActiveTab] = useState("metrics");
  const startRef = useRef<string | null>(null);

  const fetchMetrics = async (currentRun: TestRunResponse) => {
    try {
      let points: MetricPointResponse[];
      if (TERMINAL.has(currentRun.status)) {
        const reportData = await runsApi.report(runId);
        setReport(reportData);
        points = reportData.timeSeries;
      } else {
        const from = currentRun.startedAt ?? new Date(Date.now() - 3600_000).toISOString();
        const to = new Date().toISOString();
        points = await runsApi.metrics(runId, from, to, 30);
      }
      const mapped: ChartPoint[] = points.map((p) => ({
        time: new Date(p.time).toLocaleTimeString(),
        rps: Number(p.rps.toFixed(1)),
        p50: Number(p.latencyP50.toFixed(0)),
        p90: Number(p.latencyP90.toFixed(0)),
        p99: Number(p.latencyP99.toFixed(0)),
        errorRate: Number((p.errorRate * 100).toFixed(2)),
      }));
      setChartData(mapped);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    const poll = async () => {
      try {
        const r = await runsApi.get(runId);
        setRun(r);
        if (r.startedAt && !startRef.current) {
          startRef.current = r.startedAt;
          // load scenario name
          scenariosApi.get(r.scenarioId).then((s) => setScenarioName(s.name)).catch(() => {});
        }
        await fetchMetrics(r);
        const errs = await runsApi.errors(runId);
        setErrors(errs);
      } catch {
        // silently ignore
      }
    };
    poll();
    const id = setInterval(poll, 5_000);
    return () => clearInterval(id);
  }, [runId]);

  // Stop polling once terminal
  const isTerminal = run ? TERMINAL.has(run.status) : false;

  const elapsed = (() => {
    if (!run?.startedAt) return '—';
    const start = new Date(run.startedAt).getTime();
    const end = isTerminal && run.finishedAt
      ? new Date(run.finishedAt).getTime()
      : Date.now();
    const secs = Math.floor((end - start) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  })();

  const latest = chartData[chartData.length - 1];

  const handleStop = async () => {
    await runsApi.stop(runId).catch(() => {});
  };

  const handleRerun = async () => {
    try {
      const newRun = await runsApi.rerun(runId);
      onStartTest?.(newRun.id);
    } catch {
      // silently ignore
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-semibold">
                  {scenarioName || `Тест ${runId.slice(0, 8)}…`}
                </h1>
                {run && (
                  <StatusBadge status={run.status === 'RUNNING' ? 'running' : run.status === 'PENDING' ? 'warning' : 'completed'}>
                    {run.status}
                  </StatusBadge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span>Прошло: {elapsed}</span>
                {latest && (
                  <>
                    <span>•</span>
                    <span>RPS: {latest.rps}</span>
                    <span>•</span>
                    <span className={latest.errorRate > 1 ? 'text-destructive' : ''}>
                      Ошибки: {latest.errorRate}%
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!isTerminal && canDo('MANAGE_TEST_RUNS') && (
              <Button variant="destructive" size="sm" className="gap-2" onClick={handleStop}>
                <Square className="h-4 w-4" />
                Остановить
              </Button>
            )}
            {isTerminal && onStartTest && canDo('MANAGE_TEST_RUNS') && (
              <Button variant="outline" size="sm" className="gap-2" onClick={handleRerun}>
                <RotateCcw className="h-4 w-4" />
                Повторить
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {chartData.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            {run?.status === 'PENDING' ? 'Тест ожидает запуска…' : 'Ожидание метрик…'}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RPS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Пропускная способность (RPS)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRPS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="time" stroke="var(--color-muted-foreground)" fontSize={11} tick={{ fontSize: 10 }} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="rps" stroke="var(--color-accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorRPS)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {latest && (
                <div className="mt-3 text-sm flex gap-4">
                  <span className="text-muted-foreground">Текущий:</span>
                  <span className="font-mono font-semibold">{latest.rps} RPS</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Latency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Латентность (мс)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="time" stroke="var(--color-muted-foreground)" fontSize={11} tick={{ fontSize: 10 }} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Legend />
                    <Line type="monotone" dataKey="p50" name="P50" stroke="#22c55e" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="p90" name="P90" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="p99" name="P99" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {latest && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  {[
                    { label: 'P50', val: latest.p50, color: 'text-success' },
                    { label: 'P90', val: latest.p90, color: 'text-warning' },
                    { label: 'P99', val: latest.p99, color: 'text-destructive' },
                  ].map(({ label, val, color }) => (
                    <div key={label}>
                      <span className="text-muted-foreground text-xs">{label}:</span>
                      <div className={`font-mono font-semibold ${color}`}>{val} ms</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Частота ошибок (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-destructive)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-destructive)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="time" stroke="var(--color-muted-foreground)" fontSize={11} tick={{ fontSize: 10 }} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="errorRate" name="Ошибки %" stroke="var(--color-destructive)" strokeWidth={2} fillOpacity={1} fill="url(#colorErrors)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {latest && (
                <div className="mt-3 text-sm flex gap-4">
                  <span className="text-muted-foreground">Текущий:</span>
                  <span className={`font-mono font-semibold ${latest.errorRate > 1 ? 'text-destructive' : 'text-success'}`}>
                    {latest.errorRate}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Сводка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {run && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Статус:</span>
                    <span className="font-semibold">{run.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Начало:</span>
                    <span className="font-mono text-xs">
                      {run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}
                    </span>
                  </div>
                  {run.finishedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Конец:</span>
                      <span className="font-mono text-xs">{new Date(run.finishedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {run.failureReason && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-destructive text-xs font-medium">Причина сбоя:</span>
                      <p className="text-xs text-destructive mt-0.5">{run.failureReason}</p>
                    </div>
                  )}
                </div>
              )}
              {latest && (
                <div className="pt-3 border-t border-border space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Посл. RPS:</span>
                    <span className="font-mono font-semibold">{latest.rps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Посл. P99:</span>
                    <span className="font-mono font-semibold">{latest.p99} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Посл. ошибки:</span>
                    <span className={`font-mono font-semibold ${latest.errorRate > 1 ? 'text-destructive' : 'text-success'}`}>
                      {latest.errorRate}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary stats for completed runs */}
        {isTerminal && report && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Всего запросов', value: report.totalRequests.toLocaleString('ru-RU') },
              { label: 'Ср. RPS', value: report.avgRps.toFixed(1) },
              { label: 'Пик. RPS', value: report.peakRps.toFixed(1) },
              { label: 'P50', value: `${report.latencyP50.toFixed(0)} мс` },
              { label: 'P90', value: `${report.latencyP90.toFixed(0)} мс` },
              { label: 'P99', value: `${report.latencyP99.toFixed(0)} мс` },
              { label: 'Ошибки', value: `${(report.errorRate * 100).toFixed(2)}%` },
            ].map(({ label, value }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-xl font-mono font-bold mt-0.5">{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="metrics">Все метрики</TabsTrigger>
            <TabsTrigger value="errors">
              Ошибки{errors.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-destructive/20 text-destructive font-medium">
                  {errors.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="run">Информация о запуске</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-2 font-medium">Время</th>
                        <th className="text-right px-4 py-2 font-medium">RPS</th>
                        <th className="text-right px-4 py-2 font-medium">P50</th>
                        <th className="text-right px-4 py-2 font-medium">P90</th>
                        <th className="text-right px-4 py-2 font-medium">P99</th>
                        <th className="text-right px-4 py-2 font-medium">Ошибки</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...chartData].reverse().map((row, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-4 py-1.5 font-mono text-xs">{row.time}</td>
                          <td className="px-4 py-1.5 font-mono text-right">{row.rps}</td>
                          <td className="px-4 py-1.5 font-mono text-right">{row.p50} ms</td>
                          <td className="px-4 py-1.5 font-mono text-right">{row.p90} ms</td>
                          <td className="px-4 py-1.5 font-mono text-right">{row.p99} ms</td>
                          <td className={`px-4 py-1.5 font-mono text-right ${row.errorRate > 1 ? 'text-destructive' : ''}`}>
                            {row.errorRate}%
                          </td>
                        </tr>
                      ))}
                      {chartData.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                            Нет данных
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-2 font-medium">Ошибка</th>
                        <th className="text-right px-4 py-2 font-medium">Кол-во</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errors.map((e, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-4 py-2 font-mono text-xs text-destructive">{e.message}</td>
                          <td className="px-4 py-2 font-mono text-right">{e.count}</td>
                        </tr>
                      ))}
                      {errors.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                            Ошибок не зафиксировано
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="run" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                {run ? (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Run ID:</span><span className="font-mono">{run.id}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Scenario ID:</span><span className="font-mono">{run.scenarioId}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Статус:</span><span>{run.status}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Создан:</span><span className="font-mono text-xs">{new Date(run.createdAt).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Начало:</span><span className="font-mono text-xs">{run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Конец:</span><span className="font-mono text-xs">{run.finishedAt ? new Date(run.finishedAt).toLocaleString() : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Base URL:</span><span className="font-mono text-xs">{run.baseUrl || '—'}</span></div>
                    {run.failureReason && (
                      <div className="pt-2 border-t border-border">
                        <span className="text-destructive text-xs font-medium">Причина сбоя:</span>
                        <p className="text-xs text-destructive mt-0.5">{run.failureReason}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Загрузка…</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed bottom-6 right-6">
        <Button className="gap-2 shadow-lg">
          <Download className="h-4 w-4" />
          Экспорт данных
        </Button>
      </div>
    </div>
  );
}
