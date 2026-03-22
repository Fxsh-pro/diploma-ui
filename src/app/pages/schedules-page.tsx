import { useEffect, useState } from "react";
import { Plus, Trash2, CalendarClock, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { CreateScheduleModal } from "../components/create-schedule-modal";
import { schedulesApi } from "../../api/schedules";
import { scenariosApi } from "../../api/scenarios";
import type { ScheduleResponse, ScenarioResponse } from "../../api/types";
import { cronToLabel, formatDateTime } from "../utils/cron-label";
import { useAuth } from "../context/AuthContext";

export function SchedulesPage() {
  const { canDo } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    schedulesApi.list().then(setSchedules).catch(() => {});
    scenariosApi.list().then(setScenarios).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const scenarioName = (id: string) => scenarios.find((s) => s.id === id)?.name ?? id;

  const handleToggle = async (s: ScheduleResponse) => {
    await schedulesApi.toggle(s.id, !s.enabled).catch(() => {});
    load();
  };

  const handleDelete = async (id: string) => {
    await schedulesApi.delete(id).catch(() => {});
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const scheduleLabel = (s: ScheduleResponse): string => {
    if (s.scheduleType === 'ONE_TIME') {
      return s.scheduledAt ? formatDateTime(s.scheduledAt) : '—';
    }
    return s.cronExpression ? cronToLabel(s.cronExpression) : '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Расписание</h2>
          <p className="text-muted-foreground">Автоматический запуск нагрузочных тестов</p>
        </div>
        {canDo('MANAGE_SCHEDULES') && (
          <Button className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Новое расписание
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Расписания</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Нет расписаний. Нажмите «Новое расписание» для создания.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="pb-3 pr-4 font-medium">Название</th>
                    <th className="pb-3 pr-4 font-medium">Сценарий</th>
                    <th className="pb-3 pr-4 font-medium">Тип</th>
                    <th className="pb-3 pr-4 font-medium">Расписание</th>
                    <th className="pb-3 pr-4 font-medium">Последний запуск</th>
                    <th className="pb-3 pr-4 font-medium">Следующий запуск</th>
                    <th className="pb-3 pr-4 font-medium">Статус</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schedules.map((s) => {
                    const fired = s.scheduleType === 'ONE_TIME' && s.lastRunAt != null;
                    return (
                      <tr key={s.id} className="hover:bg-accent/5 transition-colors">
                        <td className="py-3 pr-4 font-medium">{s.name}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{scenarioName(s.scenarioId)}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${s.scheduleType === 'ONE_TIME' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                            {s.scheduleType === 'ONE_TIME' ? 'Однократно' : 'По расписанию'}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">{scheduleLabel(s)}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{s.lastRunAt ? formatDateTime(s.lastRunAt) : '—'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {fired
                            ? <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3 w-3" />Выполнено</span>
                            : s.nextRunAt ? formatDateTime(s.nextRunAt) : '—'
                          }
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            onClick={() => handleToggle(s)}
                            disabled={fired}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40 ${s.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${s.enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                          </button>
                        </td>
                        <td className="py-3">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateScheduleModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
      />
    </div>
  );
}
