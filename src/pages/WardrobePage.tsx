import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ClothingCard } from "../components/ClothingCard";
import { CATEGORIES, MAIN_CATEGORIES } from "../constants/wardrobe";
import type { ClothingItem, MainCategory } from "../types";

type Props = {
  clothes: ClothingItem[];
  allTags: string[];
  onEdit: (item: ClothingItem) => void;
  onDelete: (item: ClothingItem) => void;
  onToggleFavorite: (item: ClothingItem) => void;
  onReprocess: (item: ClothingItem) => void;
};

export function WardrobePage({ clothes, allTags, onEdit, onDelete, onToggleFavorite, onReprocess }: Props) {
  const [query, setQuery] = useState("");
  const [main, setMain] = useState<MainCategory | "">("");
  const [sub, setSub] = useState("");
  const [color, setColor] = useState("");
  const [tag, setTag] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const colors = useMemo(() => Array.from(new Set(clothes.map((item) => item.color).filter(Boolean))).sort(), [clothes]);
  const filtered = clothes.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) &&
    (!main || item.mainCategory === main) &&
    (!sub || item.subCategory === sub) &&
    (!color || item.color === color) &&
    (!tag || item.tags.includes(tag)) &&
    (!favoriteOnly || item.favorite)
  );

  return (
    <div className="space-y-4">
      <section className="page-head">
        <div>
          <p className="text-sm font-semibold text-[#a17abb]">My wardrobe</p>
          <h1 className="text-[30px] font-black leading-tight tracking-[-0.03em]">衣橱</h1>
        </div>
        <button className={`icon-btn ${favoriteOnly ? "bg-[#efe4ff]" : ""}`} onClick={() => setFavoriteOnly(!favoriteOnly)} title="只看收藏">
          <Filter size={18} />
        </button>
      </section>

      <label className="relative block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b791d6]" size={20} />
        <input className="mobile-search pl-12" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索衣服、颜色、标签" />
      </label>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button className={`chip ${!main ? "chip-active" : ""}`} onClick={() => { setMain(""); setSub(""); }}>全部</button>
        {MAIN_CATEGORIES.map((item) => (
          <button key={item} className={`chip ${main === item ? "chip-active" : ""}`} onClick={() => { setMain(item); setSub(""); }}>{item}</button>
        ))}
      </div>

      <section className="mobile-card p-3">
        <div className="grid grid-cols-3 gap-2">
          <select className="mini-select" value={sub} onChange={(event) => setSub(event.target.value)}>
            <option value="">子类</option>
            {(main ? CATEGORIES[main] : Object.values(CATEGORIES).flat()).map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="mini-select" value={color} onChange={(event) => setColor(event.target.value)}>
            <option value="">颜色</option>
            {colors.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="mini-select" value={tag} onChange={(event) => setTag(event.target.value)}>
            <option value="">标签</option>
            {allTags.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </section>

      {filtered.length ? (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item) => <ClothingCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onToggleFavorite={onToggleFavorite} onReprocess={onReprocess} />)}
        </div>
      ) : (
        <div className="mobile-card p-10 text-center text-[#8a7488]">这里还空空的，去添加第一件衣服吧～</div>
      )}
    </div>
  );
}
