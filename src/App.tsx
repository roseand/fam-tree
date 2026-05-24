import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  clearPersistedUploadedFamilyTree,
  exampleFamilyTreePreview,
  getExampleFamilyTreeState,
  loadInitialFamilyTreeState,
  parseUploadedFamilyTreeJson,
  persistUploadedFamilyTree,
  uploadFormatDocumentation,
  uploadFormatPreview,
} from './lib/familyTree';
import { JsonCodeBlock } from './components/JsonCodeBlock';
import { buildFamilyTreeGraph } from './lib/familyTreeGraph';
import { FamilyNode } from './nodes/FamilyNode';
import { PersonNode } from './nodes/PersonNode';
import { PrintTreeView } from './views/PrintTreeView';

const nodeTypes = {
  person: PersonNode,
  family: FamilyNode,
};

export default function App() {
  const [treeState, setTreeState] = useState(() => loadInitialFamilyTreeState());
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [copiedPreviewKey, setCopiedPreviewKey] = useState<
    'upload-format' | 'example-file' | null
  >(null);
  const copyResetTimeoutRef = useRef<number | null>(null);

  const currentTree = treeState.data;
  const graph = useMemo(() => buildFamilyTreeGraph(currentTree), [currentTree]);
  const rootPerson = currentTree.people.find(
    (person) => person.id === currentTree.tree.rootPersonId,
  );
  const isPrintView =
    new URLSearchParams(window.location.search).get('view') === 'print';

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      setUploadError('Please choose a .json file.');
      return;
    }

    try {
      const jsonText = await file.text();
      const uploadedTree = parseUploadedFamilyTreeJson(jsonText, file.name);

      persistUploadedFamilyTree(uploadedTree);
      setTreeState({
        data: uploadedTree,
        source: 'uploaded',
        sourceLabel: 'uploaded JSON',
      });
      setUploadFileName(file.name);
      setUploadError(null);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'The JSON file could not be loaded.',
      );
    }
  }

  function handleUseExampleData() {
    clearPersistedUploadedFamilyTree();
    setTreeState(getExampleFamilyTreeState());
    setUploadFileName(null);
    setUploadError(null);
  }

  async function handleCopyPreview(
    previewText: string,
    previewKey: 'upload-format' | 'example-file',
  ) {
    try {
      await navigator.clipboard.writeText(previewText);
      setCopiedPreviewKey(previewKey);

      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopiedPreviewKey((currentKey) =>
          currentKey === previewKey ? null : currentKey,
        );
      }, 1600);
    } catch {
      setUploadError('Could not copy the preview text to the clipboard.');
    }
  }

  if (isPrintView) {
    return (
      <PrintTreeView
        graph={graph}
        treeData={currentTree}
        dataSourceLabel={treeState.sourceLabel}
      />
    );
  }

  const printLayoutUrl = new URL(window.location.href);
  printLayoutUrl.searchParams.set('view', 'print');

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <div className="hero__eyebrow">
            <img
              className="hero__mark"
              src="/fallen-leaf.png"
              alt=""
              aria-hidden="true"
            />
            <p className="hero__kicker">Family Tree Visualiser</p>
            <p className="hero__tag">
              Showing {treeState.source === 'uploaded' ? 'uploaded JSON' : 'example data'}
            </p>
          </div>
          <h1>Family Tree Visualiser</h1>
          <p className="hero__text">
            Start with the bundled example, then replace it with your own single
            JSON file using the same family-tree structure. The graph and PDF
            export update from that uploaded data immediately.
          </p>
        </div>
      </section>

      <section className="data-panel">
        <div className="data-panel__layout">
          <div className="data-panel__content">
            <h2>Load Your Own JSON</h2>
            <p>
              Upload one `.json` file that contains `tree`, `people`, and
              `families`. Inside `tree`, both `title` and `rootPersonId` are
              required. The bundled example now uses that exact same single-file
              structure.
            </p>
            <div className="data-panel__actions">
              <label className="print-button" htmlFor="family-tree-upload">
                Choose JSON File
              </label>
              <input
                id="family-tree-upload"
                className="upload-input"
                type="file"
                accept=".json,application/json,text/json"
                onChange={handleFileChange}
              />
              {treeState.source === 'uploaded' ? (
                <button
                  type="button"
                  className="print-button print-button--secondary"
                  onClick={handleUseExampleData}
                >
                  Use Example Data
                </button>
              ) : null}
            </div>
            <p className="data-panel__status">
              Current tree: {currentTree.tree.title}
              {uploadFileName ? ` (${uploadFileName})` : ''}
            </p>
            <p className="data-panel__notice">
              The bundled example comes from `data-example/family-tree.json`.
              Your uploaded JSON only changes the current browser session.
            </p>
            {uploadError ? (
              <p className="data-panel__error" role="alert">
                {uploadError}
              </p>
            ) : null}
          </div>

          <div className="format-preview">
            <details className="format-preview__section">
              <summary>
                <span>Expected Upload Format</span>
                <span className="format-preview__summary-actions">
                  <button
                    type="button"
                    className="format-preview__copy-button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleCopyPreview(uploadFormatPreview, 'upload-format');
                    }}
                  >
                    {copiedPreviewKey === 'upload-format' ? 'Copied' : 'Copy'}
                  </button>
                  <span className="format-preview__chevron" aria-hidden="true">
                    ▸
                  </span>
                </span>
              </summary>
              <JsonCodeBlock jsonText={uploadFormatPreview} />
            </details>

            <details className="format-preview__section">
              <summary>
                <span>Upload Format Documentation</span>
                <span className="format-preview__summary-actions">
                  <span className="format-preview__chevron" aria-hidden="true">
                    ▸
                  </span>
                </span>
              </summary>
              <div className="format-docs">
                {uploadFormatDocumentation.map((section) => (
                  <section className="format-docs__section" key={section.title}>
                    <h3>{section.title}</h3>
                    <div className="format-docs__list">
                      {section.items.map((item) => (
                        <article
                          className="format-docs__item"
                          key={`${section.title}-${item.keyPath}`}
                        >
                          <div className="format-docs__item-header">
                            <code className="format-docs__key">{item.keyPath}</code>
                            <span
                              className={
                                item.required === 'Yes'
                                  ? 'format-docs__required format-docs__required--yes'
                                  : 'format-docs__required format-docs__required--no'
                              }
                            >
                              {item.required === 'Yes' ? 'Required' : 'Optional'}
                            </span>
                          </div>
                          <p className="format-docs__meta">
                            <strong>Type:</strong> {item.type}
                          </p>
                          {item.acceptedValues ? (
                            <p className="format-docs__meta">
                              <strong>Accepted:</strong> {item.acceptedValues}
                            </p>
                          ) : null}
                          {item.notes ? (
                            <p className="format-docs__meta">
                              <strong>Notes:</strong> {item.notes}
                            </p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </details>

            <details className="format-preview__section">
              <summary>
                <span>Bundled Example File Preview</span>
                <span className="format-preview__summary-actions">
                  <button
                    type="button"
                    className="format-preview__copy-button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleCopyPreview(
                        exampleFamilyTreePreview,
                        'example-file',
                      );
                    }}
                  >
                    {copiedPreviewKey === 'example-file' ? 'Copied' : 'Copy'}
                  </button>
                  <span className="format-preview__chevron" aria-hidden="true">
                    ▸
                  </span>
                </span>
              </summary>
              <section className="format-preview__card">
                <h3>family-tree.json</h3>
                <JsonCodeBlock jsonText={exampleFamilyTreePreview} />
              </section>
            </details>
          </div>
        </div>
      </section>

      <section className="canvas-panel">
        <div className="canvas-panel__header">
          <div>
            <h2>Interactive Graph</h2>
            <p>
              {currentTree.people.length} people, {currentTree.families.length}{' '}
              family groups, root person {rootPerson?.displayName ?? 'unknown'}
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
            minZoom={0.04}
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
