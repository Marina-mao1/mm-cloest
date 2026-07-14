import { loadImage } from "../utils/image";

export interface BackgroundRemovalService {
  removeBackground(imageDataUrl: string): Promise<string>;
}

type RGB = [number, number, number];

const colorDistance = (a: number[], b: number[]) =>
  Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

const colorKey = (rgb: RGB) => `${Math.round(rgb[0] / 24)}-${Math.round(rgb[1] / 24)}-${Math.round(rgb[2] / 24)}`;

const luminance = (rgb: number[]) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

const saturation = (rgb: number[]) => {
  const max = Math.max(rgb[0], rgb[1], rgb[2]);
  const min = Math.min(rgb[0], rgb[1], rgb[2]);
  return max === 0 ? 0 : (max - min) / max;
};

export class LocalCanvasBackgroundRemovalService implements BackgroundRemovalService {
  async removeBackground(imageDataUrl: string): Promise<string> {
    const image = await loadImage(imageDataUrl);
    const max = 1100;
    const ratio = Math.min(1, max / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * ratio);
    canvas.height = Math.round(image.height * ratio);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frame.data;
    const w = canvas.width;
    const h = canvas.height;

    const backgroundColors = this.pickBackgroundColors(data, w, h);
    const background = new Uint8Array(w * h);
    const queued = new Uint8Array(w * h);
    const queue: Array<[number, number, RGB]> = [];
    const push = (x: number, y: number, parent: RGB) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const i = y * w + x;
      if (!queued[i]) {
        queued[i] = 1;
        queue.push([x, y, parent]);
      }
    };

    for (let x = 0; x < w; x++) {
      push(x, 0, this.rgbAt(data, x, 0, w));
      push(x, h - 1, this.rgbAt(data, x, h - 1, w));
    }
    for (let y = 0; y < h; y++) {
      push(0, y, this.rgbAt(data, 0, y, w));
      push(w - 1, y, this.rgbAt(data, w - 1, y, w));
    }

    let index = 0;
    while (index < queue.length) {
      const [x, y, parentRgb] = queue[index++];
      const point = y * w + x;
      const rgb = this.rgbAt(data, x, y, w);
      if (this.isBackgroundPixel(rgb, parentRgb, backgroundColors, x, y, w, h)) {
        background[point] = 1;
        push(x + 1, y, rgb);
        push(x - 1, y, rgb);
        push(x, y + 1, rgb);
        push(x, y - 1, rgb);
      }
    }

    for (let i = 0; i < background.length; i++) {
      if (background[i]) {
        const px = i * 4;
        data[px + 3] = 0;
      }
    }

    this.keepSubjectComponents(data, w, h);
    this.softenAlpha(data, w, h);
    ctx.putImageData(frame, 0, 0);
    return this.cropTransparent(canvas);
  }

  private rgbAt(data: Uint8ClampedArray, x: number, y: number, width: number): RGB {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  }

  private pickBackgroundColors(data: Uint8ClampedArray, width: number, height: number) {
    const buckets = new Map<string, { count: number; rgb: RGB }>();
    const add = (rgb: RGB) => {
      const key = colorKey(rgb);
      const current = buckets.get(key);
      if (current) {
        current.count += 1;
        current.rgb = [
          current.rgb[0] + (rgb[0] - current.rgb[0]) / current.count,
          current.rgb[1] + (rgb[1] - current.rgb[1]) / current.count,
          current.rgb[2] + (rgb[2] - current.rgb[2]) / current.count
        ];
      } else {
        buckets.set(key, { count: 1, rgb: [...rgb] as RGB });
      }
    };
    const step = Math.max(2, Math.floor(Math.min(width, height) / 36));
    const bands = Math.max(10, Math.floor(Math.min(width, height) * 0.08));
    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < bands; y += step) add(this.rgbAt(data, x, y, width));
      for (let y = height - bands; y < height; y += step) add(this.rgbAt(data, x, y, width));
    }
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < bands; x += step) add(this.rgbAt(data, x, y, width));
      for (let x = width - bands; x < width; x += step) add(this.rgbAt(data, x, y, width));
    }
    return Array.from(buckets.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((bucket) => bucket.rgb);
  }

  private isBackgroundPixel(rgb: RGB, parentRgb: RGB, backgroundColors: RGB[], x: number, y: number, width: number, height: number) {
    const minBgDistance = Math.min(...backgroundColors.map((bg) => colorDistance(rgb, bg)));
    const localDistance = colorDistance(rgb, parentRgb);
    const edgeDistance = Math.min(x, y, width - 1 - x, height - 1 - y);
    const nearEdge = edgeDistance < Math.min(width, height) * 0.08;
    const flatBackground = saturation(rgb) < 0.16 && luminance(rgb) > 165;
    return (
      minBgDistance < (nearEdge ? 92 : 74) ||
      this.isNearWhite(rgb) ||
      (localDistance < 26 && minBgDistance < 105) ||
      (flatBackground && minBgDistance < 128)
    );
  }

  private isNearWhite(rgb: number[]) {
    return rgb[0] > 232 && rgb[1] > 232 && rgb[2] > 232;
  }

  private keepSubjectComponents(data: Uint8ClampedArray, width: number, height: number) {
    const total = width * height;
    const visited = new Uint8Array(total);
    const components: Array<{ pixels: number[]; area: number; minX: number; maxX: number; minY: number; maxY: number; score: number }> = [];
    const queue: number[] = [];
    const push = (i: number) => {
      if (i < 0 || i >= total || visited[i] || data[i * 4 + 3] === 0) return;
      visited[i] = 1;
      queue.push(i);
    };
    for (let start = 0; start < total; start++) {
      if (visited[start] || data[start * 4 + 3] === 0) continue;
      queue.length = 0;
      push(start);
      const pixels: number[] = [];
      let minX = width;
      let maxX = 0;
      let minY = height;
      let maxY = 0;
      let cursor = 0;
      while (cursor < queue.length) {
        const i = queue[cursor++];
        pixels.push(i);
        const x = i % width;
        const y = Math.floor(i / width);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        if (x > 0) push(i - 1);
        if (x < width - 1) push(i + 1);
        if (y > 0) push(i - width);
        if (y < height - 1) push(i + width);
      }
      const centerX = (minX + maxX) / 2 / width;
      const centerY = (minY + maxY) / 2 / height;
      const centerBonus = 1.3 - Math.min(0.9, Math.hypot(centerX - 0.5, centerY - 0.5));
      components.push({ pixels, area: pixels.length, minX, maxX, minY, maxY, score: pixels.length * centerBonus });
    }

    if (!components.length) return;
    const bestScore = Math.max(...components.map((component) => component.score));
    const bestArea = Math.max(...components.map((component) => component.area));
    for (const component of components) {
      const componentWidth = component.maxX - component.minX + 1;
      const componentHeight = component.maxY - component.minY + 1;
      const meaningful = component.area > Math.max(180, bestArea * 0.035);
      const largeStickerPart = component.area > bestArea * 0.16 && componentWidth > width * 0.08 && componentHeight > height * 0.08;
      const keep = component.score > bestScore * 0.18 && (meaningful || largeStickerPart);
      if (!keep) {
        for (const i of component.pixels) data[i * 4 + 3] = 0;
      }
    }
  }

  private softenAlpha(data: Uint8ClampedArray, width: number, height: number) {
    const alpha = new Uint8ClampedArray(width * height);
    for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        if (alpha[i] !== 0) continue;
        const neighbors = alpha[i - 1] + alpha[i + 1] + alpha[i - width] + alpha[i + width];
        if (neighbors > 0) data[i * 4 + 3] = 36;
      }
    }
  }

  private cropTransparent(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return canvas.toDataURL("image/png");
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frame.data;
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (data[(y * canvas.width + x) * 4 + 3] > 12) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (minX > maxX || minY > maxY) return canvas.toDataURL("image/png");
    const padding = Math.round(Math.min(canvas.width, canvas.height) * 0.035);
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width - 1, maxX + padding);
    maxY = Math.min(canvas.height - 1, maxY + padding);
    const cropped = document.createElement("canvas");
    cropped.width = maxX - minX + 1;
    cropped.height = maxY - minY + 1;
    cropped.getContext("2d")?.drawImage(canvas, minX, minY, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
    return cropped.toDataURL("image/png");
  }
}

export const backgroundRemovalService: BackgroundRemovalService = new LocalCanvasBackgroundRemovalService();
