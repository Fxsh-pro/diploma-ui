import { useState, useRef, useEffect, useCallback } from "react";
import { CanvasNode } from "./canvas-node";
import { Button } from "../ui/button";
import { ZoomIn, ZoomOut, Maximize2, Undo, Redo, Zap } from "lucide-react";
import { ScenarioNode, NodeConnection } from "./node-types";

// Node visual dimensions used for edge connector math
function nodeHalfW(type: string) {
  return type === 'start' || type === 'terminal' ? 64 : 100;
}
function nodeHeight(type: string) {
  return type === 'start' || type === 'terminal' ? 48 : 80;
}
function getBottom(node: ScenarioNode) {
  return { x: node.x + nodeHalfW(node.type), y: node.y + nodeHeight(node.type) };
}
function getTop(node: ScenarioNode) {
  return { x: node.x + nodeHalfW(node.type), y: node.y };
}

interface CanvasProps {
  nodes: ScenarioNode[];
  edges: NodeConnection[];
  selectedNodeId?: string;
  onNodeSelect?: (id: string) => void;
  onAddNode?: (type: string, x: number, y: number) => void;
  onNodeMove?: (id: string, x: number, y: number) => void;
  draggedNodeType?: string | null;
}

export function Canvas({ nodes, edges, selectedNodeId, onNodeSelect, onAddNode, onNodeMove, draggedNodeType }: CanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const fittedRef = useRef(false);

  // Node dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartRef = useRef<{ nodeX: number; nodeY: number; mouseX: number; mouseY: number } | null>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.5, Math.min(2, prev * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.target === e.currentTarget)) {
      e.preventDefault();
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setDraggingNodeId(nodeId);
    dragStartRef.current = {
      nodeX: node.x,
      nodeY: node.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
  }, [nodes]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId && dragStartRef.current) {
      const dx = (e.clientX - dragStartRef.current.mouseX) / zoom;
      const dy = (e.clientY - dragStartRef.current.mouseY) / zoom;
      onNodeMove?.(
        draggingNodeId,
        dragStartRef.current.nodeX + dx,
        dragStartRef.current.nodeY + dy,
      );
      return;
    }
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    dragStartRef.current = null;
  };

  const handleFitToView = () => {
    if (nodes.length === 0 || !canvasRef.current) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const PADDING = 60;
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs) - PADDING;
    const minY = Math.min(...ys) - PADDING;
    const maxX = Math.max(...nodes.map((n) => n.x + nodeHalfW(n.type) * 2)) + PADDING;
    const maxY = Math.max(...nodes.map((n) => n.y + nodeHeight(n.type))) + PADDING;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = rect.width / (maxX - minX);
    const scaleY = rect.height / (maxY - minY);
    const newZoom = Math.min(scaleX, scaleY, 1);
    setPan({
      x: (rect.width - (maxX - minX) * newZoom) / 2 - minX * newZoom,
      y: (rect.height - (maxY - minY) * newZoom) / 2 - minY * newZoom,
    });
    setZoom(newZoom);
  };

  useEffect(() => {
    if (nodes.length > 0 && !fittedRef.current) {
      fittedRef.current = true;
      setTimeout(handleFitToView, 50);
    }
  }, [nodes]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedNodeType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      onAddNode?.(draggedNodeType, x, y);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative h-full bg-muted/20 overflow-hidden rounded-lg border border-border">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Redo className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setZoom((prev) => Math.min(2, prev * 1.2))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setZoom((prev) => Math.max(0.5, prev * 0.8))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleFitToView}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button variant="ghost" size="sm" className="h-8 gap-1.5">
          <Zap className="h-4 w-4" />
          Validate
        </Button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 z-10 bg-card border border-border rounded-lg px-3 py-2 text-sm font-medium shadow-lg">
        {Math.round(zoom * 100)}%
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`h-full w-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          className="relative h-full w-full"
        >
          {/* Grid background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, var(--color-border) 1px, transparent 1px),
                linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              opacity: 0.3,
            }}
          />

          {/* Edges SVG — rendered below nodes */}
          {edges.length > 0 && (
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="var(--color-muted-foreground)" />
                </marker>
              </defs>
              {edges.map((edge) => {
                const fromNode = nodes.find((n) => n.id === edge.from);
                const toNode = nodes.find((n) => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                const from = getBottom(fromNode);
                const to = getTop(toNode);
                const weight = edge.weight ?? 1;
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                return (
                  <g key={edge.id}>
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="var(--color-muted-foreground)"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                    {weight < 0.99 && (
                      <text
                        x={midX}
                        y={midY}
                        fill="var(--color-primary)"
                        fontSize="11"
                        fontWeight="600"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="select-none"
                      >
                        {Math.round(weight * 100)}%
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* Render nodes */}
          {nodes.map((node) => (
            <CanvasNode
              key={node.id}
              id={node.id}
              type={node.type}
              x={node.x}
              y={node.y}
              data={node.data}
              isSelected={selectedNodeId === node.id}
              onClick={() => onNodeSelect?.(node.id)}
              onDragStart={(e) => handleNodeDragStart(node.id, e)}
            />
          ))}
        </div>
      </div>

      {/* Instructions overlay when empty */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Drag nodes from the toolbox to build your scenario</p>
            <p className="text-sm">Use scroll to zoom, drag to pan</p>
          </div>
        </div>
      )}
    </div>
  );
}
