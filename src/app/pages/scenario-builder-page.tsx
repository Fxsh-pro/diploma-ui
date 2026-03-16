import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Save, Wrench, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type OnConnect,
  type Connection,
} from '@xyflow/react';
import { Button } from '../components/ui/button';
import { Toolbox } from '../components/scenario-builder/toolbox';
import { AiPanel } from '../components/scenario-builder/ai-panel';
import { Canvas } from '../components/scenario-builder/canvas';
import { PropertiesPanel } from '../components/scenario-builder/properties-panel';
import { EdgePropertiesPanel } from '../components/scenario-builder/edge-properties-panel';
import type { ScenarioNode, NodeConnection } from '../components/scenario-builder/node-types';
import { scenariosApi } from '../../api/scenarios';
import type { ScenarioNodeDto, ScenarioEdgeDto, ScenarioGraphDto } from '../../api/types';

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
    case 'GENERATE': return 'generate';
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
    case 'generate': return 'GENERATE';
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

function graphToCanvas(graph: ScenarioGraphDto): { nodes: Node[]; edges: Edge[] } {
  const apiNodes = Object.values(graph.nodes);

  const userNodes = apiNodes.filter((n) => n.type !== 'START' && n.type !== 'TERMINAL');
  const hasStored = userNodes.length > 0 && userNodes.every((n) => n.x != null && n.y != null);
  const autoPos = hasStored ? null : computeAutoLayout(apiNodes, graph.edges);

  const nodes: Node[] = apiNodes.map((n) => {
    const x = n.x != null && hasStored ? n.x : (autoPos?.get(n.id)?.x ?? 0);
    const y = n.y != null && hasStored ? n.y : (autoPos?.get(n.id)?.y ?? 0);
    return {
      id: String(n.id),
      type: 'scenarioNode',
      position: { x, y },
      data: {
        nodeType: apiTypeToCanvas(n.type),
        nodeData:
          n.type === 'HTTP'
            ? { method: n.config.method, url: n.config.url, headers: n.config.headers || {}, body: n.config.body, extract: n.extract || [] }
            : n.type === 'DELAY'
            ? { duration: String(n.thinkTimeMs) }
            : n.type === 'GENERATE'
            ? { rules: n.generate || [] }
            : n.type === 'CHECK'
            ? { checks: n.checks || [] }
            : {},
      },
    };
  });

  const edges: Edge[] = graph.edges.map((e, i) => ({
    id: `e-${i}`,
    source: String(e.from),
    target: String(e.to),
    type: 'weighted',
    data: { weight: e.weight, condition: e.condition ?? 'ANY' },
  }));

  return { nodes, edges };
}

function canvasToGraph(nodes: Node[], edges: Edge[]): ScenarioGraphDto {
  const apiNodes: Record<string, ScenarioNodeDto> = {};

  for (const n of nodes) {
    const id = parseInt(n.id);
    if (isNaN(id)) continue;

    const nodeType = n.data.nodeType as string;
    const nodeData = n.data.nodeData as any;

    const name =
      nodeType === 'http'     ? `${nodeData?.method || 'GET'} ${nodeData?.url || ''}` :
      nodeType === 'delay'    ? 'Delay' :
      nodeType === 'check'    ? 'Check' :
      nodeType === 'generate' ? 'Generate' :
      nodeType === 'start'    ? 'Start' :
      nodeType === 'terminal' ? 'End' : nodeType;

    apiNodes[String(id)] = {
      id,
      type: canvasTypeToApi(nodeType as ScenarioNode['type']) as any,
      name,
      config: nodeType === 'http'
        ? { method: nodeData?.method || 'GET', url: nodeData?.url || '', headers: nodeData?.headers || {}, body: nodeData?.body || '' }
        : { method: '', url: '', headers: {}, body: '' },
      extract: nodeType === 'http' ? (nodeData?.extract || []) : [],
      generate: nodeType === 'generate' ? (nodeData?.rules || []) : [],
      checks: nodeType === 'check' ? (nodeData?.checks || []) : [],
      thinkTimeMs: nodeType === 'delay' ? parseInt(nodeData?.duration ?? '0') : 0,
      x: n.position.x,
      y: n.position.y,
    };
  }

  const startNode = nodes.find((n) => n.data.nodeType === 'start');
  let startId = startNode ? parseInt(startNode.id) : 1;
  if (!startNode) {
    apiNodes['1'] = {
      id: 1, type: 'START' as any, name: 'Start',
      config: { method: '', url: '', headers: {}, body: '' },
      extract: [], thinkTimeMs: 0,
    };
    startId = 1;
  }

  const terminalNodes = nodes.filter((n) => n.data.nodeType === 'terminal');
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
      .map((e) => ({ from: parseInt(e.source), to: parseInt(e.target), weight: (e.data?.weight as number) ?? 1, condition: (e.data?.condition as string) ?? 'ANY' }))
      .filter((e) => !isNaN(e.from) && !isNaN(e.to));
  } else {
    const userNodes = nodes.filter((n) => n.data.nodeType !== 'start' && n.data.nodeType !== 'terminal');
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
  const { canDo } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [scenarioName, setScenarioName] = useState('Новый сценарий');
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [leftTab, setLeftTab] = useState<'toolbox' | 'ai'>('toolbox');

  useEffect(() => {
    if (!scenarioId) return;
    scenariosApi.get(scenarioId).then((scenario) => {
      setScenarioName(scenario.name);
      const { nodes: n, edges: e } = graphToCanvas(scenario.graph);
      setNodes(n);
      setEdges(e);
    }).catch(() => {});
  }, [scenarioId]);

  const handleAddNode = useCallback((type: string, x: number, y: number) => {
    const newNode: Node = {
      id: Date.now().toString(),
      type: 'scenarioNode',
      position: { x, y },
      data: { nodeType: type, nodeData: {} },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    if (edges.some((e) => e.source === connection.source && e.target === connection.target)) return;
    setEdges((eds) => addEdge({ ...connection, type: 'weighted', data: { weight: 1 } }, eds));
  }, [edges, setEdges]);

  const handleNodeUpdate = (data: any) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, nodeData: data } } : n),
    );
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
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
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  };

  const handleUpdateEdge = (patch: Partial<NodeConnection>) => {
    if (!selectedEdgeId) return;
    setEdges((eds) =>
      eds.map((e) =>
        e.id === selectedEdgeId
          ? {
              ...e,
              data: {
                ...e.data,
                weight: patch.weight ?? (e.data?.weight as number) ?? 1,
                condition: patch.condition ?? (e.data?.condition as string) ?? 'ANY',
              },
            }
          : e,
      ),
    );
  };

  const handleGraphGenerated = useCallback((graph: ScenarioGraphDto) => {
    const { nodes: n, edges: e } = graphToCanvas(graph);
    setNodes(n);
    setEdges(e);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setLeftTab('toolbox');
  }, [setNodes, setEdges]);

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
      setSaveMsg({ text: 'Сохранено', error: false });
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err: unknown) {
      const body = (err as any)?.body;
      if (body?.errors?.length) {
        setSaveMsg({ text: body.errors.map((e: any) => e.message).join('; '), error: true });
      } else {
        setSaveMsg({ text: 'Ошибка сохранения', error: true });
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  // Convert RF nodes/edges to legacy panel formats
  const selectedNodeForPanel = selectedNode
    ? { type: selectedNode.data.nodeType as string, data: selectedNode.data.nodeData }
    : null;

  const selectedEdgeForPanel: NodeConnection | null = selectedEdge
    ? {
        id: selectedEdge.id,
        from: selectedEdge.source,
        to: selectedEdge.target,
        weight: (selectedEdge.data?.weight as number) ?? 1,
        condition: (selectedEdge.data?.condition as NodeConnection['condition']) ?? 'ANY',
      }
    : null;

  const nodesForPanel: ScenarioNode[] = nodes.map((n) => ({
    id: n.id,
    type: n.data.nodeType as ScenarioNode['type'],
    x: n.position.x,
    y: n.position.y,
    data: n.data.nodeData,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Top Bar */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            {editingName ? (
              <input
                ref={nameInputRef}
                className="font-semibold bg-transparent border-b border-primary outline-none w-64"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false); }}
              />
            ) : (
              <h1
                className="font-semibold cursor-pointer hover:text-primary transition-colors"
                title="Нажмите, чтобы переименовать"
                onClick={() => { setEditingName(true); setTimeout(() => nameInputRef.current?.select(), 0); }}
              >
                {scenarioName}
              </h1>
            )}
            <p className="text-xs text-muted-foreground">
              {scenarioId ? 'Редактирование сценария' : 'Новый сценарий'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveMsg && (
            <span className={`text-sm max-w-md truncate ${saveMsg.error ? 'text-destructive' : 'text-muted-foreground'}`} title={saveMsg.text}>
              {saveMsg.text}
            </span>
          )}
          {canDo('MANAGE_SCENARIOS') && (
            <Button variant="secondary" className="gap-2" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-border flex flex-col">
          {/* Tab switcher */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setLeftTab('toolbox')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                leftTab === 'toolbox'
                  ? 'bg-background text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              Ноды
            </button>
            <button
              onClick={() => setLeftTab('ai')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                leftTab === 'ai'
                  ? 'bg-background text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI
            </button>
          </div>
          {/* Tab content */}
          <div className="flex-1 overflow-hidden p-4">
            {leftTab === 'toolbox' ? (
              <Toolbox />
            ) : (
              <AiPanel
                currentGraph={nodes.length > 0 ? canvasToGraph(nodes, edges) : null}
                onGraphGenerated={handleGraphGenerated}
              />
            )}
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 p-4">
          <Canvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleSelectNode}
            onEdgeClick={handleSelectEdge}
            onAddNode={handleAddNode}
            onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }}
          />
        </div>

        {/* Right Sidebar - Properties Panel */}
        {selectedNodeForPanel && selectedNodeForPanel.type !== 'start' && selectedNodeForPanel.type !== 'terminal' && (
          <PropertiesPanel
            nodeType={selectedNodeForPanel.type}
            nodeData={selectedNodeForPanel.data}
            onClose={() => setSelectedNodeId(null)}
            onUpdate={handleNodeUpdate}
            onDelete={handleDeleteNode}
          />
        )}
        {selectedEdgeForPanel && (
          <EdgePropertiesPanel
            edge={selectedEdgeForPanel}
            nodes={nodesForPanel}
            onClose={() => setSelectedEdgeId(null)}
            onUpdate={handleUpdateEdge}
            onDelete={handleDeleteEdge}
          />
        )}
      </div>
    </div>
  );
}
