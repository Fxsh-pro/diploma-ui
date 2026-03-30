import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { CalendarClock } from "lucide-react";
import { CronPicker } from "./cron-picker";
import { LoadProfilePreview } from "./load-profile-preview";
import { scenariosApi } from "../../api/scenarios";
import { poolsApi } from "../../api/pools";
import { schedulesApi } from "../../api/schedules";
import type { ScenarioResponse, ProfileType, PassFailCriteriaDto, AgentPoolResponse } from "../../api/types";

interface CreateScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type UiProfile = 'constant' | 'ramp-up' | 'spike' | 'step';

const profileTypeMap: Record<UiProfile, ProfileType> = {
  'constant': 'CONSTANT',
  'ramp-up':  'RAMP_UP',
  'spike':    'SPIKE',
  'step':     'STEP',
};

export function CreateScheduleModal({ open, onClose, onCreated }: CreateScheduleModalProps) {
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
  const [pools, setPools] = useState<AgentPoolResponse[]>([]);

  // Schedule-specific fields
  const [name, setName] = useState('');
  const [scheduleType, setScheduleType] = useState<'ONE_TIME' | 'RECURRING'>('ONE_TIME');
  const [scheduledAt, setScheduledAt] = useState('');
  const [cronExpression, setCronExpression] = useState('0 9 * * *');

  // Shared with test-config-modal
  const [scenarioId, setScenarioId] = useState('');
  const [poolId, setPoolId] = useState('none');
  const [loadProfile, setLoadProfile] = useState<UiProfile>('constant');
  const [startVus, setStartVus] = useState(10);
  const [peakVus, setPeakVus] = useState(100);
  const [rampUpSec, setRampUpSec] = useState(300);
  const [holdSec, setHoldSec] = useState(900);
  const [rampDownSec, setRampDownSec] = useState(120);
  const [baselineVus, setBaselineVus] = useState(50);
  const [spikeSec, setSpikeSec] = useState(30);
  const [recoverySec, setRecoverySec] = useState(60);
  const [spikeCount, setSpikeCount] = useState(2);
  const [stepSize, setStepSize] = useState(100);
  const [steps, setSteps] = useState(5);
  const [stepDurSec, setStepDurSec] = useState(60);
  const [criteriaEnabled, setCriteriaEnabled] = useState(false);
  const [maxErrorRate, setMaxErrorRate] = useState('');
  const [maxLatencyP99, setMaxLatencyP99] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      scenariosApi.list().then((list) => {
        setScenarios(list);
        if (list.length > 0 && !scenarioId) setScenarioId(list[0].id);
      }).catch(() => {});
      poolsApi.list().then(setPools).catch(() => {});
    }
  }, [open]);

  const derivedTotalVus = (): number => {
    switch (loadProfile) {
      case 'ramp-up': return peakVus;
      case 'constant': return peakVus;
      case 'spike': return peakVus;
      case 'step': return startVus + steps * stepSize;
    }
  };

  const buildParams = (): Record<string, number> => {
    switch (loadProfile) {
      case 'ramp-up': return { startVus, endVus: peakVus, rampDurationSeconds: rampUpSec, holdDurationSeconds: holdSec, rampDownDurationSeconds: rampDownSec };
      case 'constant': return { targetVus: peakVus, durationSeconds: holdSec };
      case 'spike': return { baselineVus, peakVus, spikeDurationSeconds: spikeSec, recoveryDurationSeconds: recoverySec, spikeCount };
      case 'step': return { startVus, stepSize, steps, stepDurationSeconds: stepDurSec };
    }
  };

  const buildCriteria = (): PassFailCriteriaDto | null => {
    if (!criteriaEnabled) return null;
    const c: PassFailCriteriaDto = {};
    if (maxErrorRate !== '') c.maxErrorRate = Number(maxErrorRate);
    if (maxLatencyP99 !== '') c.maxLatencyP99Ms = Number(maxLatencyP99);
    return (c.maxErrorRate != null || c.maxLatencyP99Ms != null) ? c : null;
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Введите название расписания'); return; }
    if (!scenarioId) { setError('Выберите сценарий'); return; }
    if (scheduleType === 'ONE_TIME' && !scheduledAt) { setError('Укажите дату и время запуска'); return; }
    if (scheduleType === 'RECURRING' && !cronExpression.trim()) { setError('Введите cron-выражение'); return; }

    setLoading(true);
    setError(null);
    try {
      await schedulesApi.create({
        name: name.trim(),
        scenarioId,
        scheduleType,
        scheduledAt: scheduleType === 'ONE_TIME' ? new Date(scheduledAt).toISOString() : null,
        cronExpression: scheduleType === 'RECURRING' ? cronExpression.trim() : null,
        profileType: profileTypeMap[loadProfile],
        profileParams: buildParams(),
        totalVus: derivedTotalVus(),
        criteria: buildCriteria(),
        poolId: poolId === 'none' ? null : poolId,
        baseUrl: baseUrl.trim() || null,
      });
      onCreated();
      onClose();
      // reset
      setName(''); setScheduledAt(''); setCronExpression('0 9 * * *'); setScheduleType('ONE_TIME');
    } catch (e: any) {
      setError(e.message ?? 'Ошибка создания расписания');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-none w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новое расписание</DialogTitle>
          <DialogDescription>Настройте автоматический запуск теста</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-[420px_1fr] gap-6 mt-4">
          {/* Left – Configuration */}
          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label>Название расписания</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Ежедневная проверка API" />
            </div>

            {/* Schedule type */}
            <div className="space-y-3">
              <Label>Тип расписания</Label>
              <RadioGroup value={scheduleType} onValueChange={(v) => setScheduleType(v as 'ONE_TIME' | 'RECURRING')} className="flex gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="ONE_TIME" id="one-time" />
                  <Label htmlFor="one-time" className="font-normal cursor-pointer">Однократно</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="RECURRING" id="recurring" />
                  <Label htmlFor="recurring" className="font-normal cursor-pointer">Повторяющееся (Cron)</Label>
                </div>
              </RadioGroup>

              {scheduleType === 'ONE_TIME' && (
                <div className="space-y-2">
                  <Label>Дата и время запуска</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                </div>
              )}

              {scheduleType === 'RECURRING' && (
                <CronPicker value={cronExpression} onChange={setCronExpression} />
              )}
            </div>

            <div className="border-t border-border pt-4 space-y-5">
              {/* Scenario */}
              <div className="space-y-2">
                <Label>Сценарий</Label>
                <Select value={scenarioId} onValueChange={setScenarioId}>
                  <SelectTrigger><SelectValue placeholder="Выберите сценарий" /></SelectTrigger>
                  <SelectContent>
                    {scenarios.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Pool */}
              <div className="space-y-2">
                <Label>Пул агентов</Label>
                <Select value={poolId} onValueChange={setPoolId}>
                  <SelectTrigger><SelectValue placeholder="Все доступные агенты" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— все доступные агенты —</SelectItem>
                    {pools.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Base URL */}
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  placeholder="https://api.example.com"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Домен, который будет подставляться перед относительными путями в HTTP-узлах</p>
              </div>

              {/* Load profile */}
              <div className="space-y-3">
                <Label>Профиль нагрузки</Label>
                <RadioGroup value={loadProfile} onValueChange={(v) => setLoadProfile(v as UiProfile)}>
                  {(['constant', 'ramp-up', 'spike', 'step'] as UiProfile[]).map((p) => (
                    <div key={p} className="flex items-center space-x-2">
                      <RadioGroupItem value={p} id={`sched-${p}`} />
                      <Label htmlFor={`sched-${p}`} className="font-normal cursor-pointer">
                        {p === 'ramp-up' ? 'Ramp-Up' : p === 'step' ? 'Step' : p === 'spike' ? 'Spike' : 'Constant'}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {loadProfile === 'ramp-up' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Нач. VU</Label><Input type="number" value={startVus} onChange={(e) => setStartVus(Number(e.target.value))} min={0} /></div>
                    <div className="space-y-1"><Label>Пик VU</Label><Input type="number" value={peakVus} onChange={(e) => setPeakVus(Number(e.target.value))} min={1} /></div>
                    <div className="space-y-1"><Label>Разгон (с)</Label><Input type="number" value={rampUpSec} onChange={(e) => setRampUpSec(Number(e.target.value))} min={0} /></div>
                    <div className="space-y-1"><Label>Удержание (с)</Label><Input type="number" value={holdSec} onChange={(e) => setHoldSec(Number(e.target.value))} min={0} /></div>
                    <div className="space-y-1"><Label>Спад (с)</Label><Input type="number" value={rampDownSec} onChange={(e) => setRampDownSec(Number(e.target.value))} min={0} /></div>
                  </div>
                )}
                {loadProfile === 'constant' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Целевые VU</Label><Input type="number" value={peakVus} onChange={(e) => setPeakVus(Number(e.target.value))} min={1} /></div>
                    <div className="space-y-1"><Label>Длительность (с)</Label><Input type="number" value={holdSec} onChange={(e) => setHoldSec(Number(e.target.value))} min={1} /></div>
                  </div>
                )}
                {loadProfile === 'spike' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Базовые VU</Label><Input type="number" value={baselineVus} onChange={(e) => setBaselineVus(Number(e.target.value))} min={0} /></div>
                    <div className="space-y-1"><Label>Пик VU</Label><Input type="number" value={peakVus} onChange={(e) => setPeakVus(Number(e.target.value))} min={1} /></div>
                    <div className="space-y-1"><Label>Пик (с)</Label><Input type="number" value={spikeSec} onChange={(e) => setSpikeSec(Number(e.target.value))} min={1} /></div>
                    <div className="space-y-1"><Label>Восст. (с)</Label><Input type="number" value={recoverySec} onChange={(e) => setRecoverySec(Number(e.target.value))} min={1} /></div>
                    <div className="space-y-1"><Label>Кол-во пиков</Label><Input type="number" value={spikeCount} onChange={(e) => setSpikeCount(Number(e.target.value))} min={1} /></div>
                  </div>
                )}
                {loadProfile === 'step' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Нач. VU</Label><Input type="number" value={startVus} onChange={(e) => setStartVus(Number(e.target.value))} min={0} /></div>
                    <div className="space-y-1"><Label>Шаг VU</Label><Input type="number" value={stepSize} onChange={(e) => setStepSize(Number(e.target.value))} min={1} /></div>
                    <div className="space-y-1"><Label>Шагов</Label><Input type="number" value={steps} onChange={(e) => setSteps(Number(e.target.value))} min={1} /></div>
                    <div className="space-y-1"><Label>Длит. шага (с)</Label><Input type="number" value={stepDurSec} onChange={(e) => setStepDurSec(Number(e.target.value))} min={1} /></div>
                  </div>
                )}
              </div>

              {/* Criteria */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Критерии прохождения</Label>
                  <button
                    type="button"
                    onClick={() => setCriteriaEnabled((v) => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${criteriaEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${criteriaEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {criteriaEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Макс. ошибок (%)</Label>
                      <Input type="number" min={0} max={100} step={0.1} placeholder="напр. 5" value={maxErrorRate} onChange={(e) => setMaxErrorRate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Макс. P99 (мс)</Label>
                      <Input type="number" min={1} placeholder="напр. 2000" value={maxLatencyP99} onChange={(e) => setMaxLatencyP99(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right – Preview chart */}
          <LoadProfilePreview
            loadProfile={loadProfile}
            startVus={startVus}
            peakVus={peakVus}
            rampUpSec={rampUpSec}
            holdSec={holdSec}
            rampDownSec={rampDownSec}
            baselineVus={baselineVus}
            spikeSec={spikeSec}
            recoverySec={recoverySec}
            spikeCount={spikeCount}
            stepSize={stepSize}
            steps={steps}
            stepDurSec={stepDurSec}
            totalVus={derivedTotalVus()}
          />
        </div>

        {error && <p className="text-sm text-destructive mt-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={loading}>Отмена</Button>
          <Button onClick={handleCreate} disabled={loading} className="gap-2">
            <CalendarClock className="h-4 w-4" />
            {loading ? 'Создание…' : 'Создать расписание'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
