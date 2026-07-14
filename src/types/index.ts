export type MainCategory =
  | "上衣"
  | "下装"
  | "连衣裙"
  | "运动"
  | "鞋"
  | "帽子"
  | "包"
  | "腰带"
  | "睡衣"
  | "配饰";

export type ImageStatus = "original" | "processing" | "cutout" | "failed";

export type HomeLocation = string;

export type HomeColorMap = Record<HomeLocation, string>;

export type ClothingItem = {
  id: string;
  name: string;
  mainCategory: MainCategory;
  subCategory: string;
  color: string;
  homeLocation?: HomeLocation;
  tags: string[];
  favorite: boolean;
  note: string;
  originalImage: string;
  cutoutImage?: string;
  imageStatus: ImageStatus;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type OutfitScene =
  | "上班"
  | "下班健身"
  | "咖啡馆"
  | "在家"
  | "买菜"
  | "拍Vlog"
  | "公园散步"
  | "旅行";

export type CanvasItem = {
  id: string;
  clothingId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z: number;
};

export type Outfit = {
  id: string;
  name: string;
  scene: OutfitScene;
  items: CanvasItem[];
  createdAt: string;
  updatedAt: string;
};

export type PlannerDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type WeeklyPlan = Record<PlannerDay, string | undefined>;

export type UserProfile = {
  name: string;
  gymDays: PlannerDay[];
  gymTime: string;
  setupComplete: boolean;
};

export type Page = "home" | "wardrobe" | "add" | "studio" | "outfits" | "planner" | "profile";
