import { nodeTypes } from "./node-types";
import { cn } from "../ui/utils";

interface CanvasNodeProps {
  id: string;
  type: string;
  x: number;
  y: number;
  data?: any;
  isSelected?: boolean;
  isConnecting?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
  onOutputPortClick?: (e: React.MouseEvent) => void;
  onInputPortClick?: (e: React.MouseEvent) => void;
}

function OutputPort({ onClick }: { onClick?: (e: React.MouseEvent) => void }) {
  return (
    <div
      className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full border-2 border-card cursor-pointer bg-primary hover:bg-primary/80 hover:scale-125 transition-transform z-10"
      onMouseDown={(e) => { e.stopPropagation(); onClick?.(e); }}
      title="Drag to connect"
    />
  );
}

function InputPort({ onClick, highlight }: { onClick?: (e: React.MouseEvent) => void; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full border-2 border-card cursor-pointer z-10 transition-all",
        highlight ? "bg-primary scale-125 ring-2 ring-primary/50" : "bg-primary hover:bg-primary/80 hover:scale-125"
      )}
      onMouseDown={(e) => { e.stopPropagation(); onClick?.(e); }}
      title="Click to connect here"
    />
  );
}

export function CanvasNode({ id, type, x, y, data, isSelected, isConnecting, onClick, onDragStart, onOutputPortClick, onInputPortClick }: CanvasNodeProps) {
  if (type === 'start') {
    return (
      <div
        className={cn("absolute cursor-move", isSelected && "ring-2 ring-primary ring-offset-2 rounded-lg")}
        style={{ left: x, top: y }}
        onMouseDown={onDragStart}
        onClick={onClick}
      >
        <div className="relative flex items-center justify-center h-12 w-32 rounded-lg bg-success text-success-foreground font-semibold shadow-md">
          Start
          <OutputPort onClick={onOutputPortClick} />
        </div>
      </div>
    );
  }

  if (type === 'terminal') {
    return (
      <div
        className={cn("absolute cursor-move", isSelected && "ring-2 ring-primary ring-offset-2 rounded-lg")}
        style={{ left: x, top: y }}
        onMouseDown={onDragStart}
        onClick={onClick}
      >
        <div className="relative flex items-center justify-center h-12 w-32 rounded-lg bg-destructive text-destructive-foreground font-semibold shadow-md">
          End
          <InputPort onClick={onInputPortClick} highlight={isConnecting} />
        </div>
      </div>
    );
  }

  const nodeType = nodeTypes.find((n) => n.type === type);
  if (!nodeType) return null;

  const Icon = nodeType.icon;

  return (
    <div
      className={cn(
        "absolute cursor-move transition-all",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      style={{ left: x, top: y }}
      onMouseDown={onDragStart}
      onClick={onClick}
    >
      <div className="relative min-w-[200px] rounded-lg border-2 border-border bg-card shadow-md hover:shadow-lg transition-shadow">
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
            </div>
          )}
          {type === 'delay' && (
            <div className="font-mono text-foreground">
              Think Time: {data?.duration || '1000'}ms
            </div>
          )}
          {type === 'check' && (
            <div className="font-mono text-foreground">
              {data?.condition || 'Status code = 200'}
            </div>
          )}
        </div>

        {/* Connection ports */}
        <OutputPort onClick={onOutputPortClick} />
        <InputPort onClick={onInputPortClick} highlight={isConnecting} />
      </div>
    </div>
  );
}
