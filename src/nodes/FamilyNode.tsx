import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FamilyGraphNode } from '../lib/familyTreeGraph';

export function FamilyNode({ data }: NodeProps<FamilyGraphNode>) {
  return (
    <div className="family-node" title={data.family.id}>
      <Handle type="target" position={Position.Top} className="node-handle" />
      <span className="family-node__dot" />
      <Handle type="source" position={Position.Bottom} className="node-handle" />
    </div>
  );
}
