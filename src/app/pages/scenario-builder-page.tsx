import { useState, useEffect } from "react";
import { ArrowLeft, Save, Play, Settings } from "lucide-react";
import { Button } from "../components/ui/button";
import { Toolbox } from "../components/scenario-builder/toolbox";
import { Canvas } from "../components/scenario-builder/canvas";
import { PropertiesPanel } from "../components/scenario-builder/properties-panel";
import type { ScenarioNode } from "../components/scenario-builder/node-types";
import { scenariosApi } from "../../api/scenarios";
import type { ScenarioNodeDto, ScenarioGraphDto } from "../../api/types";

interface ScenarioBuilderPageProps {
  scenarioId?: string;
  onBack: () => void;
}

// Map API node types to canvas node types
function apiTypeToCanvas(type: string): ScenarioNode['type'] {
  switch (type) {
    case 'HTTP':  return 'http';
    case 'DELAY': return 'delay';
    case 'CHECK': return 'check';
    default:      return 'http';
  }
}

// Convert API graph nodes to canvas nodes (skip START/TERMINAL, auto-layout)
function graphToCanvasNodes(graph: ScenarioGraphDto): ScenarioNode[] {
  const skip = new Set(['START', 'TERMINAL']);
  const nodes = Object.values(graph.nodes).filter((n) => !skip.has(n.type));
  return nodes.map((n, i) => ({
    id: String(n.id),
    type: apiTypeToCanvas(n.type),
    x: 100,
    y: 150 + i * 130,
    data: n.type === 'HTTP'
      ? { method: n.config.method, url: n.config.url, headers: n.config.headers, body: n.config.body }
      : n.type === 'DELAY'
      ? { duration: n.thinkTimeMs + 'ms' }
      : {},
  }));
}

// Convert canvas nodes back to API graph
function canvasNodesToGraph(nodes: ScenarioNode[], original?: ScenarioGraphDto): ScenarioGraphDto {
  const apiNodes: Record<string, ScenarioNodeDto> = {};
  const edges: ScenarioGraphDto['edges'] = [];

  // START node
  apiNodes['1'] = {
    id: 1, type: 'START', name: 'Start',
    config: { method: '', url: '', headers: {}, body: '' },
    extract: [], thinkTimeMs: 0,
  };

  nodes.forEach((n, i) => {
    const id = i + 2;
    apiNodes[String(id)] = {
      id,
      type: n.type === 'http' ? 'HTTP' : n.type === 'delay' ? 'DELAY' : n.type === 'check' ? 'CHECK' : 'HTTP',
      name: n.type === 'http' ? `${n.data.method || 'GET'} ${n.data.url || ''}` : n.type === 'delay' ? 'Delay' : 'Check',
      config: n.type === 'http'
        ? { method: n.data.method || 'GET', url: n.data.url || '', headers: n.data.headers || {}, body: n.data.body || '' }
        : { method: '', url: '', headers: {}, body: '' },
      extract: [],
      thinkTimeMs: n.type === 'delay' ? parseInt(n.data.duration ?? '0') : 0,
    };
  });

  const terminalId = nodes.length + 2;
  apiNodes[String(terminalId)] = {
    id: terminalId, type: 'TERMINAL', name: 'End',
    config: { method: '', url: '', headers: {}, body: '' },
    extract: [], thinkTimeMs: 0,
  };

  // START → first node
  if (nodes.length > 0) {
    edges.push({ from: 1, to: 2, weight: 1 });
    // chain through all nodes
    for (let i = 2; i < nodes.length + 2; i++) {
      edges.push({ from: i, to: i + 1, weight: 1 });
    }
  } else {
    edges.push({ from: 1, to: terminalId, weight: 1 });
  }

  return {
    startNodeId: 1,
    terminalNodeIds: [terminalId],
    nodes: apiNodes,
    edges,
  };
}

export function ScenarioBuilderPage({ scenarioId, onBack }: ScenarioBuilderPageProps) {
  const [nodes, setNodes] = useState<ScenarioNode[]>([]);
  const [scenarioName, setScenarioName] = useState('Новый сценарий');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!scenarioId) return;
    scenariosApi.get(scenarioId).then((scenario) => {
      setScenarioName(scenario.name);
      setNodes(graphToCanvasNodes(scenario.graph));
    }).catch(() => {});
  }, [scenarioId]);

  const handleAddNode = (type: string, x: number, y: number) => {
    const newNode: ScenarioNode = {
      id: Date.now().toString(),
      type: type as ScenarioNode['type'],
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

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const graph = canvasNodesToGraph(nodes);
      if (scenarioId) {
        await scenariosApi.update(scenarioId, { name: scenarioName, graph });
      } else {
        await scenariosApi.create({ name: scenarioName, graph });
      }
      setSaveMsg('Сохранено');
      setTimeout(() => setSaveMsg(null), 2000);
    } catch {
      setSaveMsg('Ошибка сохранения');
    } finally {
      setSaving(false);
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
            <h1 className="font-semibold">{scenarioName}</h1>
            <p className="text-xs text-muted-foreground">
              {scenarioId ? 'Редактирование сценария' : 'Новый сценарий'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveMsg && <span className="text-sm text-muted-foreground">{saveMsg}</span>}
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button variant="secondary" className="gap-2" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Сохранение…' : 'Сохранить'}
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
