import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { familyTreeData, familyTreeDataSource } from './lib/familyTree';
import { buildFamilyTreeGraph } from './lib/familyTreeGraph';
import { FamilyNode } from './nodes/FamilyNode';
import { PersonNode } from './nodes/PersonNode';
import { PrintTreeView } from './views/PrintTreeView';

const graph = buildFamilyTreeGraph(familyTreeData);
const rootPerson = familyTreeData.people.find(
  (person) => person.id === familyTreeData.tree.rootPersonId,
);

const nodeTypes = {
  person: PersonNode,
  family: FamilyNode,
};

export default function App() {
  const isPrintView =
    new URLSearchParams(window.location.search).get('view') === 'print';

  if (isPrintView) {
    return <PrintTreeView graph={graph} />;
  }

  const printLayoutUrl = new URL(window.location.href);
  printLayoutUrl.searchParams.set('view', 'print');

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <div className="hero__eyebrow">
            <p className="hero__kicker">Family Tree Visualiser</p>
            <p className="hero__tag">Loaded from data/{familyTreeDataSource}</p>
          </div>
          <h1>Family Tree Visualiser</h1>
          <p className="hero__text">
            Explore family data as an interactive graph and export the same
            layout as tiled A4 PDF pages. The current sample is centered around{' '}
            {rootPerson?.displayName ?? 'the root person'} and uses color to
            separate bloodline members from spouses joining the tree.
          </p>
        </div>
      </section>

      <section className="canvas-panel">
        <div className="canvas-panel__header">
          <div>
            <h2>Interactive Graph</h2>
            <p>
              {familyTreeData.people.length} people,{' '}
              {familyTreeData.families.length} family groups, root person{' '}
              {rootPerson?.displayName ?? 'unknown'}
            </p>
          </div>
          <div className="canvas-panel__actions">
            <a className="print-button" href={printLayoutUrl.toString()}>
              Open PDF Export
            </a>
          </div>
        </div>

        <div className="flow-frame">
          <ReactFlow
            nodes={graph.nodes}
            edges={graph.edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            zoomOnDoubleClick={false}
            minZoom={0.2}
          >
            <Controls showInteractive={false} />
            <Background
              variant={BackgroundVariant.Dots}
              gap={18}
              size={1.2}
              color="rgba(100, 116, 139, 0.22)"
            />
          </ReactFlow>
        </div>
      </section>
    </main>
  );
}
