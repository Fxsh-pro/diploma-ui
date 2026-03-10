import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { FileText, Edit, Trash2, Plus } from "lucide-react";
import { scenariosApi } from "../../../api/scenarios";
import type { ScenarioResponse } from "../../../api/types";

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  return `${Math.floor(hours / 24)} д. назад`;
}

function nodeCount(scenario: ScenarioResponse): number {
  return Object.keys(scenario.graph.nodes).length;
}

interface RecentScenariosProps {
  onCreateNew?: () => void;
  onEdit?: (id: string) => void;
}

export function RecentScenarios({ onCreateNew, onEdit }: RecentScenariosProps) {
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);

  useEffect(() => {
    scenariosApi.list().then((list) => setScenarios(list.slice(0, 5))).catch(() => {});
  }, []);

  const handleDelete = async (id: string) => {
    await scenariosApi.delete(id).catch(() => {});
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние сценарии</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {scenarios.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Нет сценариев</p>
        )}
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{scenario.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{timeAgo(scenario.updatedAt)}</span>
                  <span>•</span>
                  <span>{nodeCount(scenario)} узлов</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit?.(scenario.id)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(scenario.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full mt-4" onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Создать новый сценарий
        </Button>
      </CardContent>
    </Card>
  );
}
