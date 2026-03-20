import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

const FALLBACK_WIDTH = 220;
const FALLBACK_HEIGHT = 90;
const H_GAP = 60;
const V_GAP = 80;

export function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: H_GAP, ranksep: V_GAP });

  nodes.forEach((n) => {
    const w = n.measured?.width ?? FALLBACK_WIDTH;
    const h = n.measured?.height ?? FALLBACK_HEIGHT;
    g.setNode(n.id, { width: w, height: h });
  });
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map((n) => {
    const w = n.measured?.width ?? FALLBACK_WIDTH;
    const h = n.measured?.height ?? FALLBACK_HEIGHT;
    const pos = g.node(n.id);
    return { ...n, position: { x: pos.x - w / 2, y: pos.y - h / 2 } };
  });
}
