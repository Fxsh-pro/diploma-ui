import { useEffect, useState } from "react";
import { Activity, Server, FileText, Play } from "lucide-react";
import { StatCard } from "../components/stat-card";
import { ActiveTestsTable } from "../components/dashboard/active-tests-table";
import { AgentGrid } from "../components/dashboard/agent-grid";
import { RecentScenarios } from "../components/dashboard/recent-scenarios";
import { agentsApi } from "../../api/agents";
import { scenariosApi } from "../../api/scenarios";
import { runsApi } from "../../api/runs";

interface DashboardPageProps {
  onViewRun?: (runId: string) => void;
  onCreateScenario?: () => void;
  onEditScenario?: (id: string) => void;
}

export function DashboardPage({ onViewRun, onCreateScenario, onEditScenario }: DashboardPageProps) {
  const [runningCount, setRunningCount] = useState<number | null>(null);
  const [agentStats, setAgentStats] = useState<{ online: number; total: number } | null>(null);
  const [scenarioCount, setScenarioCount] = useState<number | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [agents, scenarios, allRuns] = await Promise.all([
          agentsApi.list(),
          scenariosApi.list(),
          runsApi.list(),
        ]);
        const online = agents.filter((a) => a.status !== 'OFFLINE' && a.status !== 'REGISTERING').length;
        setAgentStats({ online, total: agents.length });
        setScenarioCount(scenarios.length);
        setRunningCount(allRuns.filter((r) => r.status === 'RUNNING').length);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        setTodayCount(allRuns.filter((r) => new Date(r.createdAt) >= startOfDay).length);
      } catch {
        // silently ignore
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Выполняется тестов"
          value={runningCount != null ? String(runningCount) : '…'}
          icon={Activity}
        />
        <StatCard
          title="Активные агенты"
          value={agentStats != null ? `${agentStats.online}/${agentStats.total}` : '…'}
          icon={Server}
          subtitle={agentStats != null
            ? `${agentStats.total > 0 ? Math.round((agentStats.online / agentStats.total) * 100) : 0}% онлайн`
            : undefined}
        />
        <StatCard
          title="Всего сценариев"
          value={scenarioCount != null ? String(scenarioCount) : '…'}
          icon={FileText}
        />
        <StatCard
          title="Тестов сегодня"
          value={todayCount != null ? String(todayCount) : '…'}
          icon={Play}
        />
      </div>

      <ActiveTestsTable onView={onViewRun} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentScenarios onCreateNew={onCreateScenario} onEdit={onEditScenario} />
        <AgentGrid />
      </div>
    </div>
  );
}
