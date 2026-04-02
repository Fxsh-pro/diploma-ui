import { useEffect, useState } from "react";
import { Server, Plus, Copy, Check, Trash2, LayoutGrid, Columns3 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { cn } from "../components/ui/utils";
import { agentsApi } from "../../api/agents";
import { poolsApi } from "../../api/pools";
import type { AgentResponse, AgentPoolResponse } from "../../api/types";
import { useAuth } from "../context/AuthContext";

const statusConfig: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  IDLE:        { color: "text-success",          bg: "bg-success/10 border-success",   dot: "bg-success",          label: "🟢 Онлайн (Простой)" },
  RUNNING:     { color: "text-accent",           bg: "bg-accent/10 border-accent",     dot: "bg-accent",           label: "🟣 Выполняется тест" },
  STOPPING:    { color: "text-warning",          bg: "bg-warning/10 border-warning",   dot: "bg-warning",          label: "🟡 Остановка" },
  OFFLINE:     { color: "text-muted-foreground", bg: "bg-muted border-muted",          dot: "bg-muted-foreground", label: "⚫ Офлайн" },
  REGISTERING: { color: "text-muted-foreground", bg: "bg-muted border-muted",          dot: "bg-muted-foreground", label: "⏳ Регистрация" },
};

// ─── Draggable agent mini-card (used in pool view) ────────────────────────────

function AgentMiniCard({ agent }: { agent: AgentResponse }) {
  const config = statusConfig[agent.status] ?? statusConfig.OFFLINE;
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('agentId', agent.id)}
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-grab active:cursor-grabbing select-none",
        config.bg
      )}
    >
      <div className={cn("h-2 w-2 rounded-full flex-shrink-0", config.dot)} />
      <span className="text-sm font-medium truncate flex-1">{agent.name}</span>
      {agent.cpuUsage != null && (
        <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
          CPU {agent.cpuUsage.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

// ─── Drop column ──────────────────────────────────────────────────────────────

interface PoolColumnProps {
  poolId: string | null;
  label: string;
  agents: AgentResponse[];
  onDrop: (agentId: string, poolId: string | null) => void;
  onDelete?: () => void;
}

function PoolColumn({ poolId, label, agents, onDrop, onDelete }: PoolColumnProps) {
  const [over, setOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setOver(true);
  };
  const handleDragLeave = () => setOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    const agentId = e.dataTransfer.getData('agentId');
    if (agentId) onDrop(agentId, poolId);
  };

  return (
    <div className="flex flex-col min-w-[220px] max-w-[280px] flex-1">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{label}</span>
          <Badge variant="secondary" className="text-xs">{agents.length}</Badge>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex-1 min-h-[200px] rounded-xl border-2 border-dashed p-3 space-y-2 transition-colors",
          over
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20"
        )}
      >
        {agents.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Перетащите агента сюда
          </div>
        ) : (
          agents.map((a) => <AgentMiniCard key={a.id} agent={a} />)
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AgentsPage() {
  const { canDo } = useAuth();
  const [agents, setAgents] = useState<AgentResponse[]>([]);
  const [pools, setPools] = useState<AgentPoolResponse[]>([]);
  const [installCmd, setInstallCmd] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'pools'>('cards');

  // pool create dialog
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolDesc, setNewPoolDesc] = useState('');

  const loadAgents = () => agentsApi.list().then(setAgents).catch(() => {});
  const loadPools  = () => poolsApi.list().then(setPools).catch(() => {});

  useEffect(() => {
    loadAgents();
    loadPools();
    const id = setInterval(loadAgents, 10_000);
    return () => clearInterval(id);
  }, []);

  const handleGenerateToken = async () => {
    try {
      const { installCommand } = await agentsApi.generateToken();
      setInstallCmd(installCommand);
      setTimeout(() => setInstallCmd(null), 15_000);
    } catch { /* ignore */ }
  };

  const handleCopy = () => {
    if (!installCmd) return;
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreatePool = async () => {
    if (!newPoolName.trim()) return;
    try {
      await poolsApi.create({ name: newPoolName.trim(), description: newPoolDesc.trim() || undefined });
      setNewPoolName('');
      setNewPoolDesc('');
      setShowCreatePool(false);
      loadPools();
    } catch { /* ignore */ }
  };

  const handleDeletePool = async (poolId: string) => {
    try {
      await poolsApi.delete(poolId);
      loadPools();
      loadAgents();
    } catch { /* ignore */ }
  };

  const handleAssignPool = async (agentId: string, poolId: string | null) => {
    try {
      await poolsApi.assignAgent(agentId, poolId);
      // optimistic update
      setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, poolId } : a));
    } catch { loadAgents(); }
  };

  const online  = agents.filter((a) => a.status !== 'OFFLINE' && a.status !== 'REGISTERING').length;
  const running = agents.filter((a) => a.status === 'RUNNING').length;

  const poolName = (poolId: string | null) =>
    poolId ? (pools.find((p) => p.id === poolId)?.name ?? poolId.slice(0, 8) + '…') : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление агентами</h2>
          <p className="text-muted-foreground">
            Управление и мониторинг распределенных агентов нагрузочного тестирования
          </p>
        </div>
        <div className="flex gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors",
                viewMode === 'cards'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Карточки
            </button>
            <button
              onClick={() => setViewMode('pools')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-l border-border",
                viewMode === 'pools'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Пулы
            </button>
          </div>
          {canDo('MANAGE_POOLS') && (
            <Button variant="outline" className="gap-2" onClick={() => setShowCreatePool(true)}>
              <Plus className="h-4 w-4" />
              Создать пул
            </Button>
          )}
          {canDo('GENERATE_TOKEN') && (
            <Button className="gap-2" onClick={handleGenerateToken}>
              <Plus className="h-4 w-4" />
              Добавить агент
            </Button>
          )}
        </div>
      </div>

      {/* Install command */}
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

      {/* Stats */}
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
            <CardTitle className="text-sm text-muted-foreground">Пулов</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pools.length}</div></CardContent>
        </Card>
      </div>

      {/* ── POOLS VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'pools' && (
        <div className="overflow-x-auto pb-4">
          {pools.length === 0 && agents.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
              Создайте пул и зарегистрируйте агентов, чтобы управлять ими здесь.
            </div>
          ) : (
            <div className="flex gap-5 min-w-max">
              {/* Unassigned column — always visible */}
              <PoolColumn
                poolId={null}
                label="Без пула"
                agents={agents.filter((a) => !a.poolId)}
                onDrop={(agentId) => handleAssignPool(agentId, null)}
              />

              {/* One column per pool */}
              {pools.map((pool) => (
                <PoolColumn
                  key={pool.id}
                  poolId={pool.id}
                  label={pool.name}
                  agents={agents.filter((a) => a.poolId === pool.id)}
                  onDrop={(agentId) => handleAssignPool(agentId, pool.id)}
                  onDelete={canDo('MANAGE_POOLS') ? () => handleDeletePool(pool.id) : undefined}
                />
              ))}

              {/* Quick-add pool column */}
              {canDo('MANAGE_POOLS') && (
                <div className="flex flex-col min-w-[180px] justify-start pt-8">
                  <button
                    onClick={() => setShowCreatePool(true)}
                    className="flex items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Новый пул
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── CARDS VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'cards' && (
        <>

          {/* Agent cards */}
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
                        <div className="flex-1 min-w-0">
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
                          <div className="flex justify-between text-sm mb-1">
                            <div>
                              <span className="text-muted-foreground">CPU</span>
                              {agent.cpuCores != null && (
                                <span className="text-muted-foreground ml-1.5 text-xs">({agent.cpuCores} ядер)</span>
                              )}
                            </div>
                            <span className="font-mono font-semibold">
                              {agent.cpuUsage != null ? `${agent.cpuUsage.toFixed(1)}%` : '—'}
                            </span>
                          </div>
                          {agent.cpuModel && (
                            <p className="text-xs text-muted-foreground truncate mb-1" title={agent.cpuModel}>
                              {agent.cpuModel}
                            </p>
                          )}
                          <Progress value={agent.cpuUsage ?? 0} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-muted-foreground">RAM</span>
                            <span className="font-mono font-semibold">
                              {agent.ramUsage != null && agent.ramTotalMb != null
                                ? `${((agent.ramUsage / 100) * agent.ramTotalMb / 1024).toFixed(1)} / ${(agent.ramTotalMb / 1024).toFixed(1)} ГБ`
                                : agent.ramUsage != null
                                  ? `${agent.ramUsage.toFixed(1)}%`
                                  : '—'}
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
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-muted-foreground shrink-0">URL:</span>
                          <Badge variant="secondary" className="font-mono text-xs text-right break-all">{agent.url}</Badge>
                        </div>
                        {agent.currentVus > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Активных VU:</span>
                            <span className="font-mono text-xs font-semibold text-accent">{agent.currentVus}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Последний пинг:</span>
                          <span className="font-mono text-xs">
                            {agent.lastSeen ? new Date(agent.lastSeen).toLocaleTimeString() : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Pool assignment dropdown */}
                      <div className="pt-3 border-t border-border">
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Пул</Label>
                        <Select
                          value={agent.poolId ?? 'none'}
                          onValueChange={(v) => handleAssignPool(agent.id, v === 'none' ? null : v)}
                          disabled={pools.length === 0}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue>
                              {agent.poolId ? (
                                <span className="text-accent">{poolName(agent.poolId)}</span>
                              ) : (
                                <span className="text-muted-foreground">— без пула —</span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">— без пула —</SelectItem>
                            {pools.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create pool dialog */}
      <Dialog open={showCreatePool} onOpenChange={setShowCreatePool}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Создать пул агентов</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="pool-name">Название пула</Label>
              <Input
                id="pool-name"
                placeholder="Например: High-CPU, External, EU-West"
                value={newPoolName}
                onChange={(e) => setNewPoolName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePool()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pool-desc">Описание (необязательно)</Label>
              <Input
                id="pool-desc"
                placeholder="Краткое описание назначения пула"
                value={newPoolDesc}
                onChange={(e) => setNewPoolDesc(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreatePool(false)}>Отмена</Button>
              <Button onClick={handleCreatePool} disabled={!newPoolName.trim()}>Создать</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
