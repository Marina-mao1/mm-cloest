import { useMemo } from "react";
import type { ClothingItem, Outfit, WeeklyPlan } from "../types";
import { useLocalStorage } from "./useLocalStorage";
import { PLANNER_DAYS } from "../constants/wardrobe";

const emptyPlan = PLANNER_DAYS.reduce((acc, day) => ({ ...acc, [day]: undefined }), {}) as WeeklyPlan;

export function useWardrobeStore() {
  const [clothes, setClothes] = useLocalStorage<ClothingItem[]>("wardrobe.clothes.v1", []);
  const [outfits, setOutfits] = useLocalStorage<Outfit[]>("wardrobe.outfits.v1", []);
  const [weeklyPlan, setWeeklyPlan] = useLocalStorage<WeeklyPlan>("wardrobe.weeklyPlan.v1", emptyPlan);

  const allTags = useMemo(() => Array.from(new Set(clothes.flatMap((item) => item.tags))).sort(), [clothes]);

  const markUsed = (ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids));
    const now = new Date().toISOString();
    setClothes((current) =>
      current.map((item) =>
        uniqueIds.includes(item.id) ? { ...item, usageCount: item.usageCount + 1, lastUsedAt: now, updatedAt: now } : item
      )
    );
  };

  return {
    clothes,
    setClothes,
    outfits,
    setOutfits,
    weeklyPlan,
    setWeeklyPlan,
    allTags,
    markUsed
  };
}
