import { http } from './client';
import type {
  TestRunResponse,
  CreateTestRunRequest,
  MetricPointResponse,
  ReportResponse,
  RunComparisonResponse,
} from './types';

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

  rerun: (id: string) => http.post<TestRunResponse>(`/api/runs/${id}/rerun`),

  compare: (id: string, baselineId: string) =>
    http.get<RunComparisonResponse>(`/api/runs/${id}/compare?baselineId=${baselineId}`),
};
