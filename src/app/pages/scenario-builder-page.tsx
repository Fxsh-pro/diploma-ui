import { useState } from "react";
import { ArrowLeft, Save, Play, Settings } from "lucide-react";
import { Button } from "../components/ui/button";
import { Toolbox } from "../components/scenario-builder/toolbox";
import { Canvas } from "../components/scenario-builder/canvas";
import { PropertiesPanel } from "../components/scenario-builder/properties-panel";
import { ScenarioNode } from "../components/scenario-builder/node-types";

export function ScenarioBuilderPage({ onBack }: { onBack: () => void }) {
  const [nodes, setNodes] = useState<ScenarioNode[]>([
    {
      id: "1",
      type: "http",
      x: 100,
      y: 150,
      data: { method: "GET", url: "/api/products", status: 200 },
    },
    {
      id: "2",
      type: "delay",
      x: 100,
      y: 280,
      data: { duration: "2s" },
    },
    {
      id: "3",
      type: "split",
      x: 100,
      y: 410,
      data: {},
    },
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);

  const handleAddNode = (type: string, x: number, y: number) => {
    const newNode: ScenarioNode = {
      id: Date.now().toString(),
      type: type as any,
      x,
      y,
      data: {},
    };
    setNodes([...nodes, newNode]);
    setDraggedNodeType(null);
  };

  const handleDeleteNode = () => {
    if (selectedNodeId) {
      setNodes(nodes.filter((n) => n.id !== selectedNodeId));
      setSelectedNodeId(null);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Top Bar */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Shopping Cart Scenario</h1>
            <p className="text-xs text-muted-foreground">Last saved 2 minutes ago</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button variant="secondary" className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button className="gap-2">
            <Play className="h-4 w-4" />
            Run Test
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Toolbox */}
        <div className="w-64 border-r border-border p-4">
          <Toolbox onNodeDragStart={setDraggedNodeType} />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 p-4">
          <Canvas
            nodes={nodes}
            selectedNodeId={selectedNodeId || undefined}
            onNodeSelect={setSelectedNodeId}
            onAddNode={handleAddNode}
            draggedNodeType={draggedNodeType}
          />
        </div>

        {/* Right Sidebar - Properties Panel */}
        {selectedNode && (
          <PropertiesPanel
            nodeType={selectedNode.type}
            nodeData={selectedNode.data}
            onClose={() => setSelectedNodeId(null)}
            onDelete={handleDeleteNode}
          />
        )}
      </div>
    </div>
  );
}
