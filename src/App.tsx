import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { initialFamilyTree } from './data/familyTree';
import { buildFamilyTreeGraph } from './lib/familyTreeGraph';
import { FamilyNode } from './nodes/FamilyNode';
import { PersonNode } from './nodes/PersonNode';
import { PrintTreeView } from './views/PrintTreeView';

const graph = buildFamilyTreeGraph(initialFamilyTree);
const rootPerson = initialFamilyTree.people.find(
  (person) => person.id === initialFamilyTree.tree.rootPersonId,
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
          <p className="hero__kicker">React Flow Prototype</p>
          <h1>{initialFamilyTree.tree.title}</h1>
          <p className="hero__text">
            This first pass renders a family graph from the proposed JSON format.
            People are cards, family relationships are connector nodes, and the
            layout is a simple generation-based starter. Darker cards mark the
            direct bloodline around {rootPerson?.displayName ?? 'the root person'};
            lighter cards are spouses entering that branch.
          </p>
        </div>
      </section>

      <section className="canvas-panel">
        <div className="canvas-panel__header">
          <div>
            <h2>Family Tree Graph</h2>
            <p>
              {initialFamilyTree.people.length} people,{' '}
              {initialFamilyTree.families.length} family groups
            </p>
          </div>
          <div className="canvas-panel__actions">
            <a
              className="print-button"
              href={printLayoutUrl.toString()}
              target="_blank"
              rel="noreferrer"
            >
              Open PDF Layout
            </a>
          </div>
          <div className="legend">
            <span className="legend__item">
              <span className="legend__swatch legend__swatch--female-bloodline" />
              Female bloodline
            </span>
            <span className="legend__item">
              <span className="legend__swatch legend__swatch--female-married-in" />
              Female spouse
            </span>
            <span className="legend__item">
              <span className="legend__swatch legend__swatch--male-bloodline" />
              Male bloodline
            </span>
            <span className="legend__item">
              <span className="legend__swatch legend__swatch--male-married-in" />
              Male spouse
            </span>
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
            <Controls />
            <Background
              variant={BackgroundVariant.Dots}
              gap={18}
              size={1.2}
              color="rgba(86, 61, 41, 0.14)"
            />
          </ReactFlow>
        </div>
      </section>
    </main>
  );
}
