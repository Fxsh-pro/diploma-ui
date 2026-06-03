import { Handle, Position, type NodeProps } from '@xyflow/react';
import { nodeTypes as nodeTypeDefs } from './node-types';
import { cn } from '../ui/utils';

export type ScenarioNodeData = {
  nodeType: 'http' | 'delay' | 'check' | 'start' | 'terminal';
  nodeData: any;
  label?: string;
};

const handleClass = '!w-4 !h-4 !bg-primary !border-2 !border-background !rounded-full';

export function ScenarioCanvasNode({ data, selected }: NodeProps) {
  const { nodeType, nodeData } = data as ScenarioNodeData;

  if (nodeType === 'start') {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-12 w-32 rounded-lg bg-success text-success-foreground font-semibold shadow-md',
          selected && 'ring-2 ring-primary ring-offset-2',
        )}
      >
        Начало
        <Handle type="source" position={Position.Bottom} className={handleClass} />
      </div>
    );
  }

  if (nodeType === 'terminal') {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-12 w-32 rounded-lg bg-destructive text-destructive-foreground font-semibold shadow-md',
          selected && 'ring-2 ring-primary ring-offset-2',
        )}
      >
        Конец
        <Handle type="target" position={Position.Top} className={handleClass} />
      </div>
    );
  }

  const typeDef = nodeTypeDefs.find((n) => n.type === nodeType);
  if (!typeDef) return null;
  const Icon = typeDef.icon;
  const label = (data as ScenarioNodeData).nodeData?.label;

  return (
    <div
      className={cn(
        'min-w-[200px] rounded-lg border-2 border-border bg-card shadow-md hover:shadow-lg transition-shadow',
        selected && 'ring-2 ring-primary ring-offset-2',
      )}
    >
      <Handle type="target" position={Position.Top} className={handleClass} />
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-t-md text-white', typeDef.color)}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-semibold">{typeDef.label}</span>
      </div>
      {label && (
        <div className="px-3 pt-2 pb-1 text-sm font-semibold text-foreground truncate border-b border-border/50">
          {label}
        </div>
      )}
      <div className={cn('px-3 py-2 text-sm text-muted-foreground', label && 'pt-2')}>
        {nodeType === 'http' && (
          <div className="font-mono text-foreground">
            {nodeData?.method || 'GET'} {nodeData?.url || '/api/endpoint'}
          </div>
        )}
        {nodeType === 'delay' && (
          <div className="font-mono text-foreground">
            Задержка: {nodeData?.duration || '1000'}мс
          </div>
        )}
        {nodeType === 'check' && (
          <div className="font-mono text-foreground">
            {nodeData?.checks?.length
              ? `${nodeData.checks.length} проверок`
              : 'Нет проверок'}
          </div>
        )}
        {nodeType === 'generate' && (
          <div className="font-mono text-foreground">
            {nodeData?.rules?.length
              ? `${nodeData.rules.length} переменных`
              : 'Нет переменных'}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className={handleClass} />
    </div>
  );
}
