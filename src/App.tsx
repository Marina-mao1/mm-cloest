import { useState } from "react";
import { AppShell } from "./components/AppShell";
import { backgroundRemovalService } from "./services/backgroundRemoval";
import { useWardrobeStore } from "./hooks/useWardrobeStore";
import { AddClothingPage } from "./pages/AddClothingPage";
import { HomePage } from "./pages/HomePage";
import { OutfitsPage } from "./pages/OutfitsPage";
import { PlannerPage } from "./pages/PlannerPage";
import { StudioPage } from "./pages/StudioPage";
import { WardrobePage } from "./pages/WardrobePage";
import type { ClothingItem, Outfit, OutfitScene, Page, PlannerDay } from "./types";

export default function App() {
  const { clothes, setClothes, outfits, setOutfits, weeklyPlan, setWeeklyPlan, allTags, markUsed } = useWardrobeStore();
  const [page, setPage] = useState<Page>("home");
  const [editingClothing, setEditingClothing] = useState<ClothingItem | null>(null);
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);

  const navigate = (next: Page) => {
    setPage(next);
    if (next !== "add") setEditingClothing(null);
    if (next !== "studio") setEditingOutfit(null);
  };

  const saveClothing = (item: ClothingItem) => {
    setClothes((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      return exists ? current.map((entry) => entry.id === item.id ? item : entry) : [item, ...current];
    });
  };

  const deleteClothing = (item: ClothingItem) => {
    if (!window.confirm(`确定删除「${item.name}」吗？`)) return;
    setClothes((current) => current.filter((entry) => entry.id !== item.id));
    setOutfits((current) => current.map((outfit) => ({ ...outfit, items: outfit.items.filter((canvasItem) => canvasItem.clothingId !== item.id) })));
  };

  const toggleFavorite = (item: ClothingItem) => {
    setClothes((current) => current.map((entry) => entry.id === item.id ? { ...entry, favorite: !entry.favorite, updatedAt: new Date().toISOString() } : entry));
  };

  const reprocess = async (item: ClothingItem) => {
    setClothes((current) => current.map((entry) => entry.id === item.id ? { ...entry, imageStatus: "processing", updatedAt: new Date().toISOString() } : entry));
    try {
      const cutoutImage = await backgroundRemovalService.removeBackground(item.originalImage);
      setClothes((current) => current.map((entry) => entry.id === item.id ? { ...entry, cutoutImage, imageStatus: "cutout", updatedAt: new Date().toISOString() } : entry));
    } catch {
      setClothes((current) => current.map((entry) => entry.id === item.id ? { ...entry, imageStatus: "failed", updatedAt: new Date().toISOString() } : entry));
    }
  };

  const saveOutfit = (outfit: Outfit, usedIds: string[]) => {
    setOutfits((current) => {
      const exists = current.some((entry) => entry.id === outfit.id);
      return exists ? current.map((entry) => entry.id === outfit.id ? outfit : entry) : [outfit, ...current];
    });
    markUsed(usedIds);
    setEditingOutfit(null);
    setPage("outfits");
  };

  const deleteOutfit = (outfit: Outfit) => {
    if (!window.confirm(`确定删除「${outfit.name}」吗？`)) return;
    setOutfits((current) => current.filter((entry) => entry.id !== outfit.id));
    setWeeklyPlan((current) => {
      const next = { ...current };
      Object.keys(next).forEach((day) => {
        if (next[day as PlannerDay] === outfit.id) next[day as PlannerDay] = undefined;
      });
      return next;
    });
  };

  const renameOutfit = (outfit: Outfit, name: string, scene: OutfitScene) => {
    const now = new Date().toISOString();
    setOutfits((current) => current.map((entry) => entry.id === outfit.id ? { ...entry, name: name.trim() || entry.name, scene, updatedAt: now } : entry));
  };

  const assignDay = (day: PlannerDay, outfitId?: string) => {
    setWeeklyPlan((current) => ({ ...current, [day]: outfitId }));
    const outfit = outfits.find((entry) => entry.id === outfitId);
    if (outfit) markUsed(outfit.items.map((item) => item.clothingId));
  };

  return (
    <AppShell page={page} onNavigate={navigate}>
      {page === "home" && (
        <HomePage clothes={clothes} outfits={outfits} weeklyPlan={weeklyPlan} onNavigate={navigate} />
      )}
      {page === "wardrobe" && (
        <WardrobePage
          clothes={clothes}
          allTags={allTags}
          onEdit={(item) => { setEditingClothing(item); setPage("add"); }}
          onDelete={deleteClothing}
          onToggleFavorite={toggleFavorite}
          onReprocess={reprocess}
        />
      )}
      {page === "add" && (
        <AddClothingPage
          clothesCount={clothes.length}
          editing={editingClothing}
          allTags={allTags}
          onSave={saveClothing}
          onCancelEdit={() => { setEditingClothing(null); setPage("wardrobe"); }}
          onAfterCreate={() => setPage("wardrobe")}
        />
      )}
      {page === "studio" && (
        <StudioPage
          clothes={clothes}
          editingOutfit={editingOutfit}
          onSave={saveOutfit}
          onCancelEdit={() => { setEditingOutfit(null); setPage("outfits"); }}
        />
      )}
      {page === "outfits" && (
        <OutfitsPage
          outfits={outfits}
          clothes={clothes}
          onEdit={(outfit) => { setEditingOutfit(outfit); setPage("studio"); }}
          onDelete={deleteOutfit}
          onRename={renameOutfit}
        />
      )}
      {page === "planner" && <PlannerPage outfits={outfits} weeklyPlan={weeklyPlan} onAssign={assignDay} />}
    </AppShell>
  );
}
