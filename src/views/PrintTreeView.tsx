import { useEffect, useRef, useState } from 'react';
import type { Edge } from '@xyflow/react';
import { PersonCard } from '../components/PersonCard';
import { familyTreeData, familyTreeDataSource } from '../lib/familyTree';
import type { FamilyTreeGraphNode, PersonNodeData } from '../lib/familyTreeGraph';
import { downloadFamilyTreePdf } from '../lib/familyTreePdf';
import {
  buildPrintEdgePath,
  buildPrintLayout,
  getCanvasNodeRect,
} from '../lib/familyTreePrint';

type PrintTreeViewProps = {
  graph: {
    nodes: FamilyTreeGraphNode[];
    edges: Edge[];
  };
};

function getGraphPageUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('view');

  return url.toString();
}

function formatPageIndex(value: number) {
  return String(value).padStart(2, '0');
}

const PREVIEW_GRID_GAP = 16;
const PREVIEW_MAX_PAGE_WIDTH = 280;
const PREVIEW_MIN_PAGE_WIDTH = 16;

export function PrintTreeView({ graph }: PrintTreeViewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [previewContainerWidth, setPreviewContainerWidth] = useState(0);
  const previewPagesRef = useRef<HTMLElement | null>(null);
  const exportPagesRef = useRef<HTMLElement | null>(null);
  const layout = buildPrintLayout(graph.nodes);
  const graphPageUrl = getGraphPageUrl();
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
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
      const pageElements = Array.from(
        exportPagesRef.current?.querySelectorAll<HTMLElement>('.print-page') ?? [],
      );

      await downloadFamilyTreePdf(pageElements, familyTreeData.tree.title);
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : 'PDF export failed. Please try again.',
      );
    } finally {
      setIsExporting(false);
    }
  }

  function renderPageCanvas(page: (typeof layout.pages)[number]) {
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
            width: `${layout.canvasWidth}px`,
            height: `${layout.canvasHeight}px`,
            transform: `translate(${-page.offsetX}px, ${-page.offsetY}px)`,
          }}
        >
          <svg
            className="print-layer print-layer--edges"
            width={layout.canvasWidth}
            height={layout.canvasHeight}
            viewBox={`0 0 ${layout.canvasWidth} ${layout.canvasHeight}`}
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
            {graph.edges.map((edge) => {
              const path = buildPrintEdgePath(
                edge,
                nodesById,
                layout.originX,
                layout.originY,
              );

              if (!path) {
                return null;
              }

              return (
                <path
                  key={edge.id}
                  d={path}
                  className="print-edge"
                  markerEnd={
                    edge.markerEnd ? `url(#print-arrow-${page.id})` : undefined
                  }
                />
              );
            })}
          </svg>

          <div className="print-layer print-layer--nodes">
            {graph.nodes.map((node) => {
              const rect = getCanvasNodeRect(node, layout.originX, layout.originY);

              if (node.type === 'person') {
                return (
                  <div
                    key={node.id}
                    className="print-node"
                    style={{
                      left: `${rect.left}px`,
                      top: `${rect.top}px`,
                      width: `${rect.width}px`,
                      height: `${rect.height}px`,
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
                    left: `${rect.left}px`,
                    top: `${rect.top}px`,
                    width: `${rect.width}px`,
                    height: `${rect.height}px`,
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
    page: (typeof layout.pages)[number],
    index: number,
    mode: 'preview' | 'export',
  ) {
    const isPreview = mode === 'preview';

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
            p{formatPageIndex(index + 1)}, r{formatPageIndex(page.row + 1)}, c
            {formatPageIndex(page.column + 1)}
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
            {renderPageCanvas(page)}
          </div>
        </div>
      </article>
    );
  }

  return (
    <main className="print-view">
      <header className="print-toolbar">
        <div>
          <div className="hero__eyebrow">
            <img
              className="hero__mark"
              src="/fallen-leaf.png"
              alt=""
              aria-hidden="true"
            />
            <p className="hero__kicker">Family Tree Visualiser</p>
            <p className="hero__tag">Loaded from data/{familyTreeDataSource}</p>
          </div>
          <h1 className="print-toolbar__title">PDF Export</h1>
          <p className="print-toolbar__meta">
            {layout.pageCountX * layout.pageCountY} A4 landscape pages arranged in{' '}
            {layout.pageCountY} row{layout.pageCountY === 1 ? '' : 's'} and{' '}
            {layout.pageCountX} column{layout.pageCountX === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="print-toolbar__actions">
          <a className="print-button print-button--secondary" href={graphPageUrl}>
            Back To Graph
          </a>
          <button
            type="button"
            className="print-button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
          >
            {isExporting ? 'Preparing PDF...' : 'Download PDF'}
          </button>
        </div>
      </header>

      <section className="print-help">
        <p>
          This preview shows the same layout that will be written into the PDF
          file. Each sheet uses the full page area, so the printed pages can be
          aligned edge to edge.
        </p>
        {exportError ? (
          <p className="print-help__error" role="alert">
            {exportError}
          </p>
        ) : null}
      </section>

      <section
        ref={previewPagesRef}
        className="print-pages"
        style={{
          gridTemplateColumns: `repeat(${layout.pageCountX}, ${previewPageWidth}px)`,
        }}
      >
        {layout.pages.map((page, index) => renderPage(page, index, 'preview'))}
      </section>

      <section ref={exportPagesRef} className="print-pages print-pages--export" aria-hidden="true">
        {layout.pages.map((page, index) => renderPage(page, index, 'export'))}
      </section>
    </main>
  );
}
