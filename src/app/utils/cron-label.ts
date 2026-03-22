export function cronToLabel(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;
  const [min, hour, dom, month, dow] = parts;

  if (dom === '*' && month === '*' && dow === '*') {
    if (hour === '*') {
      if (min === '*') return 'Каждую минуту';
      if (min.startsWith('*/')) return `Каждые ${min.slice(2)} мин.`;
      return `Каждый час в :${min.padStart(2, '0')}`;
    }
    if (min === '0') return `Каждый день в ${hour}:00`;
    return `Каждый день в ${hour}:${min.padStart(2, '0')}`;
  }

  if (dom === '*' && month === '*' && dow !== '*') {
    const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    const dayName = days[Number(dow)] ?? dow;
    if (min === '0') return `Каждый ${dayName} в ${hour}:00`;
    return `Каждый ${dayName} в ${hour}:${min.padStart(2, '0')}`;
  }

  return expr;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
