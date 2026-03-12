import { http } from './client';
import type { AgentPoolResponse, CreateAgentPoolRequest } from './types';

export const poolsApi = {
  list: () => http.get<AgentPoolResponse[]>('/api/pools'),
  create: (body: CreateAgentPoolRequest) => http.post<AgentPoolResponse>('/api/pools', body),
  delete: (id: string) => http.delete<void>(`/api/pools/${id}`),
  assignAgent: (agentId: string, poolId: string | null) =>
    http.put<void>(`/api/pools/agents/${agentId}`, { poolId }),
};
