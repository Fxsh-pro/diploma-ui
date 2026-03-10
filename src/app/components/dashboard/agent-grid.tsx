import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../ui/utils";
import { agentsApi } from "../../../api/agents";
import type { AgentResponse } from "../../../api/types";

const statusColors: Record<string, string> = {
  IDLE:        "border-success bg-success/5",
  RUNNING:     "border-accent bg-accent/5",
  STOPPING:    "border-warning bg-warning/5",
  OFFLINE:     "border-border bg-muted",
  REGISTERING: "border-border bg-muted",
};

const statusDots: Record<string, string> = {
  IDLE:        "bg-success",
  RUNNING:     "bg-accent",
  STOPPING:    "bg-warning",
  OFFLINE:     "bg-muted-foreground",
  REGISTERING: "bg-muted-foreground",
};

export function AgentGrid() {
  const [agents, setAgents] = useState<AgentResponse[]>([]);

  useEffect(() => {
    agentsApi.list().then(setAgents).catch(() => {});
    const id = setInterval(() => agentsApi.list().then(setAgents).catch(() => {}), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Статус агентов</CardTitle>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Нет агентов</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={cn(
                  "rounded-lg border-2 p-3 transition-all hover:shadow-md cursor-pointer",
                  statusColors[agent.status] ?? statusColors.OFFLINE
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm truncate">{agent.name}</span>
                  <div className={cn("h-2 w-2 rounded-full shrink-0", statusDots[agent.status] ?? statusDots.OFFLINE)} />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>CPU:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {agent.cpuUsage != null ? `${agent.cpuUsage.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>RAM:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {agent.ramUsage != null ? `${agent.ramUsage.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Статус:</span>
                    <span className="font-mono font-semibold text-foreground">{agent.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
