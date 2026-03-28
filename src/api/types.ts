// ─── Auth ────────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export type Action =
  | 'MANAGE_AGENTS'
  | 'MANAGE_POOLS'
  | 'GENERATE_TOKEN'
  | 'MANAGE_SCENARIOS'
  | 'MANAGE_TEST_RUNS'
  | 'VIEW_METRICS'
  | 'MANAGE_USERS'
  | 'VIEW_AUDIT_LOG'
  | 'MANAGE_SCHEDULES';

// ─── Agents ──────────────────────────────────────────────────────────────────

export type AgentStatus = 'OFFLINE' | 'REGISTERING' | 'IDLE' | 'RUNNING' | 'STOPPING';

export interface AgentPoolResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface CreateAgentPoolRequest {
  name: string;
  description?: string;
}

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
  poolId: string | null;
  cpuModel: string | null;
  cpuCores: number | null;
  cpuFreqMhz: number | null;
  ramTotalMb: number | null;
  currentVus: number;
}

export interface AgentTokenResponse {
  token: string;
  installCommand: string;
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

export type NodeType = 'START' | 'HTTP' | 'DELAY' | 'CHECK' | 'GENERATE' | 'TERMINAL';
export type ExtractFrom = 'BODY' | 'HEADER';
export type CheckOp = 'EQ' | 'NE' | 'LT' | 'LE' | 'GT' | 'GE' | 'CONTAINS' | 'NOT_CONTAINS' | 'EXISTS';

export interface CheckRuleDto {
  variable: string;
  op: CheckOp;
  value?: string;
}
export type GenerateType = 'UUID' | 'EMAIL' | 'TIMESTAMP' | 'RANDOM_INT' | 'RANDOM_STRING';

export interface GenerateRuleDto {
  name: string;
  type: GenerateType;
  min?: number;
  max?: number;
  length?: number;
}

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
  generate: GenerateRuleDto[];
  checks: CheckRuleDto[];
  thinkTimeMs: number;
  x?: number;
  y?: number;
}

export type EdgeCondition = 'ANY' | 'PASS' | 'FAIL';

export interface ScenarioEdgeDto {
  from: number;
  to: number;
  weight: number;
  condition?: EdgeCondition;
}

export interface ScenarioGraphDto {
  startNodeId: number;
  terminalNodeIds: number[];
  nodes: Record<string, ScenarioNodeDto>;
  edges: ScenarioEdgeDto[];
}

export interface SwaggerSpecResponse {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface CreateSwaggerSpecRequest {
  name: string;
  url: string;
}

export interface ScenarioResponse {
  id: string;
  name: string;
  description: string | null;
  graph: ScenarioGraphDto;
  createdAt: string;
  updatedAt: string;
  swaggerSpecId?: string | null;
}

export interface CreateScenarioRequest {
  name: string;
  description?: string;
  graph: ScenarioGraphDto;
  swaggerSpecId?: string | null;
}

export interface UpdateScenarioRequest {
  name: string;
  description?: string;
  graph: ScenarioGraphDto;
  swaggerSpecId?: string | null;
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
  failureReason?: string | null;
  parentRunId?: string | null;
  baseUrl?: string | null;
}

export interface PassFailCriteriaDto {
  maxErrorRate?: number | null;    // 0–100 %
  maxLatencyP99Ms?: number | null; // ms
}

export interface CreateTestRunRequest {
  scenarioId: string;
  profileType: ProfileType;
  profileParams: Record<string, number>;
  totalVus: number;
  criteria?: PassFailCriteriaDto | null;
  poolId?: string | null;
  baseUrl?: string | null;
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export interface RunErrorResponse {
  message: string;
  count: number;
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
  timeSeries: MetricPointResponse[];
}

export interface RunComparisonResponse {
  current: ReportResponse;
  baseline: ReportResponse;
}

// ─── Schedules ────────────────────────────────────────────────────────────────

export type ScheduleType = 'ONE_TIME' | 'RECURRING';

export interface ScheduleResponse {
  id: string;
  organizationId: string;
  scenarioId: string;
  name: string;
  scheduleType: ScheduleType;
  scheduledAt: string | null;
  cronExpression: string | null;
  profileType: ProfileType;
  totalVus: number;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  poolId: string | null;
}

export interface CreateScheduleRequest {
  name: string;
  scenarioId: string;
  scheduleType: ScheduleType;
  scheduledAt?: string | null;
  cronExpression?: string | null;
  profileType: ProfileType;
  profileParams: Record<string, number>;
  totalVus: number;
  criteria?: PassFailCriteriaDto | null;
  poolId?: string | null;
}

// ─── History / Audit Log ──────────────────────────────────────────────────────

export type HistoryEntityType = 'SCENARIO' | 'USER' | 'TEST_RUN';

export interface AuditLogResponse {
  id: string;
  userId: string;
  username: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payload: string | null;
  createdAt: string;
}
