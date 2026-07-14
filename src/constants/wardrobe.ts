import type { MainCategory, OutfitScene, PlannerDay } from "../types";

export const CATEGORIES: Record<MainCategory, string[]> = {
  上衣: ["吊带", "背心", "短袖", "长袖", "针织衫", "衬衫", "卫衣", "外套"],
  下装: ["短裤", "长裤", "牛仔裤", "短裙", "长裙"],
  连衣裙: ["连衣裙"],
  运动: ["运动背心", "运动短袖", "运动长袖", "运动短裤", "运动长裤", "紧身裤（Leggings）"],
  鞋: ["鞋"],
  帽子: ["帽子"],
  包: ["包"],
  腰带: ["腰带"],
  睡衣: ["睡衣上衣", "睡裤", "睡裙", "睡衣套装"],
  配饰: ["项链", "戒指", "手链", "发饰"]
};

export const MAIN_CATEGORIES = Object.keys(CATEGORIES) as MainCategory[];

export const SCENES: OutfitScene[] = ["上班", "下班健身", "咖啡馆", "在家", "买菜", "拍Vlog", "公园散步", "旅行"];

export const DEFAULT_TAGS = ["春", "夏", "秋", "冬", "日系", "韩系", "森系", "通勤", "舒服", "拍视频", "旅行"];

export const PLANNER_DAYS: PlannerDay[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const DAY_LABELS: Record<PlannerDay, string> = {
  Monday: "周一",
  Tuesday: "周二",
  Wednesday: "周三",
  Thursday: "周四",
  Friday: "周五",
  Saturday: "周六",
  Sunday: "周日"
};
