import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { nodeTypes } from './node-types';
import { cn } from '../ui/utils';
import { Search } from 'lucide-react';
import { useState } from 'react';

export function Toolbox() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = nodeTypes.filter((node) =>
    node.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const categories = {
    system: filteredNodes.filter((n) => n.category === 'system'),
    request: filteredNodes.filter((n) => n.category === 'request'),
    logic: filteredNodes.filter((n) => n.category === 'logic'),
    control: filteredNodes.filter((n) => n.category === 'control'),
  };

  const categoryLabels: Record<string, string> = {
    system: 'Системные узлы',
    request: 'HTTP-запросы',
    logic: 'Логика',
    control: 'Управление потоком',
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Панель узлов</CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск узлов..."
            className="h-8 pl-8 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
        {(Object.keys(categories) as (keyof typeof categories)[]).map((cat) => {
          const items = categories[cat];
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                {categoryLabels[cat]}
              </h4>
              <div className="space-y-1.5">
                {items.map((node) => {
                  const Icon = node.icon;
                  return (
                    <div
                      key={node.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow', node.type);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md border border-border bg-card cursor-move hover:bg-accent/50 transition-colors',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded text-white',
                          node.color,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{node.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
