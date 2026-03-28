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
import { LoadProfilePreview } from "./load-profile-preview";
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
        totalVus: derivedTotalVus(),
        criteria: buildCriteria(),
        poolId: poolId === 'none' ? null : poolId,
        baseUrl: baseUrl.trim() || null,
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
      <DialogContent className="sm:max-w-none w-[min(90vw,1100px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройка нагрузочного теста</DialogTitle>
          <DialogDescription>Выберите сценарий и настройте профиль нагрузки</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-[380px_1fr] gap-6 mt-4">
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
              <Label>Base URL</Label>
              <Input
                placeholder="https://api.example.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Домен, который будет подставляться перед относительными путями в HTTP-узлах</p>
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
                    <Label className="whitespace-nowrap">Нач. VU</Label>
                    <Input type="number" value={startVus} onChange={(e) => setStartVus(Number(e.target.value))} min={0} />
                  </div>
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Пик VU</Label>
                    <Input type="number" value={peakVus} onChange={(e) => setPeakVus(Number(e.target.value))} min={1} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Разгон (с)</Label>
                    <Input type="number" value={rampUpSec} onChange={(e) => setRampUpSec(Number(e.target.value))} min={0} />
                  </div>
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Удержание (с)</Label>
                    <Input type="number" value={holdSec} onChange={(e) => setHoldSec(Number(e.target.value))} min={0} />
                  </div>
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Спад (с)</Label>
                    <Input type="number" value={rampDownSec} onChange={(e) => setRampDownSec(Number(e.target.value))} min={0} />
                  </div>
                </div>
              </div>
            )}

            {loadProfile === 'constant' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Целевые VU</Label>
                    <Input type="number" value={peakVus} onChange={(e) => setPeakVus(Number(e.target.value))} min={1} />
                  </div>
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Длительность (с)</Label>
                    <Input type="number" value={holdSec} onChange={(e) => setHoldSec(Number(e.target.value))} min={1} />
                  </div>
                </div>
              </div>
            )}

            {loadProfile === 'spike' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Базовые VU</Label>
                    <Input type="number" value={baselineVus} onChange={(e) => setBaselineVus(Number(e.target.value))} min={0} />
                  </div>
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Пик VU</Label>
                    <Input type="number" value={peakVus} onChange={(e) => setPeakVus(Number(e.target.value))} min={1} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Пик (с)</Label>
                    <Input type="number" value={spikeSec} onChange={(e) => setSpikeSec(Number(e.target.value))} min={1} />
                  </div>
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Восст. (с)</Label>
                    <Input type="number" value={recoverySec} onChange={(e) => setRecoverySec(Number(e.target.value))} min={1} />
                  </div>
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Кол-во пиков</Label>
                    <Input type="number" value={spikeCount} onChange={(e) => setSpikeCount(Number(e.target.value))} min={1} />
                  </div>
                </div>
              </div>
            )}

            {loadProfile === 'step' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Нач. VU</Label>
                    <Input type="number" value={startVus} onChange={(e) => setStartVus(Number(e.target.value))} min={0} />
                  </div>
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Шаг VU</Label>
                    <Input type="number" value={stepSize} onChange={(e) => setStepSize(Number(e.target.value))} min={1} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Шагов</Label>
                    <Input type="number" value={steps} onChange={(e) => setSteps(Number(e.target.value))} min={1} />
                  </div>
                  <div className="space-y-1">
                    <Label className="whitespace-nowrap">Длит. шага (с)</Label>
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
