import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Play } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { scenariosApi } from "../../api/scenarios";
import { runsApi } from "../../api/runs";
import { poolsApi } from "../../api/pools";
import type { ScenarioResponse, ProfileType, PassFailCriteriaDto, AgentPoolResponse } from "../../api/types";

interface TestConfigModalProps {
  open: boolean;
  onClose: () => void;
  onStartTest: (runId: string) => void;
}

type UiProfile = 'constant' | 'ramp-up' | 'spike' | 'step';

const profileTypeMap: Record<UiProfile, ProfileType> = {
  'constant': 'CONSTANT',
  'ramp-up':  'RAMP_UP',
  'spike':    'SPIKE',
  'step':     'STEP',
};

export function TestConfigModal({ open, onClose, onStartTest }: TestConfigModalProps) {
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
  const [pools, setPools] = useState<AgentPoolResponse[]>([]);
  const [scenarioId, setScenarioId] = useState<string>('');
  const [poolId, setPoolId] = useState<string>('none');
  const [loadProfile, setLoadProfile] = useState<UiProfile>('ramp-up');
  const [totalVus, setTotalVus] = useState(1000);

  // RAMP_UP / CONSTANT shared fields
  const [startVus, setStartVus] = useState(10);
  const [peakVus, setPeakVus] = useState(1000);
  const [rampUpSec, setRampUpSec] = useState(300);   // 5 min
  const [holdSec, setHoldSec] = useState(900);        // 15 min
  const [rampDownSec, setRampDownSec] = useState(120); // 2 min

  // SPIKE
  const [baselineVus, setBaselineVus] = useState(50);
  const [spikeSec, setSpikeSec] = useState(30);
  const [recoverySec, setRecoverySec] = useState(60);
  const [spikeCount, setSpikeCount] = useState(2);

  // STEP
  const [stepSize, setStepSize] = useState(100);
  const [steps, setSteps] = useState(5);
  const [stepDurSec, setStepDurSec] = useState(60);

  // Pass/Fail criteria
  const [criteriaEnabled, setCriteriaEnabled] = useState(false);
  const [maxErrorRate, setMaxErrorRate] = useState<string>('');
  const [maxLatencyP99, setMaxLatencyP99] = useState<string>('');

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

  // Build preview data for chart
  const previewData = (() => {
    const pts: { time: number; vu: number }[] = [];
    if (loadProfile === 'ramp-up') {
      const totalSec = rampUpSec + holdSec + rampDownSec;
      const step = Math.max(1, Math.floor(totalSec / 30));
      for (let t = 0; t <= totalSec; t += step) {
        let vu: number;
        if (t <= rampUpSec) vu = startVus + ((peakVus - startVus) / rampUpSec) * t;
        else if (t <= rampUpSec + holdSec) vu = peakVus;
        else vu = peakVus - ((peakVus - startVus) / rampDownSec) * (t - rampUpSec - holdSec);
        pts.push({ time: Math.round(t / 60), vu: Math.max(0, Math.round(vu)) });
      }
    } else if (loadProfile === 'constant') {
      const totalMin = Math.ceil((holdSec) / 60);
      pts.push({ time: 0, vu: 0 });
      pts.push({ time: 1, vu: peakVus });
      pts.push({ time: totalMin, vu: peakVus });
    } else if (loadProfile === 'spike') {
      const cycleMin = Math.ceil((spikeSec + recoverySec) / 60);
      pts.push({ time: 0, vu: baselineVus });
      for (let i = 0; i < spikeCount; i++) {
        const base = i * cycleMin;
        pts.push({ time: base + 0.1, vu: peakVus });
        pts.push({ time: base + Math.ceil(spikeSec / 60), vu: peakVus });
        pts.push({ time: base + cycleMin, vu: baselineVus });
      }
    } else if (loadProfile === 'step') {
      let t = 0;
      let vu = startVus;
      pts.push({ time: 0, vu });
      for (let i = 0; i < steps; i++) {
        vu += stepSize;
        pts.push({ time: t, vu });
        t += Math.ceil(stepDurSec / 60);
        pts.push({ time: t, vu });
      }
    }
    return pts;
  })();

  const buildParams = (): Record<string, number> => {
    switch (loadProfile) {
      case 'ramp-up': return {
        startVus,
        endVus: peakVus,
        rampDurationSeconds: rampUpSec,
        holdDurationSeconds: holdSec,
        rampDownDurationSeconds: rampDownSec,
      };
      case 'constant': return {
        targetVus: peakVus,
        durationSeconds: holdSec,
      };
      case 'spike': return {
        baselineVus,
        peakVus,
        spikeDurationSeconds: spikeSec,
        recoveryDurationSeconds: recoverySec,
        spikeCount,
      };
      case 'step': return {
        startVus,
        stepSize,
        steps,
        stepDurationSeconds: stepDurSec,
      };
    }
  };

  const buildCriteria = (): PassFailCriteriaDto | null => {
    if (!criteriaEnabled) return null;
    const c: PassFailCriteriaDto = {};
    if (maxErrorRate !== '') c.maxErrorRate = Number(maxErrorRate);
    if (maxLatencyP99 !== '') c.maxLatencyP99Ms = Number(maxLatencyP99);
    return (c.maxErrorRate != null || c.maxLatencyP99Ms != null) ? c : null;
  };

  const handleStartTest = async () => {
    if (!scenarioId) { setError('Выберите сценарий'); return; }
    setLoading(true);
    setError(null);
    try {
      const run = await runsApi.create({
        scenarioId,
        profileType: profileTypeMap[loadProfile],
        profileParams: buildParams(),
        totalVus,
        criteria: buildCriteria(),
        poolId: poolId === 'none' ? null : poolId,
      });
      onStartTest(run.id);
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Ошибка запуска теста');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройка нагрузочного теста</DialogTitle>
          <DialogDescription>Выберите сценарий и настройте профиль нагрузки</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Left – Configuration */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Сценарий</Label>
              <Select value={scenarioId} onValueChange={setScenarioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите сценарий" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Пул агентов</Label>
              <Select value={poolId} onValueChange={setPoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Все доступные агенты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— все доступные агенты —</SelectItem>
                  {pools.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalVus">Всего виртуальных пользователей</Label>
              <Input
                id="totalVus"
                type="number"
                value={totalVus}
                onChange={(e) => setTotalVus(Number(e.target.value))}
                min={1}
              />
            </div>

            <div className="space-y-3">
              <Label>Профиль нагрузки</Label>
              <RadioGroup value={loadProfile} onValueChange={(v) => setLoadProfile(v as UiProfile)}>
                {(['constant', 'ramp-up', 'spike', 'step'] as UiProfile[]).map((p) => (
                  <div key={p} className="flex items-center space-x-2">
                    <RadioGroupItem value={p} id={p} />
                    <Label htmlFor={p} className="font-normal cursor-pointer capitalize">
                      {p === 'ramp-up' ? 'Ramp-Up' : p === 'step' ? 'Step' : p === 'spike' ? 'Spike' : 'Constant'}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Profile-specific params */}
            {(loadProfile === 'ramp-up') && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Нач. VU</Label>
                    <Input type="number" value={startVus} onChange={(e) => setStartVus(Number(e.target.value))} min={0} />
                  </div>
                  <div className="space-y-1">
                    <Label>Пик VU</Label>
                    <Input type="number" value={peakVus} onChange={(e) => setPeakVus(Number(e.target.value))} min={1} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Разгон (с)</Label>
                    <Input type="number" value={rampUpSec} onChange={(e) => setRampUpSec(Number(e.target.value))} min={0} />
                  </div>
                  <div className="space-y-1">
                    <Label>Удержание (с)</Label>
                    <Input type="number" value={holdSec} onChange={(e) => setHoldSec(Number(e.target.value))} min={0} />
                  </div>
                  <div className="space-y-1">
                    <Label>Спад (с)</Label>
                    <Input type="number" value={rampDownSec} onChange={(e) => setRampDownSec(Number(e.target.value))} min={0} />
                  </div>
                </div>
              </div>
            )}

            {loadProfile === 'constant' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Целевые VU</Label>
                    <Input type="number" value={peakVus} onChange={(e) => setPeakVus(Number(e.target.value))} min={1} />
                  </div>
                  <div className="space-y-1">
                    <Label>Длительность (с)</Label>
                    <Input type="number" value={holdSec} onChange={(e) => setHoldSec(Number(e.target.value))} min={1} />
                  </div>
                </div>
              </div>
            )}

            {loadProfile === 'spike' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Базовые VU</Label>
                    <Input type="number" value={baselineVus} onChange={(e) => setBaselineVus(Number(e.target.value))} min={0} />
                  </div>
                  <div className="space-y-1">
                    <Label>Пик VU</Label>
                    <Input type="number" value={peakVus} onChange={(e) => setPeakVus(Number(e.target.value))} min={1} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Пик (с)</Label>
                    <Input type="number" value={spikeSec} onChange={(e) => setSpikeSec(Number(e.target.value))} min={1} />
                  </div>
                  <div className="space-y-1">
                    <Label>Восст. (с)</Label>
                    <Input type="number" value={recoverySec} onChange={(e) => setRecoverySec(Number(e.target.value))} min={1} />
                  </div>
                  <div className="space-y-1">
                    <Label>Кол-во пиков</Label>
                    <Input type="number" value={spikeCount} onChange={(e) => setSpikeCount(Number(e.target.value))} min={1} />
                  </div>
                </div>
              </div>
            )}

            {loadProfile === 'step' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Нач. VU</Label>
                    <Input type="number" value={startVus} onChange={(e) => setStartVus(Number(e.target.value))} min={0} />
                  </div>
                  <div className="space-y-1">
                    <Label>Шаг VU</Label>
                    <Input type="number" value={stepSize} onChange={(e) => setStepSize(Number(e.target.value))} min={1} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Шагов</Label>
                    <Input type="number" value={steps} onChange={(e) => setSteps(Number(e.target.value))} min={1} />
                  </div>
                  <div className="space-y-1">
                    <Label>Длит. шага (с)</Label>
                    <Input type="number" value={stepDurSec} onChange={(e) => setStepDurSec(Number(e.target.value))} min={1} />
                  </div>
                </div>
              </div>
            )}

            {/* Pass/Fail Criteria */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Критерии прохождения</Label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={criteriaEnabled}
                  onClick={() => setCriteriaEnabled((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${criteriaEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${criteriaEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {criteriaEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Макс. ошибок (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      placeholder="напр. 5"
                      value={maxErrorRate}
                      onChange={(e) => setMaxErrorRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Макс. P99 задержка (мс)</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="напр. 2000"
                      value={maxLatencyP99}
                      onChange={(e) => setMaxLatencyP99(e.target.value)}
                    />
                  </div>
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Тест автоматически завершится с ошибкой, если любой порог будет превышен за последние 60 с.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right – Preview */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Предпросмотр профиля нагрузки</h4>
            <div className="h-64 rounded-lg border border-border bg-muted/20 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={previewData}>
                  <defs>
                    <linearGradient id="colorVU" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="time" stroke="var(--color-muted-foreground)" fontSize={12} label={{ value: 'мин', position: 'insideBottom', offset: -5 }} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Area type="monotone" dataKey="vu" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorVU)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive mt-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={loading}>Отмена</Button>
          <Button onClick={handleStartTest} disabled={loading} className="gap-2">
            <Play className="h-4 w-4" />
            {loading ? 'Запуск…' : 'Запустить тест'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
