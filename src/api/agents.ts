import { http } from './client';
import type { AgentResponse, AgentTokenResponse } from './types';

export const agentsApi = {
  list: () => http.get<AgentResponse[]>('/api/agents'),
  generateToken: () => http.post<AgentTokenResponse>('/api/agents/tokens'),
};
