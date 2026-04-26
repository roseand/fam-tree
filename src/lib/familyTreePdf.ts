import { PDFDocument } from 'pdf-lib';
import { PRINT_PAGE_HEIGHT_PT, PRINT_PAGE_WIDTH_PT } from './familyTreePrint';

const EXPORT_SCALE = 2;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function copyComputedStyles(sourceNode: Element, targetNode: Element) {
  const computedStyle = window.getComputedStyle(sourceNode);
  const styleDeclarations: string[] = [];

  for (let index = 0; index < computedStyle.length; index += 1) {
    const propertyName = computedStyle.item(index);
    const propertyValue = computedStyle.getPropertyValue(propertyName);
    const propertyPriority = computedStyle.getPropertyPriority(propertyName);
    const prioritySuffix = propertyPriority ? ` !${propertyPriority}` : '';

    styleDeclarations.push(
      `${propertyName}:${propertyValue}${prioritySuffix};`,
    );
  }

  targetNode.setAttribute('style', styleDeclarations.join(''));

  if (sourceNode instanceof SVGElement && !targetNode.getAttribute('xmlns')) {
    targetNode.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  if (
    sourceNode instanceof HTMLInputElement &&
    targetNode instanceof HTMLInputElement
  ) {
    targetNode.value = sourceNode.value;
  }

  if (
    sourceNode instanceof HTMLTextAreaElement &&
    targetNode instanceof HTMLTextAreaElement
  ) {
    targetNode.value = sourceNode.value;
    targetNode.textContent = sourceNode.value;
  }

  if (
    sourceNode instanceof HTMLSelectElement &&
    targetNode instanceof HTMLSelectElement
  ) {
    targetNode.value = sourceNode.value;
  }

  const sourceChildren = Array.from(sourceNode.children);
  const targetChildren = Array.from(targetNode.children);

  for (let index = 0; index < sourceChildren.length; index += 1) {
    const sourceChild = sourceChildren[index];
    const targetChild = targetChildren[index];

    if (!sourceChild || !targetChild) {
      continue;
    }

    copyComputedStyles(sourceChild, targetChild);
  }
}

function cloneExportPage(pageElement: HTMLElement, width: number, height: number) {
  const clonedPage = pageElement.cloneNode(true) as HTMLElement;

  copyComputedStyles(pageElement, clonedPage);
  clonedPage.style.width = `${width}px`;
  clonedPage.style.height = `${height}px`;
  clonedPage.style.margin = '0';
  clonedPage.style.boxShadow = 'none';

  return clonedPage;
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to render preview page.'));
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create the PDF page image.'));
        return;
      }

      resolve(blob);
    }, type);
  });
}

async function renderPreviewPageToPng(pageElement: HTMLElement) {
  if ('fonts' in document) {
    await document.fonts.ready;
  }

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

  const bounds = pageElement.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(bounds.width));
  const height = Math.max(1, Math.ceil(bounds.height));
  const clonedPage = cloneExportPage(pageElement, width, height);
  const wrapper = document.createElement('div');

  wrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  wrapper.style.width = `${width}px`;
  wrapper.style.height = `${height}px`;
  wrapper.style.overflow = 'hidden';
  wrapper.append(clonedPage);

  const serializedMarkup = new XMLSerializer().serializeToString(wrapper);
  const svgMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <foreignObject x="0" y="0" width="100%" height="100%">${serializedMarkup}</foreignObject>
    </svg>
  `;
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    svgMarkup,
  )}`;

  try {
    const image = await loadImage(svgUrl);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to prepare the PDF page canvas.');
    }

    canvas.width = width * EXPORT_SCALE;
    canvas.height = height * EXPORT_SCALE;
    context.scale(EXPORT_SCALE, EXPORT_SCALE);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const pngBlob = await canvasToBlob(canvas, 'image/png');
    const pngBuffer = await pngBlob.arrayBuffer();

    canvas.width = 0;
    canvas.height = 0;

    return pngBuffer;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to capture the preview page for PDF export.',
    );
  }
}

function toArrayBuffer(bytes: Uint8Array) {
  return new Uint8Array(bytes).buffer;
}

export async function downloadFamilyTreePdf(
  pageElements: HTMLElement[],
  title: string,
) {
  if (!pageElements.length) {
    throw new Error('No preview pages were available to export.');
  }

  const pdfDocument = await PDFDocument.create();

  for (const [pageIndex, pageElement] of pageElements.entries()) {
    let pngBuffer: ArrayBuffer;

    try {
      pngBuffer = await renderPreviewPageToPng(pageElement);
    } catch (error) {
      const baseMessage =
        error instanceof Error ? error.message : 'Unknown export failure.';

      throw new Error(`PDF export failed on page ${pageIndex + 1}: ${baseMessage}`);
    }

    const pageImage = await pdfDocument.embedPng(pngBuffer);
    const pdfPage = pdfDocument.addPage([PRINT_PAGE_WIDTH_PT, PRINT_PAGE_HEIGHT_PT]);

    pdfPage.drawImage(pageImage, {
      x: 0,
      y: 0,
      width: PRINT_PAGE_WIDTH_PT,
      height: PRINT_PAGE_HEIGHT_PT,
    });
  }

  const pdfBytes = await pdfDocument.save();
  const pdfBlob = new Blob([toArrayBuffer(pdfBytes)], {
    type: 'application/pdf',
  });
  const objectUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = `${slugify(title) || 'family-tree'}.pdf`;
  document.body.append(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }, 60_000);
}
