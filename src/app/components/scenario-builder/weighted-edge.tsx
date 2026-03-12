import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';

export function WeightedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const weight = (data as any)?.weight ?? 1;
  const condition: string = (data as any)?.condition ?? 'ANY';
  const isConditional = condition === 'PASS' || condition === 'FAIL';

  const strokeColor = selected
    ? 'var(--color-primary)'
    : isConditional
    ? condition === 'PASS'
      ? '#22c55e'
      : '#ef4444'
    : 'var(--color-muted-foreground)';

  const labelBg = isConditional
    ? condition === 'PASS'
      ? 'bg-success/10 border-success/40 text-success'
      : 'bg-destructive/10 border-destructive/40 text-destructive'
    : 'bg-card border-border text-muted-foreground';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: strokeColor, strokeWidth: selected ? 3 : 2 }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={`border rounded px-1.5 py-0.5 text-xs font-semibold nodrag nopan cursor-pointer ${labelBg}`}
        >
          {isConditional ? condition : `${Math.round(weight * 100)}%`}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
