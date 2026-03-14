import { useEffect, useState } from "react";
import { usersApi } from "../../api/users";
import { scenariosApi } from "../../api/scenarios";
import { runsApi } from "../../api/runs";
import { useAuth } from "../context/AuthContext";
import type { AuditLogResponse, ScenarioResponse, UserResponse, TestRunResponse } from "../../api/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, string> = {
  CREATED:     "Создан",
  UPDATED:     "Обновлён",
  DELETED:     "Удалён",
  STOPPED:     "Остановлен",
  RERUN:       "Перезапущен",
  CREATE_USER: "Создан пользователь",
  DELETE_USER: "Удалён пользователь",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  SCENARIO: "Сценарий",
  USER:     "Пользователь",
  TEST_RUN: "Тест",
};

const ACTION_COLORS: Record<string, string> = {
  CREATED:     "bg-green-500/15 text-green-400 border border-green-500/30",
  UPDATED:     "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  DELETED:     "bg-red-500/15 text-red-400 border border-red-500/30",
  STOPPED:     "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  RERUN:       "bg-violet-500/15 text-violet-400 border border-violet-500/30",
  CREATE_USER: "bg-green-500/15 text-green-400 border border-green-500/30",
  DELETE_USER: "bg-red-500/15 text-red-400 border border-red-500/30",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

interface EntityMaps {
  scenarios: Map<string, string>;
  users:     Map<string, string>;
  runs:      Map<string, string>;
}

function resolveEntityName(entityType: string, entityId: string, maps: EntityMaps): string {
  if (entityType === "SCENARIO") return maps.scenarios.get(entityId) ?? entityId.slice(0, 8) + "…";
  if (entityType === "USER")     return maps.users.get(entityId)     ?? entityId.slice(0, 8) + "…";
  if (entityType === "TEST_RUN") return maps.runs.get(entityId)      ?? entityId.slice(0, 8) + "…";
  return entityId.slice(0, 8) + "…";
}

interface EntityOption { id: string; label: string }

// ─── component ────────────────────────────────────────────────────────────────

export function HistoryPage() {
  const { canDo } = useAuth();

  const [filterEntityType, setFilterEntityType] = useState("");
  const [filterEntityId,   setFilterEntityId]   = useState("");
  const [filterActorId,    setFilterActorId]    = useState("");

  const [entityOptions,   setEntityOptions]   = useState<EntityOption[]>([]);
  const [actorOptions,    setActorOptions]    = useState<EntityOption[]>([]);
  const [loadingOptions,  setLoadingOptions]  = useState(false);

  const [entries,  setEntries]  = useState<AuditLogResponse[]>([]);
  const [offset,   setOffset]   = useState(0);
  const [hasMore,  setHasMore]  = useState(true);
  const [loading,  setLoading]  = useState(false);

  const [maps, setMaps] = useState<EntityMaps>({
    scenarios: new Map(),
    users:     new Map(),
    runs:      new Map(),
  });

  // ── entity type change: reset id + load options in the same event ───────────
  const handleEntityTypeChange = (newType: string) => {
    setFilterEntityType(newType);
    setFilterEntityId("");
    setEntityOptions([]);
    if (!newType) return;

    setLoadingOptions(true);
    const load = async () => {
      try {
        if (newType === "SCENARIO") {
          const list: ScenarioResponse[] = await scenariosApi.list();
          setEntityOptions(list.map(s => ({ id: s.id, label: s.name })));
          setMaps(m => ({ ...m, scenarios: new Map(list.map(s => [s.id, s.name])) }));
        } else if (newType === "TEST_RUN") {
          const list: TestRunResponse[] = await runsApi.list();
          setEntityOptions(list.map(r => ({ id: r.id, label: r.id.slice(0, 8) + "… (" + r.status + ")" })));
          setMaps(m => ({ ...m, runs: new Map(list.map(r => [r.id, r.id.slice(0, 8) + "…"])) }));
        }
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  };

  // ── fetch entries on filter change (with cleanup to cancel stale requests) ──
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setEntries([]);

    usersApi.auditLog({
      limit:      PAGE_SIZE,
      offset:     0,
      entityType: filterEntityType || undefined,
      entityId:   filterEntityId   || undefined,
      actorId:    filterActorId    || undefined,
    }).then(data => {
      if (cancelled) return;
      setEntries(data);
      setHasMore(data.length === PAGE_SIZE);
      setOffset(data.length);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [filterEntityType, filterEntityId, filterActorId]);

  // ── load more (captures current filter values inline — no stale closure) ───
  const loadMore = () => {
    if (loading || !hasMore) return;
    const snap = { offset, filterEntityType, filterEntityId, filterActorId };
    setLoading(true);

    usersApi.auditLog({
      limit:      PAGE_SIZE,
      offset:     snap.offset,
      entityType: snap.filterEntityType || undefined,
      entityId:   snap.filterEntityId   || undefined,
      actorId:    snap.filterActorId    || undefined,
    }).then(data => {
      setEntries(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setOffset(snap.offset + data.length);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  // ── preload scenario + user name maps and actor options on mount ─────────────
  useEffect(() => {
    scenariosApi.list()
      .then(list => setMaps(m => ({ ...m, scenarios: new Map(list.map(s => [s.id, s.name])) })))
      .catch(() => {});
    if (canDo("MANAGE_USERS")) {
      usersApi.list().then(list => {
        setMaps(m => ({ ...m, users: new Map(list.map(u => [u.id, u.username])) }));
        setActorOptions(list.map(u => ({ id: u.id, label: u.username })));
      }).catch(() => {});
    }
  }, []);

  const handleClearFilters = () => {
    setFilterEntityType("");
    setFilterEntityId("");
    setFilterActorId("");
    setEntityOptions([]);
  };

  const hasActiveFilters = filterEntityType !== "" || filterEntityId !== "" || filterActorId !== "";

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">История изменений</h2>
        <p className="text-muted-foreground">Журнал всех действий в системе</p>
      </div>

      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* operator (who performed the action) */}
        {actorOptions.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Оператор</label>
            <select
              value={filterActorId}
              onChange={e => setFilterActorId(e.target.value)}
              className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[160px]"
            >
              <option value="">Все операторы</option>
              {actorOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* entity type */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Тип сущности</label>
          <select
            value={filterEntityType}
            onChange={e => handleEntityTypeChange(e.target.value)}
            className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[160px]"
          >
            <option value="">Все типы</option>
            <option value="SCENARIO">Сценарий</option>
            <option value="TEST_RUN">Тест</option>
          </select>
        </div>

        {/* entity name dropdown — only when a type is selected */}
        {filterEntityType && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              {ENTITY_TYPE_LABELS[filterEntityType] ?? filterEntityType}
            </label>
            <select
              value={filterEntityId}
              onChange={e => setFilterEntityId(e.target.value)}
              disabled={loadingOptions}
              className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[220px] disabled:opacity-50"
            >
              <option value="">
                {loadingOptions ? "Загрузка…" : "Все"}
              </option>
              {entityOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="self-end h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Сбросить
          </button>
        )}

        {!loading && (
          <span className="self-end text-xs text-muted-foreground ml-auto">
            {entries.length}{hasMore ? "+" : ""} записей
          </span>
        )}
      </div>

      {/* table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Время</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Пользователь</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Действие</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Тип</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Сущность</th>
            </tr>
          </thead>
          <tbody>
            {loading && entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Загрузка…</td>
              </tr>
            )}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Записей не найдено</td>
              </tr>
            )}
            {entries.map((e, idx) => (
              <tr key={e.id} className={idx % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap font-mono text-xs">
                  {formatDate(e.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium">
                  {/* username from backend, fallback to preloaded map, then short uuid */}
                  {e.username ?? maps.users.get(e.userId) ?? e.userId.slice(0, 8) + "…"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[e.action] ?? "bg-muted text-muted-foreground"}`}>
                    {ACTION_LABELS[e.action] ?? e.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {ENTITY_TYPE_LABELS[e.entityType] ?? e.entityType}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {resolveEntityName(e.entityType, e.entityId, maps)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {hasMore && entries.length > 0 && (
          <div className="border-t border-border p-3 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-4 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              {loading ? "Загрузка…" : "Загрузить ещё"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
