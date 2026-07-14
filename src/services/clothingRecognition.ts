import { CATEGORIES } from "../constants/wardrobe";
import type { MainCategory } from "../types";
import { loadImage } from "../utils/image";

export type ClothingRecognition = {
  mainCategory: MainCategory;
  subCategory: string;
  confidence: number;
  reason: string;
};

type MaskStats = {
  width: number;
  height: number;
  aspect: number;
  coverage: number;
  bbox: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
  topWidth: number;
  midWidth: number;
  bottomWidth: number;
  lowerCenterGap: number;
  componentCount: number;
};

const choose = (mainCategory: MainCategory, subCategory: string, confidence: number, reason: string): ClothingRecognition => ({
  mainCategory,
  subCategory: CATEGORIES[mainCategory].includes(subCategory) ? subCategory : CATEGORIES[mainCategory][0],
  confidence,
  reason
});

const fileNameMatches: Array<{ words: string[]; mainCategory: MainCategory; subCategory: string }> = [
  { words: ["吊带", "camisole", "cami", "halter"], mainCategory: "上衣", subCategory: "吊带" },
  { words: ["背心", "vest", "tank"], mainCategory: "上衣", subCategory: "背心" },
  { words: ["短袖", "tshirt", "t-shirt", "tee"], mainCategory: "上衣", subCategory: "短袖" },
  { words: ["长袖", "longsleeve", "long-sleeve"], mainCategory: "上衣", subCategory: "长袖" },
  { words: ["针织", "毛衣", "knit", "sweater", "cardigan"], mainCategory: "上衣", subCategory: "针织衫" },
  { words: ["衬衫", "shirt", "blouse"], mainCategory: "上衣", subCategory: "衬衫" },
  { words: ["卫衣", "hoodie", "sweatshirt"], mainCategory: "上衣", subCategory: "卫衣" },
  { words: ["外套", "夹克", "jacket", "coat"], mainCategory: "上衣", subCategory: "外套" },
  { words: ["牛仔裤", "jeans", "denim"], mainCategory: "下装", subCategory: "牛仔裤" },
  { words: ["短裤", "shorts"], mainCategory: "下装", subCategory: "短裤" },
  { words: ["长裤", "裤子", "trousers", "pants"], mainCategory: "下装", subCategory: "长裤" },
  { words: ["短裙", "miniskirt"], mainCategory: "下装", subCategory: "短裙" },
  { words: ["长裙", "半身裙", "skirt"], mainCategory: "下装", subCategory: "长裙" },
  { words: ["连衣裙", "dress"], mainCategory: "连衣裙", subCategory: "连衣裙" },
  { words: ["睡衣", "pajama", "pyjama"], mainCategory: "睡衣", subCategory: "睡衣套装" },
  { words: ["腰带", "belt"], mainCategory: "腰带", subCategory: "腰带" },
  { words: ["鞋", "sneaker", "boot", "heel", "loafer"], mainCategory: "鞋", subCategory: "鞋" },
  { words: ["帽", "hat", "cap", "beanie"], mainCategory: "帽子", subCategory: "帽子" },
  { words: ["包", "bag", "tote", "purse"], mainCategory: "包", subCategory: "包" }
];

export async function recognizeClothingCategory(originalImage: string, cutoutImage?: string, fileName?: string): Promise<ClothingRecognition> {
  const normalizedName = fileName?.toLowerCase().replace(/\.[a-z0-9]+$/i, "") || "";
  const namedMatch = fileNameMatches.find((entry) => entry.words.some((word) => normalizedName.includes(word)));
  if (namedMatch) return choose(namedMatch.mainCategory, namedMatch.subCategory, 0.92, "根据图片文件名识别");
  const stats = await getMaskStats(cutoutImage || originalImage);
  if (!stats) return choose("上衣", "短袖", 0.22, "图片主体不够清晰，仅作低参考建议");

  if (stats.aspect > 3.1 && stats.coverage < 0.38) {
    return choose("腰带", "腰带", 0.78, "主体又长又窄，像腰带");
  }

  if (stats.aspect > 1.45 && stats.bbox.height < stats.height * 0.48 && stats.componentCount <= 3) {
    return choose("鞋", "鞋", 0.72, "主体横向展开且高度较低，像鞋");
  }

  if (stats.bbox.height > stats.height * 0.72 && stats.lowerCenterGap > 0.28 && stats.bottomWidth > stats.midWidth * 0.72) {
    const subCategory = stats.bbox.height > stats.width * 0.72 ? "长裤" : "短裤";
    return choose("下装", subCategory, 0.7, "下半部分有明显左右裤腿间隔");
  }

  if (stats.bbox.height > stats.bbox.width * 1.12 && stats.bottomWidth > stats.midWidth * 1.16 && stats.lowerCenterGap < 0.22) {
    return choose("连衣裙", "连衣裙", 0.62, "主体偏长且下摆展开，像连衣裙");
  }

  if (stats.bbox.height > stats.bbox.width * 0.9 && stats.bottomWidth > stats.midWidth * 1.22) {
    const subCategory = stats.bbox.height > stats.width * 0.62 ? "长裙" : "短裙";
    return choose("下装", subCategory, 0.6, "下摆展开，像裙装");
  }

  if (stats.topWidth < stats.midWidth * 0.55 && stats.bbox.height < stats.width * 0.95) {
    return choose("上衣", "吊带", 0.74, "肩颈区域较窄，像吊带或背心");
  }

  if (stats.topWidth < stats.midWidth * 0.72) {
    return choose("上衣", "背心", 0.62, "肩部覆盖较少，像背心");
  }

  if (stats.bbox.width > stats.bbox.height * 0.95 && stats.topWidth > stats.midWidth * 0.82) {
    return choose("上衣", "长袖", 0.58, "上半身横向较宽，可能有袖子");
  }

  return choose("上衣", "短袖", 0.38, "轮廓信息有限，仅作低参考建议");
}

async function getMaskStats(imageDataUrl: string): Promise<MaskStats | null> {
  const image = await loadImage(imageDataUrl);
  const max = 520;
  const ratio = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * ratio));
  canvas.height = Math.max(1, Math.round(image.height * ratio));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = frame.data;
  const width = canvas.width;
  const height = canvas.height;
  const mask = new Uint8Array(width * height);
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let count = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const px = i * 4;
      const alpha = data[px + 3];
      const rgb = [data[px], data[px + 1], data[px + 2]];
      const visible = alpha > 30 && !(alpha > 245 && rgb[0] > 248 && rgb[1] > 248 && rgb[2] > 248);
      if (visible) {
        mask[i] = 1;
        count += 1;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (count < width * height * 0.015 || minX > maxX || minY > maxY) return null;
  const bboxWidth = maxX - minX + 1;
  const bboxHeight = maxY - minY + 1;
  const rowWidth = (from: number, to: number) => {
    let total = 0;
    let rows = 0;
    for (let y = Math.round(minY + bboxHeight * from); y < Math.round(minY + bboxHeight * to); y++) {
      let rowMin = width;
      let rowMax = 0;
      for (let x = minX; x <= maxX; x++) {
        if (mask[y * width + x]) {
          rowMin = Math.min(rowMin, x);
          rowMax = Math.max(rowMax, x);
        }
      }
      if (rowMin <= rowMax) {
        total += rowMax - rowMin + 1;
        rows += 1;
      }
    }
    return rows ? total / rows : 0;
  };

  const gapRowsStart = Math.round(minY + bboxHeight * 0.58);
  let gapRows = 0;
  let gapTotal = 0;
  for (let y = gapRowsStart; y <= maxY; y++) {
    const center = Math.round((minX + maxX) / 2);
    const band = Math.max(2, Math.round(bboxWidth * 0.09));
    let empty = 0;
    for (let x = center - band; x <= center + band; x++) {
      if (x >= minX && x <= maxX && !mask[y * width + x]) empty += 1;
    }
    gapTotal += empty / (band * 2 + 1);
    gapRows += 1;
  }

  return {
    width,
    height,
    aspect: bboxWidth / bboxHeight,
    coverage: count / (bboxWidth * bboxHeight),
    bbox: { minX, maxX, minY, maxY, width: bboxWidth, height: bboxHeight },
    topWidth: rowWidth(0.04, 0.2),
    midWidth: rowWidth(0.36, 0.58),
    bottomWidth: rowWidth(0.76, 0.96),
    lowerCenterGap: gapRows ? gapTotal / gapRows : 0,
    componentCount: countComponents(mask, width, height)
  };
}

function countComponents(mask: Uint8Array, width: number, height: number) {
  const visited = new Uint8Array(mask.length);
  const queue: number[] = [];
  let components = 0;
  const push = (i: number) => {
    if (i < 0 || i >= mask.length || visited[i] || !mask[i]) return;
    visited[i] = 1;
    queue.push(i);
  };
  for (let i = 0; i < mask.length; i++) {
    if (visited[i] || !mask[i]) continue;
    components += 1;
    queue.length = 0;
    push(i);
    let cursor = 0;
    while (cursor < queue.length) {
      const point = queue[cursor++];
      const x = point % width;
      const y = Math.floor(point / width);
      if (x > 0) push(point - 1);
      if (x < width - 1) push(point + 1);
      if (y > 0) push(point - width);
      if (y < height - 1) push(point + width);
    }
  }
  return components;
}
