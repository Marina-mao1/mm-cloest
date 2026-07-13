import { CalendarDays, Heart, Search, Shirt, Sparkles } from "lucide-react";
import { DAY_LABELS, PLANNER_DAYS } from "../constants/wardrobe";
import type { ClothingItem, Outfit, Page, WeeklyPlan } from "../types";
import purpleClematis from "../assets/purple-clematis-cutout.png";

type Props = {
  clothes: ClothingItem[];
  outfits: Outfit[];
  weeklyPlan: WeeklyPlan;
  onNavigate: (page: Page) => void;
};

export function HomePage({ clothes, outfits, weeklyPlan, onNavigate }: Props) {
  const inspirationItems = clothes.slice(0, 5);
  const favoriteCount = clothes.filter((item) => item.favorite).length;
  const plannedCount = Object.values(weeklyPlan).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <section className="home-hero">
        <div className="doodle-star left-5 top-5" />
        <div className="doodle-heart right-7 top-24" />
        <div className="doodle-burst bottom-6 right-14" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#9a75bb]">Hi, Marina</p>
            <h1 className="mt-1 text-[32px] font-black leading-tight tracking-[-0.04em]">今天也要闪闪发光</h1>
            <p className="mt-2 max-w-[15rem] text-sm leading-6 text-[#755f88]">把明天穿什么，变成一件轻松的小事。</p>
          </div>
          <img className="hero-flower" src={purpleClematis} alt="" aria-hidden="true" />
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
            <h2 className="text-xl font-black">今日灵感</h2>
            <p className="mt-1 text-xs text-[#8b719d]">今天还没有搭配灵感，去创造一套 Look 吧～</p>
          </div>
          <button className="btn-secondary px-3 py-1.5" onClick={() => onNavigate("studio")}>去搭配</button>
        </div>
        <div className="sticker-board min-h-56">
          {inspirationItems.length ? inspirationItems.map((item, index) => (
            <img
              key={item.id}
              src={item.cutoutImage || item.originalImage}
              alt={item.name}
              className={`inspiration-sticker inspiration-sticker-${index + 1}`}
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
              {(day === "Monday" || day === "Wednesday") && <span className="rounded-full bg-[#f4edff] px-2 py-1 text-[11px] text-[#9b68cf]">今晚健身</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
