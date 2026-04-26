import { Handle, Position, type NodeProps } from '@xyflow/react';
import { PersonCard } from '../components/PersonCard';
import type { PersonGraphNode } from '../lib/familyTreeGraph';

export function PersonNode({ data }: NodeProps<PersonGraphNode>) {
  return (
    <PersonCard
      data={data}
      topAdornment={
        data.hasParentConnection ? (
          <Handle type="target" position={Position.Top} className="node-handle" />
        ) : null
      }
      bottomAdornment={
        data.hasChildConnection ? (
          <Handle type="source" position={Position.Bottom} className="node-handle" />
        ) : null
      }
    />
  );
}
