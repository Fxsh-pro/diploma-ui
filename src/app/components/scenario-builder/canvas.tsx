import { useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ScenarioCanvasNode } from './canvas-node';
import { WeightedEdge } from './weighted-edge';

const rfNodeTypes: NodeTypes = {
  scenarioNode: ScenarioCanvasNode,
};

const rfEdgeTypes: EdgeTypes = {
  weighted: WeightedEdge,
};

interface CanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick: (nodeId: string) => void;
  onEdgeClick: (edgeId: string) => void;
  onAddNode: (type: string, x: number, y: number) => void;
  onPaneClick: () => void;
}

function FlowInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onAddNode,
  onPaneClick,
}: CanvasProps) {
  const { screenToFlowPosition } = useReactFlow();

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      onAddNode(nodeType, position.x, position.y);
    },
    [screenToFlowPosition, onAddNode],
  );

  return (
    <div className="h-full w-full rounded-lg border border-border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick(node.id)}
        onEdgeClick={(_, edge) => onEdgeClick(edge.id)}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        nodeTypes={rfNodeTypes}
        edgeTypes={rfEdgeTypes}
        defaultEdgeOptions={{ type: 'weighted' }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background gap={20} />
        <Controls />
        <MiniMap nodeColor={() => 'var(--color-muted)'} />
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">Drag nodes from the toolbox to build your scenario</p>
              <p className="text-sm">Use scroll to zoom, drag to pan</p>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
}

export function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
}
