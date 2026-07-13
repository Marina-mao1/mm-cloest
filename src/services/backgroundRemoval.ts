import { loadImage } from "../utils/image";

export interface BackgroundRemovalService {
  removeBackground(imageDataUrl: string): Promise<string>;
}

const colorDistance = (a: number[], b: number[]) =>
  Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

export class LocalCanvasBackgroundRemovalService implements BackgroundRemovalService {
  async removeBackground(imageDataUrl: string): Promise<string> {
    const image = await loadImage(imageDataUrl);
    const max = 900;
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
    const samples: number[][] = [];
    const step = Math.max(2, Math.floor(Math.min(w, h) / 24));
    for (let x = 0; x < w; x += step) {
      samples.push(this.rgbAt(data, x, 0, w), this.rgbAt(data, x, h - 1, w));
    }
    for (let y = 0; y < h; y += step) {
      samples.push(this.rgbAt(data, 0, y, w), this.rgbAt(data, w - 1, y, w));
    }
    const bg = samples.reduce((acc, rgb) => [acc[0] + rgb[0], acc[1] + rgb[1], acc[2] + rgb[2]], [0, 0, 0]).map((v) => v / samples.length);
    const visited = new Uint8Array(w * h);
    const queue: number[] = [];
    const push = (x: number, y: number) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const i = y * w + x;
      if (!visited[i]) {
        visited[i] = 1;
        queue.push(i);
      }
    };
    for (let x = 0; x < w; x++) {
      push(x, 0);
      push(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      push(0, y);
      push(w - 1, y);
    }
    let index = 0;
    while (index < queue.length) {
      const point = queue[index++];
      const x = point % w;
      const y = Math.floor(point / w);
      const rgb = this.rgbAt(data, x, y, w);
      const tolerance = 66 + Math.min(38, colorDistance(rgb, bg) * 0.12);
      if (colorDistance(rgb, bg) < tolerance || this.isNearWhite(rgb)) {
        push(x + 1, y);
        push(x - 1, y);
        push(x, y + 1);
        push(x, y - 1);
      }
    }
    for (let i = 0; i < visited.length; i++) {
      if (visited[i]) {
        const px = i * 4;
        data[px + 3] = 0;
      }
    }
    this.softenAlpha(data, w, h);
    ctx.putImageData(frame, 0, 0);
    return canvas.toDataURL("image/png");
  }

  private rgbAt(data: Uint8ClampedArray, x: number, y: number, width: number) {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  }

  private isNearWhite(rgb: number[]) {
    return rgb[0] > 236 && rgb[1] > 236 && rgb[2] > 236;
  }

  private softenAlpha(data: Uint8ClampedArray, width: number, height: number) {
    const alpha = new Uint8ClampedArray(width * height);
    for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        if (alpha[i] !== 0) continue;
        const neighbors = alpha[i - 1] + alpha[i + 1] + alpha[i - width] + alpha[i + width];
        if (neighbors > 0) data[i * 4 + 3] = 48;
      }
    }
  }
}

export const backgroundRemovalService: BackgroundRemovalService = new LocalCanvasBackgroundRemovalService();
