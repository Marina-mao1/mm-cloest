import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { EntrancePage } from "./components/EntrancePage";
import { FeedbackToast } from "./components/FeedbackToast";
import { ProfileSetupModal } from "./components/ProfileSetupModal";
import { backgroundRemovalService } from "./services/backgroundRemoval";
import { useWardrobeStore } from "./hooks/useWardrobeStore";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { AddClothingPage } from "./pages/AddClothingPage";
import { HomePage } from "./pages/HomePage";
import { OutfitsPage } from "./pages/OutfitsPage";
import { PlannerPage } from "./pages/PlannerPage";
import { ProfilePage } from "./pages/ProfilePage";
import { StudioPage } from "./pages/StudioPage";
import { WardrobePage } from "./pages/WardrobePage";
import type { ClothingItem, HomeColorMap, HomeLocation, Outfit, OutfitScene, Page, PlannerDay, UserProfile } from "./types";

const emptyProfile: UserProfile = { name: "", gymDays: [], gymTime: "", setupComplete: false };

export default function App() {
  const { clothes, setClothes, outfits, setOutfits, weeklyPlan, setWeeklyPlan, allTags, markUsed } = useWardrobeStore();
  const [homeLocations, setHomeLocations] = useLocalStorage<HomeLocation[]>("wardrobe.homeLocations.v1", []);
  const [homeColors, setHomeColors] = useLocalStorage<HomeColorMap>("wardrobe.homeColors.v1", {});
  const [profile, setProfile] = useLocalStorage<UserProfile>("wardrobe.profile.v1", emptyProfile);
  const [page, setPage] = useState<Page>("home");
  const [entranceState, setEntranceState] = useState<"entrance" | "transitioning" | "complete">("entrance");
  const [editingClothing, setEditingClothing] = useState<ClothingItem | null>(null);
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);
  const [notice, setNotice] = useState<{ message: string; kind?: "success" | "delete" } | null>(null);
  const availableHomes = useMemo(() => Array.from(new Set([...homeLocations, ...clothes.map((item) => item.homeLocation).filter(Boolean) as string[]])), [clothes, homeLocations]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const notify = (message: string, kind: "success" | "delete" = "success") => setNotice({ message, kind });

  const navigate = (next: Page) => {
    setPage(next);
    if (next !== "add") setEditingClothing(null);
    if (next !== "studio") setEditingOutfit(null);
  };

  const saveClothing = (item: ClothingItem) => {
    const exists = clothes.some((entry) => entry.id === item.id);
    setClothes((current) => {
      const hasExistingItem = current.some((entry) => entry.id === item.id);
      return hasExistingItem ? current.map((entry) => entry.id === item.id ? item : entry) : [item, ...current];
    });
    notify(exists ? "衣服信息已更新" : "已收进你的衣橱");
  };

  const deleteClothing = (item: ClothingItem) => {
    if (!window.confirm(`确定删除「${item.name}」吗？`)) return;
    setClothes((current) => current.filter((entry) => entry.id !== item.id));
    setOutfits((current) => current.map((outfit) => ({ ...outfit, items: outfit.items.filter((canvasItem) => canvasItem.clothingId !== item.id) })));
    notify("这件衣服已移出衣橱", "delete");
  };

  const toggleFavorite = (item: ClothingItem) => {
    setClothes((current) => current.map((entry) => entry.id === item.id ? { ...entry, favorite: !entry.favorite, updatedAt: new Date().toISOString() } : entry));
    notify(item.favorite ? "已取消收藏" : "已加入收藏");
  };

  const changeHomeLocation = (item: ClothingItem) => {
    if (!availableHomes.length) {
      notify("先添加一个房子，再给衣服做标记");
      return;
    }
    const currentIndex = availableHomes.indexOf(item.homeLocation || "");
    const nextLocation = availableHomes[(currentIndex + 1) % availableHomes.length];
    setClothes((current) => current.map((entry) => entry.id === item.id ? { ...entry, homeLocation: nextLocation, updatedAt: new Date().toISOString() } : entry));
    notify(`已放到${nextLocation}`);
  };

  const addHomeLocation = (name: string, color: string) => {
    const location = name.trim();
    if (!location) return;
    setHomeLocations((current) => current.includes(location) ? current : [...current, location]);
    setHomeColors((current) => ({ ...current, [location]: color }));
    notify(`已添加「${location}」`);
  };

  const saveProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    notify("你的衣橱设置已保存");
  };

  const reprocess = async (item: ClothingItem) => {
    setClothes((current) => current.map((entry) => entry.id === item.id ? { ...entry, imageStatus: "processing", updatedAt: new Date().toISOString() } : entry));
    try {
      const cutoutImage = await backgroundRemovalService.removeBackground(item.originalImage);
      setClothes((current) => current.map((entry) => entry.id === item.id ? { ...entry, cutoutImage, imageStatus: "cutout", updatedAt: new Date().toISOString() } : entry));
      notify("魔法抠图完成");
    } catch {
      setClothes((current) => current.map((entry) => entry.id === item.id ? { ...entry, imageStatus: "failed", updatedAt: new Date().toISOString() } : entry));
      notify("这次抠图没有成功，原图还在", "delete");
    }
  };

  const saveOutfit = (outfit: Outfit, usedIds: string[]) => {
    const exists = outfits.some((entry) => entry.id === outfit.id);
    setOutfits((current) => {
      const exists = current.some((entry) => entry.id === outfit.id);
      return exists ? current.map((entry) => entry.id === outfit.id ? outfit : entry) : [outfit, ...current];
    });
    markUsed(usedIds);
    notify(exists ? "搭配已更新" : "搭配已保存");
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
    notify("这套搭配已删除", "delete");
  };

  const renameOutfit = (outfit: Outfit, name: string, scene: OutfitScene) => {
    const now = new Date().toISOString();
    setOutfits((current) => current.map((entry) => entry.id === outfit.id ? { ...entry, name: name.trim() || entry.name, scene, updatedAt: now } : entry));
    notify("搭配信息已更新");
  };

  const assignDay = (day: PlannerDay, outfitId?: string) => {
    setWeeklyPlan((current) => ({ ...current, [day]: outfitId }));
    const outfit = outfits.find((entry) => entry.id === outfitId);
    if (outfit) {
      markUsed(outfit.items.map((item) => item.clothingId));
      notify("已经放进本周计划");
    }
  };

  return (
    <>
    <div className={`main-stage ${entranceState === "transitioning" ? "is-revealing" : ""} ${entranceState === "complete" ? "is-ready" : ""}`}>
    <AppShell page={page} ownerName={profile.name} onNavigate={navigate}>
      {page === "home" && (
        <HomePage clothes={clothes} outfits={outfits} weeklyPlan={weeklyPlan} profile={profile} onNavigate={navigate} />
      )}
      {page === "wardrobe" && (
        <WardrobePage
          clothes={clothes}
          allTags={allTags}
          onEdit={(item) => { setEditingClothing(item); setPage("add"); }}
          onDelete={deleteClothing}
          onToggleFavorite={toggleFavorite}
          onReprocess={reprocess}
          homeColors={homeColors}
          onHomeColorsChange={setHomeColors}
          onChangeHomeLocation={changeHomeLocation}
          homeLocations={availableHomes}
          onAddHomeLocation={addHomeLocation}
        />
      )}
      {page === "add" && (
        <AddClothingPage
          clothesCount={clothes.length}
          editing={editingClothing}
          allTags={allTags}
          homeLocations={availableHomes}
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
      {page === "planner" && <PlannerPage outfits={outfits} weeklyPlan={weeklyPlan} profile={profile} onAssign={assignDay} />}
      {page === "profile" && <ProfilePage profile={profile} onSave={saveProfile} />}
    </AppShell>
    </div>
    {entranceState !== "complete" && (
      <EntrancePage
        onBeginEnter={() => setEntranceState("transitioning")}
        onCompleteEnter={() => setEntranceState("complete")}
      />
    )}
    {entranceState === "complete" && !profile.setupComplete && <ProfileSetupModal profile={profile} onSave={saveProfile} />}
    {notice && <FeedbackToast message={notice.message} kind={notice.kind} />}
    </>
  );
}
