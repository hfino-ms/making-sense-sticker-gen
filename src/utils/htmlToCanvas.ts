import html2canvas from 'html2canvas';

/**
 * Renders HTML element to canvas and returns as data URL
 */
export async function renderHtmlToDataUrl(element: HTMLElement, options?: {
  width?: number;
  height?: number;
  scale?: number;
  backgroundColor?: string;
}): Promise<string> {
  const canvas = await html2canvas(element, {
    width: options?.width,
    height: options?.height,
    scale: options?.scale || 2, // Higher DPI for better quality
    backgroundColor: options?.backgroundColor || 'transparent',
    allowTaint: true,
    useCORS: true,
    logging: false
  });
  
  return canvas.toDataURL('image/png');
}

/**
 * Creates a temporary DOM element with agent label styling
 */
export function createAgentLabelElement(agentName: string, options?: {
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: number;
  padding?: number;
  backgroundColor?: string;
  borderRadius?: number;
}): HTMLElement {
  const div = document.createElement('div');
  
  // Apply exact styles from user requirements
  div.style.cssText = `
    color: ${options?.color || 'var(--common-white, #FFF)'};
    text-align: center;
    font-feature-settings: 'liga' off, 'clig' off;
    font-family: ${options?.fontFamily || '"Red Hat Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial'};
    font-size: ${options?.fontSize || 17.78}px;
    font-style: normal;
    font-weight: ${options?.fontWeight || 700};
    line-height: normal;
    padding: ${options?.padding || 8}px ${options?.padding || 16}px;
    background-color: ${options?.backgroundColor || 'transparent'};
    border-radius: ${options?.borderRadius || 0}px;
    white-space: nowrap;
    display: inline-block;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 9999;
  `;
  
  div.textContent = agentName;
  
  // Temporarily add to body for rendering
  div.style.visibility = 'hidden';
  div.style.pointerEvents = 'none';
  document.body.appendChild(div);
  
  return div;
}

/**
 * Composes sticker with agent label using HTML rendering
 */
export async function composeStickerWithHtmlLabel(
  stickerSource: string,
  agentLabel: string,
  options?: {
    stickerSize?: number;
    labelOptions?: Parameters<typeof createAgentLabelElement>[1];
    frameUrl?: string;
    drawFrame?: boolean;
  }
): Promise<string> {
  const size = options?.stickerSize || 1024;
  const drawFrame = options?.drawFrame ?? true;
  
  // Load sticker image
  const stickerImg = await loadImage(stickerSource);
  
  // Create canvas for composition
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');
  
  // Draw sticker with inset
  drawImageWithInset(ctx, stickerImg, canvas.width, canvas.height, 0.06);
  
  // Draw frame if requested
  if (drawFrame && options?.frameUrl) {
    try {
      const frameImg = await loadImage(options.frameUrl);
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
    } catch (e) {
      console.warn('Failed to load frame image', e);
    }
  }
  
  // Create and render agent label using HTML
  if (agentLabel) {
    try {
      const labelElement = createAgentLabelElement(agentLabel, {
        fontSize: Math.round((options?.labelOptions?.fontSize || 17.78) * (size / 1024)),
        ...options?.labelOptions
      });
      
      // Get the natural size of the label
      const labelRect = labelElement.getBoundingClientRect();
      
      // Render label to canvas
      const labelCanvas = await html2canvas(labelElement, {
        width: Math.ceil(labelRect.width),
        height: Math.ceil(labelRect.height),
        scale: 2,
        backgroundColor: 'transparent',
        allowTaint: true,
        useCORS: true,
        logging: false
      });
      
      // Position label at bottom center, above frame inset
      const insetBottom = Math.round(canvas.height * 0.06);
      const labelX = Math.round((canvas.width - labelCanvas.width) / 2);
      const labelY = Math.round(canvas.height - insetBottom - labelCanvas.height - Math.round(size * 0.01));
      
      ctx.drawImage(labelCanvas, labelX, labelY);
      
      // Clean up
      document.body.removeChild(labelElement);
      
    } catch (e) {
      console.warn('Failed to render HTML label', e);
    }
  }
  
  return canvas.toDataURL('image/png');
}

// Helper functions
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawImageWithInset(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  insetPercent: number = 0.06
) {
  const insetX = Math.round(canvasWidth * insetPercent);
  const insetY = Math.round(canvasHeight * insetPercent);
  const targetW = canvasWidth - insetX * 2;
  const targetH = canvasHeight - insetY * 2;

  const imgRatio = img.width / img.height;
  const targetRatio = targetW / targetH;

  let drawWidth = targetW;
  let drawHeight = targetH;
  let dx = insetX;
  let dy = insetY;

  if (imgRatio > targetRatio) {
    drawHeight = targetH;
    drawWidth = Math.round(drawHeight * imgRatio);
    dx = Math.round(insetX - (drawWidth - targetW) / 2);
  } else {
    drawWidth = targetW;
    drawHeight = Math.round(drawWidth / imgRatio);
    dy = Math.round(insetY - (drawHeight - targetH) / 2);
  }

  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
}
