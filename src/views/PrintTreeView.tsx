import { useEffect, useMemo, useRef, useState } from 'react';
import type { Edge } from '@xyflow/react';
import { PersonCard } from '../components/PersonCard';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { useLanguage } from '../i18n/LanguageContext';
import type { FamilyTreeData, FamilyTreeDataSource } from '../lib/familyTree';
import type { FamilyTreeGraphNode, PersonNodeData } from '../lib/familyTreeGraph';
import { downloadFamilyTreePdf } from '../lib/familyTreePdf';
import {
  buildPrintLayout,
  getCanvasNodeRect,
  getPrintEdgePoints,
} from '../lib/familyTreePrint';

type PrintTreeViewProps = {
  graph: {
    nodes: FamilyTreeGraphNode[];
    edges: Edge[];
  };
  treeData: FamilyTreeData;
  dataSource: FamilyTreeDataSource;
};

function getGraphPageUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('view');

  return url.toString();
}

function formatPageIndex(value: number) {
  return String(value).padStart(2, '0');
}

const PREVIEW_GRID_GAP = 2;
const PREVIEW_MAX_PAGE_WIDTH = 280;
const PREVIEW_MIN_PAGE_WIDTH = 16;

type PageRenderNode = {
  id: string;
  type: FamilyTreeGraphNode['type'];
  left: number;
  top: number;
  width: number;
  height: number;
  data: FamilyTreeGraphNode['data'];
};

type PageRenderEdge = {
  id: string;
  path: string;
  hasMarkerEnd: boolean;
};

type PageRenderData = {
  pageIndex: number;
  page: ReturnType<typeof buildPrintLayout>['pages'][number];
  nodes: PageRenderNode[];
  edges: PageRenderEdge[];
  isEmpty: boolean;
};

function rectIntersectsPage(
  rect: { left: number; top: number; width: number; height: number },
  page: { offsetX: number; offsetY: number },
  pageWidth: number,
  pageHeight: number,
) {
  const rectRight = rect.left + rect.width;
  const rectBottom = rect.top + rect.height;
  const pageRight = page.offsetX + pageWidth;
  const pageBottom = page.offsetY + pageHeight;

  return (
    rect.left < pageRight &&
    rectRight > page.offsetX &&
    rect.top < pageBottom &&
    rectBottom > page.offsetY
  );
}

function edgePointsIntersectPage(
  edgePoints: NonNullable<ReturnType<typeof getPrintEdgePoints>>,
  page: { offsetX: number; offsetY: number },
  pageWidth: number,
  pageHeight: number,
) {
  const minX = Math.min(edgePoints.sourceX, edgePoints.targetX);
  const maxX = Math.max(edgePoints.sourceX, edgePoints.targetX);
  const minY = Math.min(edgePoints.sourceY, edgePoints.middleY, edgePoints.targetY);
  const maxY = Math.max(edgePoints.sourceY, edgePoints.middleY, edgePoints.targetY);

  return rectIntersectsPage(
    {
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    page,
    pageWidth,
    pageHeight,
  );
}

function buildPageLocalEdgePath(
  edgePoints: NonNullable<ReturnType<typeof getPrintEdgePoints>>,
  page: { offsetX: number; offsetY: number },
) {
  const sourceX = edgePoints.sourceX - page.offsetX;
  const sourceY = edgePoints.sourceY - page.offsetY;
  const middleY = edgePoints.middleY - page.offsetY;
  const targetX = edgePoints.targetX - page.offsetX;
  const targetY = edgePoints.targetY - page.offsetY;

  return [
    `M ${sourceX} ${sourceY}`,
    `L ${sourceX} ${middleY}`,
    `L ${targetX} ${middleY}`,
    `L ${targetX} ${targetY}`,
  ].join(' ');
}

export function PrintTreeView({
  graph,
  treeData,
  dataSource,
}: PrintTreeViewProps) {
  const { translations } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [skipEmptyPages, setSkipEmptyPages] = useState(true);
  const [previewContainerWidth, setPreviewContainerWidth] = useState(0);
  const previewPagesRef = useRef<HTMLElement | null>(null);
  const exportPagesRef = useRef<HTMLElement | null>(null);
  const layout = useMemo(() => buildPrintLayout(graph.nodes), [graph.nodes]);
  const graphPageUrl = getGraphPageUrl();
  const nodesById = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node])),
    [graph.nodes],
  );
  const pageRenderData = useMemo<PageRenderData[]>(() => {
    return layout.pages.map((page, pageIndex) => {
      const nodes = graph.nodes
        .map((node) => {
          const rect = getCanvasNodeRect(node, layout.originX, layout.originY);

          if (!rectIntersectsPage(rect, page, layout.pageWidth, layout.pageHeight)) {
            return null;
          }

          return {
            id: node.id,
            type: node.type,
            data: node.data,
            left: rect.left - page.offsetX,
            top: rect.top - page.offsetY,
            width: rect.width,
            height: rect.height,
          };
        })
        .filter((node): node is PageRenderNode => node !== null);

      const edges = graph.edges
        .map((edge) => {
          const edgePoints = getPrintEdgePoints(
            edge,
            nodesById,
            layout.originX,
            layout.originY,
          );

          if (
            !edgePoints ||
            !edgePointsIntersectPage(
              edgePoints,
              page,
              layout.pageWidth,
              layout.pageHeight,
            )
          ) {
            return null;
          }

          return {
            id: edge.id,
            path: buildPageLocalEdgePath(edgePoints, page),
            hasMarkerEnd: Boolean(edge.markerEnd),
          };
        })
        .filter((edge): edge is PageRenderEdge => edge !== null);

      return {
        pageIndex,
        page,
        nodes,
        edges,
        isEmpty: nodes.length === 0 && edges.length === 0,
      };
    });
  }, [
    graph.edges,
    graph.nodes,
    layout.originX,
    layout.originY,
    layout.pageHeight,
    layout.pageWidth,
    layout.pages,
    nodesById,
  ]);
  const exportPageRenderData = useMemo(
    () =>
      skipEmptyPages
        ? pageRenderData.filter((pageData) => !pageData.isEmpty)
        : pageRenderData,
    [pageRenderData, skipEmptyPages],
  );
  const availablePreviewWidth = Math.max(
    1,
    previewContainerWidth - PREVIEW_GRID_GAP * (layout.pageCountX - 1),
  );
  const previewPageWidth = Math.max(
    PREVIEW_MIN_PAGE_WIDTH,
    Math.min(
      PREVIEW_MAX_PAGE_WIDTH,
      Math.floor(availablePreviewWidth / Math.max(layout.pageCountX, 1)),
    ),
  );
  const previewScale = previewPageWidth / layout.pageWidth;
  const previewPageHeight = Math.max(
    1,
    Math.round(layout.pageHeight * previewScale),
  );
  const isCompactPreview = previewPageWidth < 96;
  const exportProgressPercent = exportProgress
    ? Math.round(
        (exportProgress.completed / Math.max(exportProgress.total, 1)) * 100,
      )
    : null;

  useEffect(() => {
    setExportError(null);
  }, [translations.language]);

  useEffect(() => {
    const previewContainer = previewPagesRef.current;

    if (!previewContainer) {
      return;
    }

    const updateWidth = () => {
      setPreviewContainerWidth(previewContainer.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(previewContainer);

    return () => {
      observer.disconnect();
    };
  }, []);

  async function handleDownloadPdf() {
    if (isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      setExportError(null);
      setExportProgress({ completed: 0, total: exportPageRenderData.length });
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve());
        });
      });
      const pageElements = Array.from(
        exportPagesRef.current?.querySelectorAll<HTMLElement>('.print-page') ?? [],
      );

      await downloadFamilyTreePdf(pageElements, treeData.tree.title, {
        onProgress: (completed, total) => {
          setExportProgress({ completed, total });
        },
        messages: translations.pdf.errors,
      });
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : translations.pdf.exportFailed,
      );
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  }

  function renderPageCanvas(pageData: PageRenderData) {
    const { page, edges, nodes } = pageData;

    return (
      <div
        className="print-page__viewport"
        style={{
          width: `${layout.pageWidth}px`,
          height: `${layout.pageHeight}px`,
        }}
      >
        <div
          className="print-page__canvas"
          style={{
            width: `${layout.pageWidth}px`,
            height: `${layout.pageHeight}px`,
          }}
        >
          <svg
            className="print-layer print-layer--edges"
            width={layout.pageWidth}
            height={layout.pageHeight}
            viewBox={`0 0 ${layout.pageWidth} ${layout.pageHeight}`}
            aria-hidden="true"
          >
            <defs>
              <marker
                id={`print-arrow-${page.id}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#000000" />
              </marker>
            </defs>
            {edges.map((edge) => {
              return (
                <path
                  key={edge.id}
                  d={edge.path}
                  className="print-edge"
                  markerEnd={
                    edge.hasMarkerEnd ? `url(#print-arrow-${page.id})` : undefined
                  }
                />
              );
            })}
          </svg>

          <div className="print-layer print-layer--nodes">
            {nodes.map((node) => {
              if (node.type === 'person') {
                return (
                  <div
                    key={node.id}
                    className="print-node"
                    style={{
                      left: `${node.left}px`,
                      top: `${node.top}px`,
                      width: `${node.width}px`,
                      height: `${node.height}px`,
                    }}
                  >
                    <PersonCard data={node.data as PersonNodeData} />
                  </div>
                );
              }

              return (
                <div
                  key={node.id}
                  className="print-node print-node--family"
                  style={{
                    left: `${node.left}px`,
                    top: `${node.top}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                  }}
                >
                  <div className="family-node family-node--print">
                    <span className="family-node__dot" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderPage(
    pageData: PageRenderData,
    mode: 'preview' | 'export',
  ) {
    const isPreview = mode === 'preview';
    const { page, pageIndex } = pageData;

    return (
      <article
        key={`${mode}-${page.id}`}
        className={
          isPreview && isCompactPreview ? 'print-page print-page--compact' : 'print-page'
        }
        data-export-width={layout.pageWidth}
        data-export-height={layout.pageHeight}
        style={
          isPreview
            ? {
                width: `${previewPageWidth}px`,
                height: `${previewPageHeight}px`,
              }
            : {
                width: `${layout.pageWidth}px`,
                height: `${layout.pageHeight}px`,
              }
        }
      >
        {isPreview ? null : (
          <div className="print-page__badge">
            {translations.pdf.pageBadge(
              formatPageIndex(pageIndex + 1),
              formatPageIndex(page.row + 1),
              formatPageIndex(page.column + 1),
            )}
          </div>
        )}
        <div className="print-page__content">
          <div
            className="print-page__scale"
            style={{
              width: `${layout.pageWidth}px`,
              height: `${layout.pageHeight}px`,
              transform: `scale(${isPreview ? previewScale : 1})`,
            }}
          >
            {renderPageCanvas(pageData)}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="print-view">
      <SiteHeader />
      <main className="page-content">
      <header className="print-toolbar">
        <div>
          <h1 className="print-toolbar__title">{translations.pdf.title}</h1>
          <p className="print-toolbar__meta">{translations.pdf.intro}</p>
        </div>
      </header>

      <section className="print-preview-panel">
        <div className="visual-panel__header">
          <div>
            <div className="visual-panel__title">
              <h2>{translations.pdf.layoutPreview}</h2>
              <p className="hero__tag">
                {translations.landing.showingSource(
                  translations.common.dataSources[dataSource],
                )}
              </p>
            </div>
            <ul className="visual-panel__stats">
              <li>{translations.pdf.a4PagesCount(layout.pageCountX * layout.pageCountY)}</li>
              <li>{translations.pdf.rowsCount(layout.pageCountY)}</li>
              <li>{translations.pdf.columnsCount(layout.pageCountX)}</li>
            </ul>
          </div>
          <div className="visual-panel__actions">
            <label className="print-option">
              <input
                type="checkbox"
                checked={skipEmptyPages}
                onChange={(event) => setSkipEmptyPages(event.target.checked)}
              />
              <span>{translations.pdf.skipEmptyPages}</span>
            </label>
            <a className="print-button print-button--secondary" href={graphPageUrl}>
              {translations.pdf.backToGraph}
            </a>
            <button
              type="button"
              className="print-button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
            >
              {isExporting && exportProgress
                ? translations.pdf.preparingWithProgress(exportProgressPercent ?? 0)
                : isExporting
                  ? translations.pdf.preparing
                  : translations.pdf.download}
            </button>
          </div>
        </div>
        {exportError ? (
          <p className="print-preview-panel__error" role="alert">
            {exportError}
          </p>
        ) : null}
        <section
          ref={previewPagesRef}
          className="print-pages"
          style={{
            gridTemplateColumns: `repeat(${layout.pageCountX}, ${previewPageWidth}px)`,
          }}
        >
          {pageRenderData.map((pageData) => renderPage(pageData, 'preview'))}
        </section>
      </section>

      {isExporting ? (
        <section
          ref={exportPagesRef}
          className="print-pages print-pages--export"
          aria-hidden="true"
        >
          {exportPageRenderData.map((pageData) => renderPage(pageData, 'export'))}
        </section>
      ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
