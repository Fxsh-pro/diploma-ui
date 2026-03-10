import { http } from './client';
import type { ScenarioResponse, CreateScenarioRequest, UpdateScenarioRequest } from './types';

export const scenariosApi = {
  list: () => http.get<ScenarioResponse[]>('/api/scenarios'),
  get: (id: string) => http.get<ScenarioResponse>(`/api/scenarios/${id}`),
  create: (body: CreateScenarioRequest) => http.post<ScenarioResponse>('/api/scenarios', body),
  update: (id: string, body: UpdateScenarioRequest) => http.put<ScenarioResponse>(`/api/scenarios/${id}`, body),
  delete: (id: string) => http.delete<void>(`/api/scenarios/${id}`),
};
