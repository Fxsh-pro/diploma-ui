import { useState, useEffect } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CalendarClock } from "lucide-react";

type Frequency = 'every-n-min' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

const DAYS = [
  { value: '1', label: 'Пн' },
  { value: '2', label: 'Вт' },
  { value: '3', label: 'Ср' },
  { value: '4', label: 'Чт' },
  { value: '5', label: 'Пт' },
  { value: '6', label: 'Сб' },
  { value: '0', label: 'Вс' },
];

function buildCron(
  freq: Frequency,
  minute: string,
  hour: string,
  everyNMin: string,
  weekDays: string[],
  monthDay: string,
  custom: string,
): string {
  const m = minute.padStart(2, '0');
  const h = hour.padStart(2, '0');
  switch (freq) {
    case 'every-n-min': return `*/${everyNMin || '5'} * * * *`;
    case 'hourly':      return `${m} * * * *`;
    case 'daily':       return `${m} ${h} * * *`;
    case 'weekly':      return `${m} ${h} * * ${weekDays.length ? weekDays.join(',') : '*'}`;
    case 'monthly':     return `${m} ${h} ${monthDay || '1'} * *`;
    case 'custom':      return custom;
    default:            return custom;
  }
}

function humanLabel(
  freq: Frequency,
  minute: string,
  hour: string,
  everyNMin: string,
  weekDays: string[],
  monthDay: string,
): string {
  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  const dayNames = weekDays.map((d) => DAYS.find((x) => x.value === d)?.label ?? d).join(', ');
  switch (freq) {
    case 'every-n-min': return `Каждые ${everyNMin || '5'} мин.`;
    case 'hourly':      return `Каждый час в :${minute.padStart(2, '0')}`;
    case 'daily':       return `Каждый день в ${time}`;
    case 'weekly':      return weekDays.length
      ? `Каждую неделю в ${time} (${dayNames})`
      : `Каждую неделю в ${time}`;
    case 'monthly':     return `${monthDay || '1'}-го числа каждого месяца в ${time}`;
    default:            return '';
  }
}

interface CronPickerProps {
  value: string;
  onChange: (cron: string) => void;
}

export function CronPicker({ value, onChange }: CronPickerProps) {
  const [freq, setFreq] = useState<Frequency>('daily');
  const [minute, setMinute] = useState('0');
  const [hour, setHour] = useState('9');
  const [everyNMin, setEveryNMin] = useState('5');
  const [weekDays, setWeekDays] = useState<string[]>(['1']); // Monday default
  const [monthDay, setMonthDay] = useState('1');
  const [custom, setCustom] = useState(value || '0 9 * * *');

  // Sync outward whenever any field changes
  useEffect(() => {
    const cron = buildCron(freq, minute, hour, everyNMin, weekDays, monthDay, custom);
    onChange(cron);
  }, [freq, minute, hour, everyNMin, weekDays, monthDay, custom]);

  const toggleDay = (day: string) => {
    setWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const label = freq !== 'custom'
    ? humanLabel(freq, minute, hour, everyNMin, weekDays, monthDay)
    : '';

  return (
    <div className="space-y-4">
      {/* Frequency selector */}
      <div className="space-y-2">
        <Label>Повторять</Label>
        <Select value={freq} onValueChange={(v) => setFreq(v as Frequency)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="every-n-min">Каждые N минут</SelectItem>
            <SelectItem value="hourly">Каждый час</SelectItem>
            <SelectItem value="daily">Каждый день</SelectItem>
            <SelectItem value="weekly">Каждую неделю</SelectItem>
            <SelectItem value="monthly">Каждый месяц</SelectItem>
            <SelectItem value="custom">Произвольно (cron)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Every N minutes */}
      {freq === 'every-n-min' && (
        <div className="space-y-2">
          <Label>Интервал (мин.)</Label>
          <Input
            type="number"
            min={1}
            max={59}
            value={everyNMin}
            onChange={(e) => setEveryNMin(e.target.value)}
            className="w-32"
          />
        </div>
      )}

      {/* Time picker — used by hourly, daily, weekly, monthly */}
      {(freq === 'hourly' || freq === 'daily' || freq === 'weekly' || freq === 'monthly') && (
        <div className="space-y-2">
          <Label>{freq === 'hourly' ? 'Минута (:MM)' : 'Время'}</Label>
          <div className="flex items-center gap-2">
            {freq !== 'hourly' && (
              <>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className="w-20 text-center font-mono"
                  placeholder="ЧЧ"
                />
                <span className="text-muted-foreground font-bold">:</span>
              </>
            )}
            <Input
              type="number"
              min={0}
              max={59}
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className="w-20 text-center font-mono"
              placeholder="ММ"
            />
          </div>
        </div>
      )}

      {/* Day of week — weekly */}
      {freq === 'weekly' && (
        <div className="space-y-2">
          <Label>День недели</Label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`h-9 w-10 rounded-md text-sm font-medium transition-colors border ${
                  weekDays.includes(d.value)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Day of month — monthly */}
      {freq === 'monthly' && (
        <div className="space-y-2">
          <Label>Число месяца</Label>
          <Input
            type="number"
            min={1}
            max={31}
            value={monthDay}
            onChange={(e) => setMonthDay(e.target.value)}
            className="w-24"
          />
        </div>
      )}

      {/* Custom cron */}
      {freq === 'custom' && (
        <div className="space-y-2">
          <Label>
            Cron-выражение{' '}
            <span className="text-muted-foreground font-normal">(5 полей: мин час дм мес дн)</span>
          </Label>
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="0 9 * * 1"
            className="font-mono"
          />
        </div>
      )}

      {/* Human-readable preview */}
      {label && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/40 rounded-md px-3 py-2">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          {label}
        </p>
      )}
    </div>
  );
}
