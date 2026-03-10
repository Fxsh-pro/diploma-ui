// ─── Agents ──────────────────────────────────────────────────────────────────

export type AgentStatus = 'OFFLINE' | 'REGISTERING' | 'IDLE' | 'RUNNING' | 'STOPPING';

export interface AgentResponse {
  id: string;
  name: string;
  hostname: string;
  url: string;
  status: AgentStatus;
  cpuUsage: number | null;
  ramUsage: number | null;
  lastSeen: string | null;
  createdAt: string;
}

export interface AgentTokenResponse {
  token: string;
  installCommand: string;
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

export type NodeType = 'START' | 'HTTP' | 'DELAY' | 'CHECK' | 'TERMINAL';
export type ExtractFrom = 'BODY' | 'HEADER';

export interface ExtractRuleDto {
  name: string;
  from: ExtractFrom;
  path: string;
}

export interface NodeConfigDto {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

export interface ScenarioNodeDto {
  id: number;
  type: NodeType;
  name: string;
  config: NodeConfigDto;
  extract: ExtractRuleDto[];
  thinkTimeMs: number;
  x?: number;
  y?: number;
}

export interface ScenarioEdgeDto {
  from: number;
  to: number;
  weight: number;
}

export interface ScenarioGraphDto {
  startNodeId: number;
  terminalNodeIds: number[];
  nodes: Record<string, ScenarioNodeDto>;
  edges: ScenarioEdgeDto[];
}

export interface ScenarioResponse {
  id: string;
  name: string;
  description: string | null;
  graph: ScenarioGraphDto;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScenarioRequest {
  name: string;
  description?: string;
  graph: ScenarioGraphDto;
}

export interface UpdateScenarioRequest {
  name: string;
  description?: string;
  graph: ScenarioGraphDto;
}

// ─── Test Runs ────────────────────────────────────────────────────────────────

export type TestRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED' | 'DONE';
export type ProfileType = 'RAMP_UP' | 'CONSTANT' | 'STEP' | 'SPIKE';

export interface TestRunResponse {
  id: string;
  status: TestRunStatus;
  scenarioId: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface CreateTestRunRequest {
  scenarioId: string;
  profileType: ProfileType;
  profileParams: Record<string, number>;
  totalVus: number;
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export interface MetricPointResponse {
  time: string;
  rps: number;
  latencyP50: number;
  latencyP90: number;
  latencyP99: number;
  errorRate: number;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface ReportResponse {
  runId: string;
  scenarioName: string;
  durationSeconds: number;
  totalRequests: number;
  avgRps: number;
  latencyP50: number;
  latencyP90: number;
  latencyP99: number;
  errorRate: number;
}
