import { X, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { EdgeCondition, NodeConnection, ScenarioNode } from "./node-types";

interface EdgePropertiesPanelProps {
  edge: NodeConnection;
  nodes: ScenarioNode[];
  onClose: () => void;
  onUpdate: (patch: Partial<NodeConnection>) => void;
  onDelete: () => void;
}

export function EdgePropertiesPanel({ edge, nodes, onClose, onUpdate, onDelete }: EdgePropertiesPanelProps) {
  const fromNode = nodes.find((n) => n.id === edge.from);
  const isFromCheck = fromNode?.type === 'check';
  const toNode = nodes.find((n) => n.id === edge.to);

  const fromLabel = fromNode
    ? fromNode.type === 'start' ? 'Начало'
    : fromNode.type === 'terminal' ? 'Конец'
    : fromNode.type === 'http' ? `${fromNode.data?.method || 'GET'} ${fromNode.data?.url || ''}`
    : fromNode.type
    : edge.from;

  const toLabel = toNode
    ? toNode.type === 'start' ? 'Начало'
    : toNode.type === 'terminal' ? 'Конец'
    : toNode.type === 'http' ? `${toNode.data?.method || 'GET'} ${toNode.data?.url || ''}`
    : toNode.type
    : edge.to;

  return (
    <div className="w-80 h-full border-l border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold">Свойства связи</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Откуда</Label>
            <div className="text-sm font-mono bg-muted rounded px-2 py-1.5 truncate">{fromLabel}</div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Куда</Label>
            <div className="text-sm font-mono bg-muted rounded px-2 py-1.5 truncate">{toLabel}</div>
          </div>

          {/* Condition — only relevant for edges from a Check node */}
          {isFromCheck && (
            <div className="space-y-2">
              <Label>Условие</Label>
              <Select
                value={edge.condition ?? 'ANY'}
                onValueChange={(val) => onUpdate({ condition: val as EdgeCondition })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASS">✓ PASS — все проверки прошли</SelectItem>
                  <SelectItem value="FAIL">✗ FAIL — есть проваленные проверки</SelectItem>
                  <SelectItem value="ANY">ANY — всегда (по умолчанию)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Исполнитель выбирает PASS/FAIL-связи на основе результата проверки. ANY-связь используется, если ни одно условие не подошло.
              </p>
            </div>
          )}

          {!isFromCheck && <div className="space-y-2">
            <Label htmlFor="weight">Вес</Label>
            <div className="flex items-center gap-2">
              <Input
                id="weight"
                type="number"
                value={edge.weight ?? 1}
                min={0}
                max={1}
                step={0.05}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 1) {
                    onUpdate({ weight: val });
                  }
                }}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {Math.round((edge.weight ?? 1) * 100)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Вероятность выбора этого пути (0.0–1.0). Сумма весов исходящих связей должна равняться 1.0.
            </p>
          </div>}

          <div className="pt-4 border-t border-border">
            <Button variant="destructive" className="w-full gap-2" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              Удалить связь
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
