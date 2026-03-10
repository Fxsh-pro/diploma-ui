import { nodeTypes } from "./node-types";
import { cn } from "../ui/utils";

interface CanvasNodeProps {
  id: string;
  type: string;
  x: number;
  y: number;
  data?: any;
  isSelected?: boolean;
  onClick?: () => void;
  onDragStart?: () => void;
}

export function CanvasNode({ id, type, x, y, data, isSelected, onClick }: CanvasNodeProps) {
  const nodeType = nodeTypes.find((n) => n.type === type);
  
  if (!nodeType) return null;

  const Icon = nodeType.icon;

  return (
    <div
      className={cn(
        "absolute cursor-pointer transition-all",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      style={{ left: x, top: y }}
      onClick={onClick}
    >
      <div className="min-w-[200px] rounded-lg border-2 border-border bg-card shadow-md hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-t-md text-white", nodeType.color)}>
          <Icon className="h-4 w-4" />
          <span className="text-sm font-semibold">{nodeType.label}</span>
        </div>

        {/* Content */}
        <div className="px-3 py-2 text-sm text-muted-foreground">
          {type === 'http' && (
            <div>
              <div className="font-mono text-foreground">
                {data?.method || 'GET'} {data?.url || '/api/endpoint'}
              </div>
              {data?.status && (
                <div className="text-xs mt-1">Status: {data.status}</div>
              )}
            </div>
          )}
          {type === 'delay' && (
            <div className="font-mono text-foreground">
              Think Time: {data?.duration || '2s'}
            </div>
          )}
          {type === 'check' && (
            <div className="font-mono text-foreground">
              {data?.condition || 'Status code = 200'}
            </div>
          )}
          {type === 'data' && (
            <div className="font-mono text-foreground">
              Extract: {data?.variable || 'variable'}
            </div>
          )}
          {type === 'split' && (
            <div className="font-mono text-foreground">
              Probability Split
            </div>
          )}
          {type === 'loop' && (
            <div className="font-mono text-foreground">
              Max iterations: {data?.iterations || 5}
            </div>
          )}
        </div>

        {/* Connection points */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-primary border-2 border-card" />
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-primary border-2 border-card" />
      </div>
    </div>
  );
}
