import { useState, useRef, useEffect } from "react";
import { CanvasNode } from "./canvas-node";
import { Button } from "../ui/button";
import { ZoomIn, ZoomOut, Maximize2, Undo, Redo, Zap } from "lucide-react";
import { ScenarioNode } from "./node-types";

interface CanvasProps {
  nodes: ScenarioNode[];
  selectedNodeId?: string;
  onNodeSelect?: (id: string) => void;
  onAddNode?: (type: string, x: number, y: number) => void;
  draggedNodeType?: string | null;
}

export function Canvas({ nodes, selectedNodeId, onNodeSelect, onAddNode, draggedNodeType }: CanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.5, Math.min(2, prev * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

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
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
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
        className="h-full w-full cursor-grab active:cursor-grabbing"
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

          {/* Start Node */}
          <div className="absolute top-20 left-20">
            <div className="flex items-center justify-center h-12 w-32 rounded-lg bg-success text-success-foreground font-semibold shadow-md">
              Start
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-success border-2 border-card" />
          </div>

          {/* Arrow from start */}
          {nodes.length > 0 && (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
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
              <line
                x1={86}
                y1={52}
                x2={nodes[0]?.x + 100}
                y2={nodes[0]?.y}
                stroke="var(--color-muted-foreground)"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
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
            />
          ))}

          {/* Connections between nodes */}
          {nodes.length > 1 && (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              {nodes.slice(0, -1).map((node, index) => {
                const nextNode = nodes[index + 1];
                return (
                  <g key={`connection-${node.id}-${nextNode.id}`}>
                    <line
                      x1={node.x + 100}
                      y1={node.y + 60}
                      x2={nextNode.x + 100}
                      y2={nextNode.y}
                      stroke="var(--color-muted-foreground)"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                    <text
                      x={(node.x + nextNode.x + 200) / 2}
                      y={(node.y + nextNode.y + 60) / 2}
                      fill="var(--color-primary)"
                      fontSize="12"
                      fontWeight="600"
                    >
                      100%
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
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
