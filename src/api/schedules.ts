import { http } from './client';
import type { ScheduleResponse, CreateScheduleRequest } from './types';

export const schedulesApi = {
  list: () => http.get<ScheduleResponse[]>('/api/schedules'),
  get: (id: string) => http.get<ScheduleResponse>(`/api/schedules/${id}`),
  create: (body: CreateScheduleRequest) => http.post<ScheduleResponse>('/api/schedules', body),
  delete: (id: string) => http.delete<void>(`/api/schedules/${id}`),
  toggle: (id: string, enabled: boolean) => http.patch<void>(`/api/schedules/${id}/toggle`, { enabled }),
};
