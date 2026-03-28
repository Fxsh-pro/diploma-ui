import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

type UiProfile = 'constant' | 'ramp-up' | 'spike' | 'step';

interface LoadProfilePreviewProps {
  loadProfile: UiProfile;
  startVus: number;
  peakVus: number;
  rampUpSec: number;
  holdSec: number;
  rampDownSec: number;
  baselineVus: number;
  spikeSec: number;
  recoverySec: number;
  spikeCount: number;
  stepSize: number;
  steps: number;
  stepDurSec: number;
  totalVus: number;
}

export function buildPreviewData(props: LoadProfilePreviewProps): { time: number; vu: number }[] {
  const { loadProfile, startVus, peakVus, rampUpSec, holdSec, rampDownSec,
          baselineVus, spikeSec, recoverySec, spikeCount, steps, stepSize, stepDurSec } = props;
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
    const totalMin = Math.ceil(holdSec / 60);
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
      t += Math.ceil(stepDurSec / 60);
      pts.push({ time: t, vu });
    }
  }
  return pts;
}

export function LoadProfilePreview(props: LoadProfilePreviewProps) {
  const { loadProfile, totalVus } = props;
  const data = buildPreviewData(props);
  const durationMin = Math.round(data[data.length - 1]?.time ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Предпросмотр профиля нагрузки</h4>
        <span className="text-xs text-muted-foreground">
          макс. {totalVus} VU · {durationMin} мин
        </span>
      </div>
      <div className="rounded-lg border border-border bg-muted/20 p-4" style={{ minHeight: '420px', height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorVU-preview" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="time" stroke="var(--color-muted-foreground)" fontSize={12} label={{ value: 'мин', position: 'insideBottom', offset: -5 }} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Area type={loadProfile === 'step' ? 'stepAfter' : 'monotone'} dataKey="vu" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorVU-preview)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/30 px-4 py-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Макс. VU</p>
          <p className="font-mono font-semibold">{totalVus}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Профиль</p>
          <p className="font-semibold capitalize">
            {loadProfile === 'ramp-up' ? 'Ramp-Up' : loadProfile === 'step' ? 'Step' : loadProfile === 'spike' ? 'Spike' : 'Constant'}
          </p>
        </div>
      </div>
    </div>
  );
}
