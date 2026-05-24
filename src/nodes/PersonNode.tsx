import { useEffect, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { PersonCard } from '../components/PersonCard';
import type { PersonGraphNode } from '../lib/familyTreeGraph';

export function PersonNode({ data }: NodeProps<PersonGraphNode>) {
  const [isSearchPulseVisible, setIsSearchPulseVisible] = useState(false);

  useEffect(() => {
    if (!data.isSearchHighlighted || data.searchHighlightKey === undefined) {
      setIsSearchPulseVisible(false);
      return;
    }

    setIsSearchPulseVisible(false);

    const frameHandle = window.requestAnimationFrame(() => {
      setIsSearchPulseVisible(true);
    });
    const timeoutHandle = window.setTimeout(() => {
      setIsSearchPulseVisible(false);
    }, 1450);

    return () => {
      window.cancelAnimationFrame(frameHandle);
      window.clearTimeout(timeoutHandle);
    };
  }, [data.isSearchHighlighted, data.searchHighlightKey]);

  return (
    <PersonCard
      data={data}
      className={isSearchPulseVisible ? 'person-node--search-highlight' : undefined}
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
