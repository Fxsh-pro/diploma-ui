import { useState, useEffect } from "react";
import { ArrowLeft, Save, Play, Settings } from "lucide-react";
import { Button } from "../components/ui/button";
import { Toolbox } from "../components/scenario-builder/toolbox";
import { Canvas } from "../components/scenario-builder/canvas";
import { PropertiesPanel } from "../components/scenario-builder/properties-panel";
import { EdgePropertiesPanel } from "../components/scenario-builder/edge-properties-panel";
import type { ScenarioNode, NodeConnection } from "../components/scenario-builder/node-types";
import { scenariosApi } from "../../api/scenarios";
import type { ScenarioNodeDto, ScenarioEdgeDto, ScenarioGraphDto } from "../../api/types";

interface ScenarioBuilderPageProps {
  scenarioId?: string;
  onBack: () => void;
}

// ─── Type mapping ─────────────────────────────────────────────────────────────

function apiTypeToCanvas(type: string): ScenarioNode['type'] {
  switch (type) {
    case 'START':    return 'start';
    case 'HTTP':     return 'http';
    case 'DELAY':    return 'delay';
    case 'CHECK':    return 'check';
    case 'TERMINAL': return 'terminal';
    default:         return 'http';
  }
}

function canvasTypeToApi(type: ScenarioNode['type']): string {
  switch (type) {
    case 'start':    return 'START';
    case 'terminal': return 'TERMINAL';
    case 'http':     return 'HTTP';
    case 'delay':    return 'DELAY';
    case 'check':    return 'CHECK';
    default:         return 'HTTP';
  }
}

// ─── Auto-layout (BFS layering) ───────────────────────────────────────────────

function computeAutoLayout(
  apiNodes: ScenarioNodeDto[],
  apiEdges: ScenarioEdgeDto[],
): Map<number, { x: number; y: number }> {
  const children = new Map<number, number[]>();
  const inDegree = new Map<number, number>();
  for (const n of apiNodes) {
    children.set(n.id, []);
    inDegree.set(n.id, 0);
  }
  for (const e of apiEdges) {
    children.get(e.from)?.push(e.to);
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
  }

  const layer = new Map<number, number>();
  const tempDeg = new Map(inDegree);
  const queue: number[] = [];
  for (const [id, deg] of tempDeg) {
    if (deg === 0) { queue.push(id); layer.set(id, 0); }
  }
  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const next of children.get(curr) ?? []) {
      const newLayer = (layer.get(curr) ?? 0) + 1;
      layer.set(next, Math.max(layer.get(next) ?? 0, newLayer));
      tempDeg.set(next, tempDeg.get(next)! - 1);
      if (tempDeg.get(next) === 0) queue.push(next);
    }
  }

  const byLayer = new Map<number, number[]>();
  for (const [id, l] of layer) {
    if (!byLayer.has(l)) byLayer.set(l, []);
    byLayer.get(l)!.push(id);
  }

  const LAYER_DX = 280;
  const NODE_DY = 150;
  const maxInLayer = Math.max(...[...byLayer.values()].map((v) => v.length));
  const totalH = (maxInLayer - 1) * NODE_DY;

  const positions = new Map<number, { x: number; y: number }>();
  for (const [l, ids] of byLayer) {
    const colH = (ids.length - 1) * NODE_DY;
    const yOffset = (totalH - colH) / 2;
    ids.forEach((id, i) => {
      positions.set(id, { x: l * LAYER_DX, y: yOffset + i * NODE_DY });
    });
  }
  return positions;
}

// ─── Graph ↔ Canvas conversion ────────────────────────────────────────────────

function graphToCanvas(graph: ScenarioGraphDto): { nodes: ScenarioNode[]; edges: NodeConnection[] } {
  const apiNodes = Object.values(graph.nodes);

  const userNodes = apiNodes.filter((n) => n.type !== 'START' && n.type !== 'TERMINAL');
  const hasStored = userNodes.length > 0 && userNodes.every((n) => n.x != null && n.y != null);
  const autoPos = hasStored ? null : computeAutoLayout(apiNodes, graph.edges);

  const nodes: ScenarioNode[] = apiNodes.map((n) => {
    const x = (n.x != null && hasStored) ? n.x : (autoPos?.get(n.id)?.x ?? 0);
    const y = (n.y != null && hasStored) ? n.y : (autoPos?.get(n.id)?.y ?? 0);
    return {
      id: String(n.id),
      type: apiTypeToCanvas(n.type),
      x,
      y,
      data: n.type === 'HTTP'
        ? { method: n.config.method, url: n.config.url, headers: n.config.headers || {}, body: n.config.body, extract: n.extract || [] }
        : n.type === 'DELAY'
        ? { duration: String(n.thinkTimeMs) }
        : {},
    };
  });

  const edges: NodeConnection[] = graph.edges.map((e, i) => ({
    id: `e-${i}`,
    from: String(e.from),
    to: String(e.to),
    weight: e.weight,
  }));

  return { nodes, edges };
}

function canvasToGraph(nodes: ScenarioNode[], edges: NodeConnection[]): ScenarioGraphDto {
  const apiNodes: Record<string, ScenarioNodeDto> = {};

  for (const n of nodes) {
    const id = parseInt(n.id);
    if (isNaN(id)) continue;

    const name =
      n.type === 'http'     ? `${n.data?.method || 'GET'} ${n.data?.url || ''}` :
      n.type === 'delay'    ? 'Delay' :
      n.type === 'check'    ? 'Check' :
      n.type === 'start'    ? 'Start' :
      n.type === 'terminal' ? 'End' : n.type;

    apiNodes[String(id)] = {
      id,
      type: canvasTypeToApi(n.type) as any,
      name,
      config: n.type === 'http'
        ? { method: n.data?.method || 'GET', url: n.data?.url || '', headers: n.data?.headers || {}, body: n.data?.body || '' }
        : { method: '', url: '', headers: {}, body: '' },
      extract: n.type === 'http' ? (n.data?.extract || []) : [],
      thinkTimeMs: n.type === 'delay' ? parseInt(n.data?.duration ?? '0') : 0,
      x: n.x,
      y: n.y,
    };
  }

  // Ensure START node exists
  const startNode = nodes.find((n) => n.type === 'start');
  let startId = startNode ? parseInt(startNode.id) : 1;
  if (!startNode) {
    apiNodes['1'] = {
      id: 1, type: 'START' as any, name: 'Start',
      config: { method: '', url: '', headers: {}, body: '' },
      extract: [], thinkTimeMs: 0,
    };
    startId = 1;
  }

  // Ensure TERMINAL node exists
  const terminalNodes = nodes.filter((n) => n.type === 'terminal');
  let terminalIds = terminalNodes.map((n) => parseInt(n.id));
  if (terminalNodes.length === 0) {
    const maxId = Math.max(1, ...Object.keys(apiNodes).map(Number)) + 1;
    apiNodes[String(maxId)] = {
      id: maxId, type: 'TERMINAL' as any, name: 'End',
      config: { method: '', url: '', headers: {}, body: '' },
      extract: [], thinkTimeMs: 0,
    };
    terminalIds = [maxId];
  }

  let apiEdges: ScenarioEdgeDto[];
  if (edges.length > 0) {
    apiEdges = edges
      .map((e) => ({ from: parseInt(e.from), to: parseInt(e.to), weight: e.weight ?? 1 }))
      .filter((e) => !isNaN(e.from) && !isNaN(e.to));
  } else {
    const userNodes = nodes.filter((n) => n.type !== 'start' && n.type !== 'terminal');
    apiEdges = [];
    if (userNodes.length > 0) {
      apiEdges.push({ from: startId, to: parseInt(userNodes[0].id), weight: 1 });
      for (let i = 0; i < userNodes.length - 1; i++) {
        apiEdges.push({ from: parseInt(userNodes[i].id), to: parseInt(userNodes[i + 1].id), weight: 1 });
      }
      apiEdges.push({ from: parseInt(userNodes[userNodes.length - 1].id), to: terminalIds[0], weight: 1 });
    } else {
      apiEdges.push({ from: startId, to: terminalIds[0], weight: 1 });
    }
  }

  return {
    startNodeId: startId,
    terminalNodeIds: terminalIds,
    nodes: apiNodes,
    edges: apiEdges,
  };
}

// ─── Page component ───────────────────────────────────────────────────────────

export function ScenarioBuilderPage({ scenarioId, onBack }: ScenarioBuilderPageProps) {
  const [nodes, setNodes] = useState<ScenarioNode[]>([]);
  const [edges, setEdges] = useState<NodeConnection[]>([]);
  const [scenarioName, setScenarioName] = useState('Новый сценарий');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!scenarioId) return;
    scenariosApi.get(scenarioId).then((scenario) => {
      setScenarioName(scenario.name);
      const { nodes: n, edges: e } = graphToCanvas(scenario.graph);
      setNodes(n);
      setEdges(e);
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
    setNodes((prev) => [...prev, newNode]);
    setDraggedNodeType(null);
  };

  const handleNodeMove = (id: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
  };

  const handleNodeUpdate = (data: any) => {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.map((n) => (n.id === selectedNodeId ? { ...n, data } : n)));
  };

  const handleAddEdge = (from: string, to: string) => {
    if (edges.some((e) => e.from === from && e.to === to)) return;
    const newEdge: NodeConnection = {
      id: `e-${Date.now()}`,
      from,
      to,
      weight: 1,
    };
    setEdges((prev) => [...prev, newEdge]);
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setEdges((prev) => prev.filter((e) => e.from !== selectedNodeId && e.to !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleSelectNode = (id: string) => {
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  };

  const handleSelectEdge = (id: string) => {
    setSelectedEdgeId(id);
    setSelectedNodeId(null);
  };

  const handleDeleteEdge = () => {
    if (!selectedEdgeId) return;
    setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  };

  const handleUpdateEdge = (patch: Partial<NodeConnection>) => {
    if (!selectedEdgeId) return;
    setEdges((prev) => prev.map((e) => (e.id === selectedEdgeId ? { ...e, ...patch } : e)));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const graph = canvasToGraph(nodes, edges);
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
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

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
            edges={edges}
            selectedNodeId={selectedNodeId || undefined}
            selectedEdgeId={selectedEdgeId || undefined}
            onNodeSelect={handleSelectNode}
            onEdgeSelect={handleSelectEdge}
            onAddNode={handleAddNode}
            onNodeMove={handleNodeMove}
            onAddEdge={handleAddEdge}
            draggedNodeType={draggedNodeType}
          />
        </div>

        {/* Right Sidebar - Properties Panel */}
        {selectedNode && selectedNode.type !== 'start' && selectedNode.type !== 'terminal' && (
          <PropertiesPanel
            nodeType={selectedNode.type}
            nodeData={selectedNode.data}
            onClose={() => setSelectedNodeId(null)}
            onUpdate={handleNodeUpdate}
            onDelete={handleDeleteNode}
          />
        )}
        {selectedEdge && (
          <EdgePropertiesPanel
            edge={selectedEdge}
            nodes={nodes}
            onClose={() => setSelectedEdgeId(null)}
            onUpdate={handleUpdateEdge}
            onDelete={handleDeleteEdge}
          />
        )}
      </div>
    </div>
  );
}
