import type { ScenarioGraphDto } from './types';

const AI_BASE_URL = (import.meta as any).env?.VITE_AI_BASE_URL ?? 'http://localhost:8089';

interface GenerateRequest {
  prompt: string;
  currentGraph?: ScenarioGraphDto | null;
  swaggerUrl?: string | null;
}

interface GenerateResponse {
  graph: ScenarioGraphDto;
}

export async function generateGraph(req: GenerateRequest): Promise<ScenarioGraphDto> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${AI_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(req),
    signal: AbortSignal.timeout(180_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = `Ошибка AI сервиса: ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (json.error) message = json.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const data: GenerateResponse = await res.json();
  return data.graph;
}
