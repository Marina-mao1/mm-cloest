export const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

export const resizeDataUrl = async (src: string, maxSize = 1000) => {
  const image = await loadImage(src);
  const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const keepsAlpha = src.startsWith("data:image/png") || src.startsWith("data:image/webp") || hasTransparentPixels(ctx, canvas.width, canvas.height);
  return keepsAlpha ? canvas.toDataURL("image/webp", 0.86) : canvas.toDataURL("image/jpeg", 0.84);
};

export const rotateDataUrl = async (src: string, degrees: 90 | -90) => {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = image.height;
  canvas.height = image.width;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  return src.startsWith("data:image/png") || src.startsWith("data:image/webp")
    ? canvas.toDataURL("image/webp", 0.86)
    : canvas.toDataURL("image/jpeg", 0.84);
};

export const hasTransparentPixels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const sample = ctx.getImageData(0, 0, width, height).data;
  for (let i = 3; i < sample.length; i += 4) {
    if (sample[i] < 250) return true;
  }
  return false;
};

export const dataUrlHasTransparency = async (src: string) => {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(image.width, 900);
  canvas.height = Math.max(1, Math.round(image.height * (canvas.width / image.width)));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return hasTransparentPixels(ctx, canvas.width, canvas.height);
};
