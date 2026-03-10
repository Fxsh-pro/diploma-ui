import { useEffect, useState } from "react";
import { Server, Plus, Copy, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { cn } from "../components/ui/utils";
import { agentsApi } from "../../api/agents";
import type { AgentResponse } from "../../api/types";

const statusConfig: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  IDLE:        { color: "text-success",          bg: "bg-success/10 border-success",   dot: "bg-success",          label: "🟢 Онлайн (Простой)" },
  RUNNING:     { color: "text-accent",           bg: "bg-accent/10 border-accent",     dot: "bg-accent",           label: "🟣 Выполняется тест" },
  STOPPING:    { color: "text-warning",          bg: "bg-warning/10 border-warning",   dot: "bg-warning",          label: "🟡 Остановка" },
  OFFLINE:     { color: "text-muted-foreground", bg: "bg-muted border-muted",          dot: "bg-muted-foreground", label: "⚫ Офлайн" },
  REGISTERING: { color: "text-muted-foreground", bg: "bg-muted border-muted",          dot: "bg-muted-foreground", label: "⏳ Регистрация" },
};

export function AgentsPage() {
  const [agents, setAgents] = useState<AgentResponse[]>([]);
  const [installCmd, setInstallCmd] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => agentsApi.list().then(setAgents).catch(() => {});

  useEffect(() => {
    load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, []);

  const handleGenerateToken = async () => {
    try {
      const { installCommand } = await agentsApi.generateToken();
      setInstallCmd(installCommand);
    } catch {
      // silently ignore
    }
  };

  const handleCopy = () => {
    if (!installCmd) return;
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const online  = agents.filter((a) => a.status !== 'OFFLINE' && a.status !== 'REGISTERING').length;
  const running = agents.filter((a) => a.status === 'RUNNING').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление агентами</h2>
          <p className="text-muted-foreground">
            Управление и мониторинг распределенных агентов нагрузочного тестирования
          </p>
        </div>
        <Button className="gap-2" onClick={handleGenerateToken}>
          <Plus className="h-4 w-4" />
          Добавить агент
        </Button>
      </div>

      {installCmd && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <p className="text-sm font-semibold">Команда установки агента:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted rounded px-3 py-2 font-mono break-all">{installCmd}</code>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Всего агентов</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{agents.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Онлайн</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">{online}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Выполняются</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-accent">{running}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Офлайн</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{agents.length - online}</div>
          </CardContent>
        </Card>
      </div>

      {agents.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Нет зарегистрированных агентов. Нажмите «Добавить агент» для получения команды установки.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const config = statusConfig[agent.status] ?? statusConfig.OFFLINE;
            return (
              <Card key={agent.id} className={cn("border-2", config.bg)}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className={cn("h-2 w-2 rounded-full", config.dot)} />
                        <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">CPU</span>
                        <span className="font-mono font-semibold">
                          {agent.cpuUsage != null ? `${agent.cpuUsage.toFixed(1)}%` : '—'}
                        </span>
                      </div>
                      <Progress value={agent.cpuUsage ?? 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">RAM</span>
                        <span className="font-mono font-semibold">
                          {agent.ramUsage != null ? `${agent.ramUsage.toFixed(1)}%` : '—'}
                        </span>
                      </div>
                      <Progress value={agent.ramUsage ?? 0} className="h-2" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Хост:</span>
                      <span className="font-mono text-xs">{agent.hostname}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">URL:</span>
                      <Badge variant="secondary" className="font-mono text-xs max-w-[150px] truncate">{agent.url}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Последний пинг:</span>
                      <span className="font-mono text-xs">
                        {agent.lastSeen ? new Date(agent.lastSeen).toLocaleTimeString() : '—'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
