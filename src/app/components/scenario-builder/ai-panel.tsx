import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { generateGraph } from '../../../api/ai';
import type { ScenarioGraphDto, SwaggerSpecResponse } from '../../../api/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface AiPanelProps {
  currentGraph: ScenarioGraphDto | null;
  onGraphGenerated: (graph: ScenarioGraphDto) => void;
  swaggerSpecs: SwaggerSpecResponse[];
  selectedSpecId: string | null;
  onSpecChange: (id: string | null) => void;
}

export function AiPanel({ currentGraph, onGraphGenerated, swaggerSpecs, selectedSpecId, onSpecChange }: AiPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasGraph = currentGraph !== null && Object.keys(currentGraph.nodes).length > 0;
  const selectedSpec = swaggerSpecs.find((s) => s.id === selectedSpecId) ?? null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const graph = await generateGraph({
        prompt: prompt.trim(),
        currentGraph: hasGraph ? currentGraph : null,
        swaggerUrl: selectedSpec?.url ?? null,
      });
      onGraphGenerated(graph);
      if (!hasGraph) setPrompt('');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI-генерация
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 pb-4">
        {swaggerSpecs.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Swagger-спецификация</p>
            <Select
              value={selectedSpecId ?? '__none__'}
              onValueChange={(v) => onSpecChange(v === '__none__' ? null : v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Без спецификации" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Без спецификации</SelectItem>
                {swaggerSpecs.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {hasGraph
            ? 'Опишите изменения, которые нужно внести в текущий граф.'
            : selectedSpec
              ? 'Опишите сценарий высокоуровнево — AI сгенерирует граф, используя API из спецификации.'
              : 'Опишите сценарий нагрузочного тестирования — AI сгенерирует граф автоматически.'}
        </p>

        <textarea
          className="flex-1 min-h-[180px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-y"
          placeholder={
            hasGraph
              ? 'Например: добавь шаг авторизации перед первым HTTP-запросом...'
              : selectedSpec
                ? 'Например: сгенерируй сценарий оформления заказа'
                : 'Например: POST /api/login с телом {username, password}, извлечь token. Затем GET /api/profile с заголовком Authorization: Bearer ${token}.'
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
          }}
          disabled={loading}
        />

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <Button
          className="w-full gap-2"
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasGraph ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? 'Генерация…' : hasGraph ? 'Обновить граф' : 'Сгенерировать'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Ctrl+Enter для отправки
        </p>
      </CardContent>
    </Card>
  );
}
