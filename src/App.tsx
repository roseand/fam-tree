import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type ReactFlowInstance,
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

const INITIAL_SEARCH_PANEL_POSITION = {
  x: 64,
  y: 14,
};

export default function App() {
  const [treeState, setTreeState] = useState(() => loadInitialFamilyTreeState());
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [copiedPreviewKey, setCopiedPreviewKey] = useState<
    'example-file' | null
  >(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDraggingSearch, setIsDraggingSearch] = useState(false);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [searchHighlightKey, setSearchHighlightKey] = useState(0);
  const [searchPanelPosition, setSearchPanelPosition] = useState(() => ({
    ...INITIAL_SEARCH_PANEL_POSITION,
  }));
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const searchHighlightTimeoutRef = useRef<number | null>(null);
  const flowFrameRef = useRef<HTMLDivElement | null>(null);
  const searchPanelRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchDragRef = useRef<{
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    panelWidth: number;
    panelHeight: number;
  } | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const currentTree = treeState.data;
  const graph = useMemo(() => buildFamilyTreeGraph(currentTree), [currentTree]);
  const interactiveGraph = useMemo(() => {
    return {
      ...graph,
      nodes: graph.nodes.map((node) => {
        if (node.type !== 'person') {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            isSearchHighlighted: node.id === highlightedNodeId,
            searchHighlightKey:
              node.id === highlightedNodeId ? searchHighlightKey : undefined,
          },
        };
      }),
    };
  }, [graph, highlightedNodeId, searchHighlightKey]);
  const rootPerson = currentTree.people.find(
    (person) => person.id === currentTree.tree.rootPersonId,
  );
  const isPrintView =
    new URLSearchParams(window.location.search).get('view') === 'print';
  const liveNormalizedSearchTerm = searchTerm.trim().toLowerCase();
  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();
  const searchMatches = useMemo(() => {
    if (normalizedSearchTerm.length < 3) {
      return [];
    }

    return currentTree.people.filter((person) =>
      person.displayName.toLowerCase().includes(normalizedSearchTerm),
    );
  }, [currentTree.people, normalizedSearchTerm]);
  const activeMatchIndex = searchMatches.length
    ? currentMatchIndex % searchMatches.length
    : 0;
  const activeMatch = searchMatches[activeMatchIndex] ?? null;

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      if (searchHighlightTimeoutRef.current !== null) {
        window.clearTimeout(searchHighlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [currentTree.tree.id]);

  useEffect(() => {
    if (!reactFlowInstance || isPrintView) {
      return;
    }

    let fitViewHandle: number | null = null;
    const renderHandle = window.requestAnimationFrame(() => {
      fitViewHandle = window.requestAnimationFrame(() => {
        void reactFlowInstance.fitView({
          padding: 0.2,
          duration: 420,
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(renderHandle);

      if (fitViewHandle !== null) {
        window.cancelAnimationFrame(fitViewHandle);
      }
    };
  }, [currentTree, isPrintView, reactFlowInstance]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const focusHandle = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusHandle);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    function syncSearchPanelBounds() {
      if (!searchPanelRef.current) {
        return;
      }

      const panelRect = searchPanelRef.current.getBoundingClientRect();

      setSearchPanelPosition((currentPosition) =>
        clampSearchPanelPosition(
          currentPosition,
          panelRect.width,
          panelRect.height,
          flowFrameRef.current,
        ),
      );
    }

    syncSearchPanelBounds();
    window.addEventListener('resize', syncSearchPanelBounds);

    return () => {
      window.removeEventListener('resize', syncSearchPanelBounds);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isDraggingSearch) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const dragState = searchDragRef.current;

      if (!dragState) {
        return;
      }

      const nextPosition = {
        x: dragState.startX + (event.clientX - dragState.startClientX),
        y: dragState.startY + (event.clientY - dragState.startClientY),
      };

      setSearchPanelPosition(
        clampSearchPanelPosition(
          nextPosition,
          dragState.panelWidth,
          dragState.panelHeight,
          flowFrameRef.current,
        ),
      );
    }

    function handlePointerUp() {
      searchDragRef.current = null;
      setIsDraggingSearch(false);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingSearch]);

  useEffect(() => {
    if (
      !reactFlowInstance ||
      !activeMatch ||
      liveNormalizedSearchTerm.length < 3 ||
      !activeMatch.displayName.toLowerCase().includes(liveNormalizedSearchTerm)
    ) {
      return;
    }

    const matchedNode = graph.nodes.find(
      (node) => node.type === 'person' && node.id === activeMatch.id,
    );

    if (!matchedNode) {
      return;
    }

    const nodeWidth =
      typeof matchedNode.style?.width === 'number'
        ? matchedNode.style.width
        : graph.dimensions.personWidth;
    const nodeHeight =
      typeof matchedNode.style?.height === 'number'
        ? matchedNode.style.height
        : graph.dimensions.personHeight;

    void reactFlowInstance.setCenter(
      matchedNode.position.x + nodeWidth / 2,
      matchedNode.position.y + nodeHeight / 2,
      {
        zoom: Math.max(reactFlowInstance.getZoom(), 0.52),
        duration: 420,
      },
    );

    setHighlightedNodeId(activeMatch.id);
    setSearchHighlightKey((currentValue) => currentValue + 1);

    if (searchHighlightTimeoutRef.current !== null) {
      window.clearTimeout(searchHighlightTimeoutRef.current);
    }

    searchHighlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedNodeId((currentId) =>
        currentId === activeMatch.id ? null : currentId,
      );
    }, 1450);
  }, [
    activeMatch,
    graph.dimensions.personHeight,
    graph.dimensions.personWidth,
    graph.nodes,
    liveNormalizedSearchTerm,
    reactFlowInstance,
  ]);

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

  function handleSearchToggle() {
    setIsSearchOpen((currentValue) => !currentValue);
  }

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    const nextSearchTerm = event.target.value;

    setSearchTerm(nextSearchTerm);
    setCurrentMatchIndex(0);

    if (nextSearchTerm.trim().length >= 3) {
      return;
    }

    if (searchHighlightTimeoutRef.current !== null) {
      window.clearTimeout(searchHighlightTimeoutRef.current);
      searchHighlightTimeoutRef.current = null;
    }

    setHighlightedNodeId(null);
  }

  function cycleSearchMatch(direction: -1 | 1) {
    if (searchMatches.length < 2) {
      return;
    }

    setCurrentMatchIndex((previousIndex) => {
      const nextIndex = previousIndex + direction;

      if (nextIndex < 0) {
        return searchMatches.length - 1;
      }

      return nextIndex % searchMatches.length;
    });
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && searchMatches.length > 0) {
      event.preventDefault();
      cycleSearchMatch(event.shiftKey ? -1 : 1);
    }
  }

  function handleSearchDragStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !searchPanelRef.current) {
      return;
    }

    const panelRect = searchPanelRef.current.getBoundingClientRect();

    searchDragRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: searchPanelPosition.x,
      startY: searchPanelPosition.y,
      panelWidth: panelRect.width,
      panelHeight: panelRect.height,
    };
    setIsDraggingSearch(true);
    event.preventDefault();
  }

  function handleSearchPositionReset() {
    searchDragRef.current = null;
    setIsDraggingSearch(false);

    setSearchPanelPosition(getInitialSearchPanelPosition());
  }

  function getInitialSearchPanelPosition() {
    const panelRect = searchPanelRef.current?.getBoundingClientRect();

    return panelRect
      ? clampSearchPanelPosition(
          { ...INITIAL_SEARCH_PANEL_POSITION },
          panelRect.width,
          panelRect.height,
          flowFrameRef.current,
        )
      : { ...INITIAL_SEARCH_PANEL_POSITION };
  }

  function isSearchPanelPositionChanged() {
    const initialPosition = getInitialSearchPanelPosition();

    return (
      searchPanelPosition.x !== initialPosition.x ||
      searchPanelPosition.y !== initialPosition.y
    );
  }

  async function handleCopyPreview(
    previewText: string,
    previewKey: 'example-file',
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
  const searchStatus =
    normalizedSearchTerm.length === 0
      ? 'Type at least 3 letters to search by name.'
      : normalizedSearchTerm.length < 3
        ? `Type ${3 - normalizedSearchTerm.length} more letter${
            3 - normalizedSearchTerm.length === 1 ? '' : 's'
          } to start searching.`
        : searchMatches.length === 0
          ? 'No matching people found.'
          : searchMatches.length === 1
            ? `1 match: ${activeMatch?.displayName ?? 'unknown'}`
            : `${searchMatches.length} matches, showing ${activeMatchIndex + 1} of ${
                searchMatches.length
              }: ${activeMatch?.displayName ?? 'unknown'}`;

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <div className="hero__eyebrow">
            <img
              className="hero__mark"
              src={`${import.meta.env.BASE_URL}fallen-leaf.png`}
              alt=""
              aria-hidden="true"
            />
            <p className="hero__kicker">Family Tree Visualiser</p>
          </div>
          <h1>Family Tree Visualiser</h1>
          <p className="hero__text">
            Turn your family history into a clear, interactive family tree.
            Explore the example, upload your own data, and create a printable
            PDF that brings generations together in one beautiful view.
          </p>
        </div>
      </section>

      <section className="data-panel">
        <div className="data-panel__layout">
          <div className="data-panel__content">
            <h2>Visualise Your Own Family Tree</h2>
            <p>
              Use the example as a guide to build your own family-tree
              JSON file. When it is ready, choose the file below to explore your
              family in the interactive graph and create a printable PDF.
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
              Your file stays private: it is read locally and kept only in this
              browser session. It is not uploaded to a server.
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
                <span>Example File Preview</span>
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

          </div>
        </div>
      </section>

      <section className="canvas-panel">
        <div className="visual-panel__header">
          <div>
            <div className="visual-panel__title">
              <h2>Interactive Graph</h2>
              <p className="hero__tag">
                Showing{' '}
                {treeState.source === 'uploaded' ? 'uploaded JSON' : 'example data'}
              </p>
            </div>
            <ul className="visual-panel__stats">
              <li>Root person: {rootPerson?.displayName ?? 'unknown'}</li>
              <li>{currentTree.people.length} people</li>
              <li>{currentTree.families.length} family groups</li>
            </ul>
          </div>
          <div className="visual-panel__actions">
            <a className="print-button" href={printLayoutUrl.toString()}>
              Open PDF Export
            </a>
          </div>
        </div>

        <div className="flow-frame" ref={flowFrameRef}>
          <div className="flow-frame__tools">
            <button
              type="button"
              className={
                isSearchOpen
                  ? 'flow-frame__tool-button flow-frame__tool-button--active'
                  : 'flow-frame__tool-button'
              }
              aria-label="Toggle search"
              aria-pressed={isSearchOpen}
              title="Toggle search"
              onClick={handleSearchToggle}
            >
              <svg
                className="flow-frame__tool-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="10.5"
                  cy="10.5"
                  r="5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M15 15 L20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {isSearchOpen ? (
            <section
              ref={searchPanelRef}
              className={
                isDraggingSearch
                  ? 'graph-search graph-search--floating graph-search--dragging'
                  : 'graph-search graph-search--floating'
              }
              style={{
                left: `${searchPanelPosition.x}px`,
                top: `${searchPanelPosition.y}px`,
              }}
            >
              <div
                className="graph-search__drag-handle"
                onPointerDown={handleSearchDragStart}
              >
                <div>
                  <p className="graph-search__label">Search People</p>
                  <p className="graph-search__hint">Drag to move</p>
                </div>
                {isSearchPanelPositionChanged() ? (
                  <button
                    type="button"
                    className="graph-search__reset-button"
                    title="Reset search panel position"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={handleSearchPositionReset}
                  >
                    Reset
                  </button>
                ) : null}
              </div>
              <div className="graph-search__controls">
                <input
                  ref={searchInputRef}
                  id="graph-search-input"
                  className="graph-search__input"
                  type="search"
                  placeholder="At least 3 letters"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                />
                <button
                  type="button"
                  className="graph-search__button"
                  onClick={() => cycleSearchMatch(-1)}
                  disabled={searchMatches.length < 2}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="graph-search__button"
                  onClick={() => cycleSearchMatch(1)}
                  disabled={searchMatches.length < 2}
                >
                  Next
                </button>
              </div>
              <p className="graph-search__meta">{searchStatus}</p>
            </section>
          ) : null}

          <ReactFlow
            nodes={interactiveGraph.nodes}
            edges={interactiveGraph.edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            zoomOnDoubleClick={false}
            minZoom={0.04}
            onInit={setReactFlowInstance}
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

function clampSearchPanelPosition(
  nextPosition: { x: number; y: number },
  panelWidth: number,
  panelHeight: number,
  container: HTMLDivElement | null,
) {
  if (!container) {
    return nextPosition;
  }

  const padding = 12;
  const maxX = Math.max(padding, container.clientWidth - panelWidth - padding);
  const maxY = Math.max(padding, container.clientHeight - panelHeight - padding);

  return {
    x: Math.min(Math.max(padding, nextPosition.x), maxX),
    y: Math.min(Math.max(padding, nextPosition.y), maxY),
  };
}
