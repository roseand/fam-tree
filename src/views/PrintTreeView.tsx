import { useRef, useState } from 'react';
import type { Edge } from '@xyflow/react';
import { PersonCard } from '../components/PersonCard';
import { initialFamilyTree } from '../data/familyTree';
import type { FamilyTreeGraphNode, PersonNodeData } from '../lib/familyTreeGraph';
import { downloadFamilyTreePdf } from '../lib/familyTreePdf';
import {
  buildPrintEdgePath,
  buildPrintLayout,
  getCanvasNodeRect,
  PRINT_PAGE_MARGIN_MM,
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

export function PrintTreeView({ graph }: PrintTreeViewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const pagesRef = useRef<HTMLElement | null>(null);
  const layout = buildPrintLayout(graph.nodes);
  const graphPageUrl = getGraphPageUrl();
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));

  async function handleDownloadPdf() {
    if (isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      setExportError(null);
      const pageElements = Array.from(
        pagesRef.current?.querySelectorAll<HTMLElement>('.print-page') ?? [],
      );

      await downloadFamilyTreePdf(pageElements, initialFamilyTree.tree.title);
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

  return (
    <main className="print-view">
      <header className="print-toolbar">
        <div>
          <p className="hero__kicker">PDF Export</p>
          <h1 className="print-toolbar__title">{initialFamilyTree.tree.title}</h1>
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
          This preview shows the tiled A4 pages exactly as they will be captured
          into the PDF file. Downloading keeps the same page sectors and uses a{' '}
          {PRINT_PAGE_MARGIN_MM} mm margin.
        </p>
        {exportError ? (
          <p className="print-help__error" role="alert">
            {exportError}
          </p>
        ) : null}
      </section>

      <section ref={pagesRef} className="print-pages">
        {layout.pages.map((page, index) => (
          <article key={page.id} className="print-page">
            <div className="print-page__badge">
              Page {index + 1} - Row {page.row + 1}, Col {page.column + 1}
            </div>
            <div className="print-page__content">
              <div className="print-page__viewport">
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
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#725b45" />
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
                          markerEnd={`url(#print-arrow-${page.id})`}
                        />
                      );
                    })}
                  </svg>

                  <div className="print-layer print-layer--nodes">
                    {graph.nodes.map((node) => {
                      const rect = getCanvasNodeRect(
                        node,
                        layout.originX,
                        layout.originY,
                      );

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
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
