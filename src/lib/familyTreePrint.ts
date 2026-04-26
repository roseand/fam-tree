import type { Edge } from '@xyflow/react';
import type { FamilyTreeGraphNode } from './familyTreeGraph';

const MM_TO_PX = 96 / 25.4;
const MM_TO_PT = 72 / 25.4;

export const PRINT_PAGE_WIDTH_MM = 297;
export const PRINT_PAGE_HEIGHT_MM = 210;
export const PRINT_PAGE_MARGIN_MM = 0;
export const PRINT_PAGE_WIDTH_PT = PRINT_PAGE_WIDTH_MM * MM_TO_PT;
export const PRINT_PAGE_HEIGHT_PT = PRINT_PAGE_HEIGHT_MM * MM_TO_PT;
export const PRINT_PAGE_MARGIN_PT = PRINT_PAGE_MARGIN_MM * MM_TO_PT;
export const PRINT_CONTENT_WIDTH_PT =
  (PRINT_PAGE_WIDTH_MM - PRINT_PAGE_MARGIN_MM * 2) * MM_TO_PT;
export const PRINT_CONTENT_HEIGHT_PT =
  (PRINT_PAGE_HEIGHT_MM - PRINT_PAGE_MARGIN_MM * 2) * MM_TO_PT;
export const PRINT_PAGE_WIDTH_PX = Math.round(
  (PRINT_PAGE_WIDTH_MM - PRINT_PAGE_MARGIN_MM * 2) * MM_TO_PX,
);
export const PRINT_PAGE_HEIGHT_PX = Math.round(
  (PRINT_PAGE_HEIGHT_MM - PRINT_PAGE_MARGIN_MM * 2) * MM_TO_PX,
);
export const PRINT_GRAPH_PADDING_PX = 64;

type NodeSize = {
  width: number;
  height: number;
};

export type GraphBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

export type PrintPageSector = {
  id: string;
  row: number;
  column: number;
  offsetX: number;
  offsetY: number;
};

export type PrintLayout = {
  bounds: GraphBounds;
  canvasWidth: number;
  canvasHeight: number;
  originX: number;
  originY: number;
  pageWidth: number;
  pageHeight: number;
  pageCountX: number;
  pageCountY: number;
  pages: PrintPageSector[];
};

function resolveNodeSize(node: FamilyTreeGraphNode): NodeSize {
  const width =
    typeof node.style?.width === 'number' ? node.style.width : node.width ?? 0;
  const height =
    typeof node.style?.height === 'number' ? node.style.height : node.height ?? 0;

  return { width, height };
}

export function getGraphBounds(nodes: FamilyTreeGraphNode[]) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const { width, height } = resolveNodeSize(node);

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
    };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function buildPrintLayout(nodes: FamilyTreeGraphNode[]): PrintLayout {
  const bounds = getGraphBounds(nodes);
  const originX = bounds.minX - PRINT_GRAPH_PADDING_PX;
  const originY = bounds.minY - PRINT_GRAPH_PADDING_PX;
  const canvasWidth = bounds.width + PRINT_GRAPH_PADDING_PX * 2;
  const canvasHeight = bounds.height + PRINT_GRAPH_PADDING_PX * 2;
  const pageCountX = Math.max(1, Math.ceil(canvasWidth / PRINT_PAGE_WIDTH_PX));
  const pageCountY = Math.max(1, Math.ceil(canvasHeight / PRINT_PAGE_HEIGHT_PX));
  const pages: PrintPageSector[] = [];

  for (let row = 0; row < pageCountY; row += 1) {
    for (let column = 0; column < pageCountX; column += 1) {
      pages.push({
        id: `page-${row + 1}-${column + 1}`,
        row,
        column,
        offsetX: column * PRINT_PAGE_WIDTH_PX,
        offsetY: row * PRINT_PAGE_HEIGHT_PX,
      });
    }
  }

  return {
    bounds,
    canvasWidth,
    canvasHeight,
    originX,
    originY,
    pageWidth: PRINT_PAGE_WIDTH_PX,
    pageHeight: PRINT_PAGE_HEIGHT_PX,
    pageCountX,
    pageCountY,
    pages,
  };
}

export function getCanvasNodeRect(
  node: FamilyTreeGraphNode,
  originX: number,
  originY: number,
) {
  const { width, height } = resolveNodeSize(node);

  return {
    left: node.position.x - originX,
    top: node.position.y - originY,
    width,
    height,
  };
}

export function buildPrintEdgePath(
  edge: Edge,
  nodesById: Map<string, FamilyTreeGraphNode>,
  originX: number,
  originY: number,
) {
  const edgePoints = getPrintEdgePoints(edge, nodesById, originX, originY);

  if (!edgePoints) {
    return '';
  }

  const { sourceX, sourceY, middleY, targetX, targetY } = edgePoints;

  return [
    `M ${sourceX} ${sourceY}`,
    `L ${sourceX} ${middleY}`,
    `L ${targetX} ${middleY}`,
    `L ${targetX} ${targetY}`,
  ].join(' ');
}

export function getPrintEdgePoints(
  edge: Edge,
  nodesById: Map<string, FamilyTreeGraphNode>,
  originX: number,
  originY: number,
) {
  const sourceNode = nodesById.get(edge.source);
  const targetNode = nodesById.get(edge.target);

  if (!sourceNode || !targetNode) {
    return undefined;
  }

  const sourceRect = getCanvasNodeRect(sourceNode, originX, originY);
  const targetRect = getCanvasNodeRect(targetNode, originX, originY);
  const sourceX = sourceRect.left + sourceRect.width / 2;
  const sourceY = sourceRect.top + sourceRect.height;
  const targetX = targetRect.left + targetRect.width / 2;
  const targetY = targetRect.top;
  const middleY = sourceY + (targetY - sourceY) / 2;

  return { sourceX, sourceY, middleY, targetX, targetY };
}
