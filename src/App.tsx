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
  defaultExampleFamilyTreeId,
  exampleFamilyTrees,
  getExampleFamilyTreePreview,
  getExampleFamilyTreeState,
  loadInitialFamilyTreeState,
  parseUploadedFamilyTreeJson,
  persistUploadedFamilyTree,
  type ExampleFamilyTreeId,
} from './lib/familyTree';
import { JsonCodeBlock } from './components/JsonCodeBlock';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { useLanguage } from './i18n/LanguageContext';
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

const EXAMPLE_TREE_QUERY_PARAM = 'example';

function getExampleTreeIdFromUrl(): ExampleFamilyTreeId {
  const exampleTreeId = new URLSearchParams(window.location.search).get(
    EXAMPLE_TREE_QUERY_PARAM,
  );

  return exampleFamilyTrees.some((exampleTree) => exampleTree.id === exampleTreeId)
    ? (exampleTreeId as ExampleFamilyTreeId)
    : defaultExampleFamilyTreeId;
}

export default function App() {
  const { translations } = useLanguage();
  const initialExampleTreeId = getExampleTreeIdFromUrl();
  const [treeState, setTreeState] = useState(() =>
    loadInitialFamilyTreeState(initialExampleTreeId),
  );
  const [selectedExampleTreeId, setSelectedExampleTreeId] =
    useState<ExampleFamilyTreeId>(initialExampleTreeId);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
  const selectedExampleTree = useMemo(
    () =>
      exampleFamilyTrees.find(
        (exampleTree) => exampleTree.id === selectedExampleTreeId,
      ) ?? exampleFamilyTrees[0],
    [selectedExampleTreeId],
  );
  const selectedExampleFamilyTreePreview = useMemo(
    () => getExampleFamilyTreePreview(selectedExampleTreeId),
    [selectedExampleTreeId],
  );
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
    setUploadError(null);
  }, [translations.language]);

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
  }, [isSearchOpen, translations.language]);

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
      setUploadError(translations.upload.chooseJsonFileError);
      return;
    }

    try {
      const jsonText = await file.text();
      const uploadedTree = parseUploadedFamilyTreeJson(
        jsonText,
        file.name,
        translations.upload.validation,
      );

      persistUploadedFamilyTree(uploadedTree);
      setTreeState({
        data: uploadedTree,
        source: 'uploaded',
      });
      setUploadError(null);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : translations.upload.fileCouldNotBeLoaded,
      );
    }
  }

  function handleExampleTreeChange(event: ChangeEvent<HTMLSelectElement>) {
    const exampleTreeId = event.target.value as ExampleFamilyTreeId;

    setSelectedExampleTreeId(exampleTreeId);
    clearPersistedUploadedFamilyTree();
    setTreeState(getExampleFamilyTreeState(exampleTreeId));
    setCopiedPreviewKey(null);
    setUploadError(null);
  }

  function handleUseExampleData() {
    clearPersistedUploadedFamilyTree();
    setTreeState(getExampleFamilyTreeState(selectedExampleTreeId));
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
      setUploadError(translations.upload.copyFailed);
    }
  }

  if (isPrintView) {
    return (
      <PrintTreeView
        graph={graph}
        treeData={currentTree}
        dataSource={treeState.source}
      />
    );
  }

  const printLayoutUrl = new URL(window.location.href);
  printLayoutUrl.searchParams.set('view', 'print');
  if (treeState.source === 'example') {
    printLayoutUrl.searchParams.set(
      EXAMPLE_TREE_QUERY_PARAM,
      selectedExampleTreeId,
    );
  } else {
    printLayoutUrl.searchParams.delete(EXAMPLE_TREE_QUERY_PARAM);
  }
  const searchStatus =
    normalizedSearchTerm.length === 0
      ? translations.search.typeAtLeastThreeLetters
      : normalizedSearchTerm.length < 3
        ? translations.search.typeMoreLetters(3 - normalizedSearchTerm.length)
        : searchMatches.length === 0
          ? translations.search.noMatches
          : searchMatches.length === 1
            ? translations.search.oneMatch(
                activeMatch?.displayName ?? translations.common.unknown,
              )
            : translations.search.multipleMatches(
                searchMatches.length,
                activeMatchIndex + 1,
                activeMatch?.displayName ?? translations.common.unknown,
              );

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page-content">
      <section className="hero">
        <div>
          <h1>{translations.landing.title}</h1>
          <p className="hero__text">{translations.landing.intro}</p>
        </div>
      </section>

      <section className="data-panel">
        <div className="data-panel__layout">
          <div className="data-panel__content">
            <h2>{translations.landing.uploadTitle}</h2>
            <p>{translations.landing.uploadIntro}</p>
            <div className="data-panel__actions">
              <div className="data-panel__upload-control">
                <div className="data-panel__upload-row">
                  <label className="print-button" htmlFor="family-tree-upload">
                    {translations.landing.chooseJsonFile}
                  </label>
                  <span
                    className="data-panel__privacy-tooltip"
                    tabIndex={0}
                    aria-label={translations.landing.privacyNotice}
                  >
                    <img
                      className="data-panel__notice-icon"
                      src={`${import.meta.env.BASE_URL}info.png`}
                      alt=""
                      aria-hidden="true"
                    />
                    <span
                      className="data-panel__privacy-tooltip-text"
                      role="tooltip"
                    >
                      {translations.landing.privacyNotice}
                    </span>
                  </span>
                </div>
                <input
                  id="family-tree-upload"
                  className="upload-input"
                  type="file"
                  accept=".json,application/json,text/json"
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <div className="data-panel__example-picker">
              <label className="data-panel__tree-select">
                <span>{translations.landing.exampleTreesLabel}</span>
                <select
                  value={selectedExampleTreeId}
                  disabled={treeState.source === 'uploaded'}
                  onChange={handleExampleTreeChange}
                >
                  {exampleFamilyTrees.map((exampleTree) => (
                    <option key={exampleTree.id} value={exampleTree.id}>
                      {translations.landing.exampleTreeOption(
                        exampleTree.data.tree.title,
                      )}
                    </option>
                  ))}
                </select>
              </label>
              {treeState.source === 'uploaded' ? (
                <button
                  type="button"
                  className="print-button print-button--secondary"
                  onClick={handleUseExampleData}
                >
                  {translations.landing.useExampleData}
                </button>
              ) : null}
            </div>
            {uploadError ? (
              <p className="data-panel__error" role="alert">
                {uploadError}
              </p>
            ) : null}
          </div>

          <div className="format-preview">
            <details className="format-preview__section">
              <summary>
                <span>{translations.landing.exampleFilePreview}</span>
                <span className="format-preview__summary-actions">
                  <button
                    type="button"
                    className="format-preview__copy-button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleCopyPreview(
                        selectedExampleFamilyTreePreview,
                        'example-file',
                      );
                    }}
                  >
                    {copiedPreviewKey === 'example-file'
                      ? translations.common.copied
                      : translations.common.copy}
                  </button>
                  <span className="format-preview__chevron" aria-hidden="true">
                    ▸
                  </span>
                </span>
              </summary>
              <section className="format-preview__card">
                <h3>{selectedExampleTree.fileName}</h3>
                <JsonCodeBlock jsonText={selectedExampleFamilyTreePreview} />
              </section>
            </details>

            <details className="format-preview__section">
              <summary>
                <span>{translations.landing.uploadFormatDocumentation}</span>
                <span className="format-preview__summary-actions">
                  <span className="format-preview__chevron" aria-hidden="true">
                    ▸
                  </span>
                </span>
              </summary>
              <div className="format-docs">
                {translations.upload.documentation.map((section) => (
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
                                item.required
                                  ? 'format-docs__required format-docs__required--yes'
                                  : 'format-docs__required format-docs__required--no'
                              }
                            >
                              {item.required
                                ? translations.common.required
                                : translations.common.optional}
                            </span>
                          </div>
                          <p className="format-docs__meta">
                            <strong>{translations.common.type}:</strong> {item.type}
                          </p>
                          {item.acceptedValues ? (
                            <p className="format-docs__meta">
                              <strong>{translations.common.accepted}:</strong>{' '}
                              {item.acceptedValues}
                            </p>
                          ) : null}
                          {item.notes ? (
                            <p className="format-docs__meta">
                              <strong>{translations.common.notes}:</strong>{' '}
                              {item.notes}
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
              <h2>{translations.landing.interactiveGraph}</h2>
              <p className="hero__tag">
                {translations.landing.showingSource(
                  translations.common.dataSources[treeState.source],
                  currentTree.tree.title,
                )}
              </p>
            </div>
            <ul className="visual-panel__stats">
              <li>
                {translations.landing.rootPerson(
                  rootPerson?.displayName ?? translations.common.unknown,
                )}
              </li>
              <li>{translations.landing.peopleCount(currentTree.people.length)}</li>
              <li>
                {translations.landing.familyGroupsCount(
                  currentTree.families.length,
                )}
              </li>
            </ul>
          </div>
          <div className="visual-panel__actions">
            <a className="print-button" href={printLayoutUrl.toString()}>
              {translations.landing.openPdfExport}
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
              aria-label={translations.search.toggleSearch}
              aria-pressed={isSearchOpen}
              title={translations.search.toggleSearch}
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
                  <p className="graph-search__label">{translations.search.title}</p>
                  <p className="graph-search__hint">
                    {translations.search.dragToMove}
                  </p>
                </div>
                {isSearchPanelPositionChanged() ? (
                  <button
                    type="button"
                    className="graph-search__reset-button"
                    title={translations.search.resetPosition}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={handleSearchPositionReset}
                  >
                    {translations.search.reset}
                  </button>
                ) : null}
              </div>
              <div className="graph-search__controls">
                <input
                  ref={searchInputRef}
                  id="graph-search-input"
                  className="graph-search__input"
                  type="search"
                  placeholder={translations.search.placeholder}
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
                  {translations.search.previous}
                </button>
                <button
                  type="button"
                  className="graph-search__button"
                  onClick={() => cycleSearchMatch(1)}
                  disabled={searchMatches.length < 2}
                >
                  {translations.search.next}
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
      <SiteFooter />
    </div>
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
