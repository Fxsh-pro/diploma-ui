import { API_BASE_URL } from './config';
import { http } from './client';
import type {
  TestRunResponse,
  CreateTestRunRequest,
  MetricPointResponse,
  ReportResponse,
  RunComparisonResponse,
  RunErrorResponse,
} from './types';

async function downloadFile(path: string, filename: string): Promise<void> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const runsApi = {
  list: (status?: string) =>
    http.get<TestRunResponse[]>(`/api/runs${status ? `?status=${status}` : ''}`),

  get: (id: string) => http.get<TestRunResponse>(`/api/runs/${id}`),

  create: (body: CreateTestRunRequest) => http.post<TestRunResponse>('/api/runs', body),

  stop: (id: string) => http.post<void>(`/api/runs/${id}/stop`),

  metrics: (id: string, from: string, to: string, granularity = 30) =>
    http.get<MetricPointResponse[]>(
      `/api/runs/${id}/metrics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&granularity=${granularity}`
    ),

  report: (id: string) => http.get<ReportResponse>(`/api/runs/${id}/report`),

  reportPdf: (id: string) =>
    downloadFile(`/api/runs/${id}/report/pdf`, `loadforge-report-${id.slice(0, 8)}.pdf`),

  rerun: (id: string) => http.post<TestRunResponse>(`/api/runs/${id}/rerun`),

  compare: (id: string, baselineId: string) =>
    http.get<RunComparisonResponse>(`/api/runs/${id}/compare?baselineId=${baselineId}`),

  errors: (id: string) =>
    http.get<RunErrorResponse[]>(`/api/runs/${id}/errors`),
};
