import { ArrowUpRight, CalendarDays, Heart, Search, Shirt, Sparkles } from "lucide-react";
import type { PointerEvent } from "react";
import { useRef, useState } from "react";
import { DAY_LABELS, PLANNER_DAYS } from "../constants/wardrobe";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { ClothingItem, Outfit, Page, UserProfile, WeeklyPlan } from "../types";

type Props = {
  clothes: ClothingItem[];
  outfits: Outfit[];
  weeklyPlan: WeeklyPlan;
  profile: UserProfile;
  onNavigate: (page: Page) => void;
};

export function HomePage({ clothes, outfits, weeklyPlan, profile, onNavigate }: Props) {
  const inspirationItems = clothes.slice(0, 5);
  const favoriteCount = clothes.filter((item) => item.favorite).length;
  const plannedCount = Object.values(weeklyPlan).filter(Boolean).length;
  const [storedPositions, setStoredPositions] = useLocalStorage<Record<string, { x: number; y: number }>>("wardrobe.inspirationPositions.v1", {});
  const [positions, setPositions] = useState(storedPositions);
  const positionsRef = useRef(positions);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const defaultPositions = [
    { x: 18, y: 18 }, { x: 172, y: 26 }, { x: 92, y: 142 }, { x: 210, y: 158 }, { x: 28, y: 214 }
  ];

  const positionFor = (id: string, index: number) => positions[id] || defaultPositions[index] || { x: 60, y: 60 };

  const beginMove = (event: PointerEvent<HTMLImageElement>, id: string, index: number) => {
    const board = event.currentTarget.parentElement;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const position = positionFor(id, index);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging({ id, offsetX: event.clientX - rect.left - position.x, offsetY: event.clientY - rect.top - position.y });
  };

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width - 112, event.clientX - rect.left - dragging.offsetX));
    const y = Math.max(0, Math.min(rect.height - 112, event.clientY - rect.top - dragging.offsetY));
    const next = { ...positionsRef.current, [dragging.id]: { x, y } };
    positionsRef.current = next;
    setPositions(next);
  };

  const endMove = () => {
    if (!dragging) return;
    setStoredPositions(positionsRef.current);
    setDragging(null);
  };

  return (
    <div className="space-y-4">
      <section className="home-hero">
        <div className="home-hero-photo" />
        <div className="home-hero-copy">
          <p className="home-stamp">THE CLOSET DIARY / 04:26 PM</p>
          <h1>Hi, {profile.name || "there"}</h1>
          <p>你的衣橱，正安静地等你决定今天的样子。</p>
          <button className="home-link" onClick={() => onNavigate("wardrobe")}>看看我的衣服 <ArrowUpRight size={16} /></button>
        </div>
      </section>

      <label className="relative block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b791d6]" size={20} />
        <input className="mobile-search pl-12" placeholder="搜索衣服、搭配、标签" />
      </label>

      <section className="grid grid-cols-2 gap-3">
        <button className="stat-card text-left" onClick={() => onNavigate("wardrobe")}>
          <span className="stat-icon bg-[#efe6ff]"><Shirt size={17} /></span>
          <p className="text-xs text-[#856b98]">我的衣服</p>
          <p className="text-2xl font-black">{clothes.length}<span className="ml-1 text-xs font-medium">件</span></p>
        </button>
        <button className="stat-card text-left" onClick={() => onNavigate("outfits")}>
          <span className="stat-icon bg-[#ffe3f0]"><Sparkles size={17} /></span>
          <p className="text-xs text-[#856b98]">搭配总数</p>
          <p className="text-2xl font-black">{outfits.length}<span className="ml-1 text-xs font-medium">套</span></p>
        </button>
        <button className="stat-card text-left" onClick={() => onNavigate("planner")}>
          <span className="stat-icon bg-[#f8f0c9]"><CalendarDays size={17} /></span>
          <p className="text-xs text-[#856b98]">本周计划</p>
          <p className="text-2xl font-black">{plannedCount}<span className="ml-1 text-xs font-medium">天</span></p>
        </button>
        <button className="stat-card text-left" onClick={() => onNavigate("wardrobe")}>
          <span className="stat-icon bg-[#ffe5f2]"><Heart size={17} /></span>
          <p className="text-xs text-[#856b98]">收藏单品</p>
          <p className="text-2xl font-black">{favoriteCount}<span className="ml-1 text-xs font-medium">件</span></p>
        </button>
      </section>

      <section className="mobile-card overflow-hidden p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="section-kicker">TODAY'S LITTLE LOOK</p>
            <h2 className="text-2xl font-semibold">今日灵感</h2>
            <p className="mt-1 text-xs text-[#8b719d]">从衣橱里挑几件，拼出今天的心情。</p>
          </div>
          <button className="btn-secondary px-3 py-1.5" onClick={() => onNavigate("studio")}>去搭配</button>
        </div>
        <div className="sticker-board min-h-[320px]" onPointerMove={move} onPointerUp={endMove} onPointerCancel={endMove}>
          {inspirationItems.length ? inspirationItems.map((item, index) => (
            <img
              key={item.id}
              src={item.cutoutImage || item.originalImage}
              alt={item.name}
              className={`inspiration-sticker ${dragging?.id === item.id ? "is-moving" : ""}`}
              style={{ transform: `translate3d(${positionFor(item.id, index).x}px, ${positionFor(item.id, index).y}px, 0) rotate(${[-7, 8, 10, -8, 3][index] || 0}deg)` }}
              onPointerDown={(event) => beginMove(event, item.id, index)}
            />
          )) : (
            <div className="flex h-52 items-center justify-center text-center text-sm leading-6 text-[#9a83aa]">
              衣橱正在等待被填满～<br />添加第一件衣服后，这里会变成灵感板。
            </div>
          )}
        </div>
      </section>

      <section className="mobile-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">一周穿搭</h2>
          <button className="text-sm font-semibold text-[#9b68cf]" onClick={() => onNavigate("planner")}>查看</button>
        </div>
        <div className="space-y-2">
          {PLANNER_DAYS.slice(0, 4).map((day) => (
            <div key={day} className="week-preview-row">
              <span className="w-12 text-xs font-black text-[#8e73a3]">{DAY_LABELS[day]}</span>
              <span className="flex-1 text-sm text-[#6b5778]">{weeklyPlan[day] ? outfits.find((item) => item.id === weeklyPlan[day])?.name || "已安排" : "还没有安排"}</span>
              {profile.gymDays.includes(day) && <span className="rounded-full bg-[#f4edff] px-2 py-1 text-[11px] text-[#9b68cf]">{profile.gymTime ? `${profile.gymTime} 健身` : "今天健身"}</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
