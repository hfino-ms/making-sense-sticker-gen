export async function composeStickerFromSource(stickerSource: string | null | undefined, frameUrl?: string, size = 1024, options?: { agentLabel?: string | null; drawFrame?: boolean }): Promise<string> {
  if (!stickerSource) return '';

  const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });

  try {
    const stickerImg = await loadImage(stickerSource);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas context');

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Draw sticker centered inside the canvas with an inset margin so the frame remains visible
    const drawInset = (img: HTMLImageElement, insetPercent = 0.06) => {
      // insetPercent defines padding relative to canvas size (6% default)
      const insetX = Math.round(canvas.width * insetPercent);
      const insetY = Math.round(canvas.height * insetPercent);
      const targetW = canvas.width - insetX * 2;
      const targetH = canvas.height - insetY * 2;

      const imgRatio = img.width / img.height;
      const targetRatio = targetW / targetH;

      let drawWidth = targetW;
      let drawHeight = targetH;
      let dx = insetX;
      let dy = insetY;

      if (imgRatio > targetRatio) {
        // image is wider, fit height of target area and crop width
        drawHeight = targetH;
        drawWidth = Math.round(drawHeight * imgRatio);
        dx = Math.round(insetX - (drawWidth - targetW) / 2);
      } else {
        // image is taller or equal, fit width of target area and crop height
        drawWidth = targetW;
        drawHeight = Math.round(drawWidth / imgRatio);
        dy = Math.round(insetY - (drawHeight - targetH) / 2);
      }

      ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
    };

    // Use a small inset so the frame border doesn't overlap sticker content
    drawInset(stickerImg, 0.06);

    const defaultFrame = 'https://cdn.builder.io/api/v1/image/assets%2Fae236f9110b842838463c282b8a0dfd9%2F22ecb8e2464b40dd8952c31710f2afe2?format=png&width=2000';
    const frameToLoad = frameUrl || defaultFrame;

    const shouldDrawFrame = options?.drawFrame ?? true;

    if (shouldDrawFrame) {
      try {
        const frameImg = await loadImage(frameToLoad);
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
      } catch (e) {
        console.warn('composeStickerFromSource: failed to load frame overlay', e);
      }
    }

    // NOTE: agentLabel is intentionally not rendered here; htmlToCanvas.composeStickerWithHtmlLabel handles label rendering.

    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error('composeStickerFromSource failed', e);
    // fallback to original source if composition fails
    return String(stickerSource);
  }
}
