import { Check, ChevronDown, Filter, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ClothingCard } from "../components/ClothingCard";
import { CATEGORIES, MAIN_CATEGORIES } from "../constants/wardrobe";
import type { ClothingItem, HomeColorMap, HomeLocation, MainCategory } from "../types";

type Props = {
  clothes: ClothingItem[];
  allTags: string[];
  onEdit: (item: ClothingItem) => void;
  onDelete: (item: ClothingItem) => void;
  onToggleFavorite: (item: ClothingItem) => void;
  onReprocess: (item: ClothingItem) => void;
  onChangeHomeLocation: (item: ClothingItem) => void;
  homeColors: HomeColorMap;
  onHomeColorsChange: (colors: HomeColorMap) => void;
  homeLocations: string[];
  onAddHomeLocation: (name: string, color: string) => void;
  onUpdateHomeLocation: (previousName: string, nextName: string, color: string) => void;
  onDeleteHomeLocation: (name: string) => void;
};

export function WardrobePage({ clothes, allTags, onEdit, onDelete, onToggleFavorite, onReprocess, onChangeHomeLocation, homeColors, onHomeColorsChange, homeLocations, onAddHomeLocation, onUpdateHomeLocation, onDeleteHomeLocation }: Props) {
  const [query, setQuery] = useState("");
  const [main, setMain] = useState<MainCategory | "">("");
  const [sub, setSub] = useState("");
  const [color, setColor] = useState("");
  const [tag, setTag] = useState("");
  const [homeLocation, setHomeLocation] = useState<HomeLocation | "">("");
  const [newHomeName, setNewHomeName] = useState("");
  const [newHomeColor, setNewHomeColor] = useState("#c85c72");
  const [homeMenuOpen, setHomeMenuOpen] = useState(false);
  const [editingHome, setEditingHome] = useState<string | null>(null);
  const [editingHomeName, setEditingHomeName] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const colors = useMemo(() => Array.from(new Set(clothes.map((item) => item.color).filter(Boolean))).sort(), [clothes]);
  const filtered = clothes.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) &&
    (!main || item.mainCategory === main) &&
    (!sub || item.subCategory === sub) &&
    (!color || item.color === color) &&
    (!tag || item.tags.includes(tag)) &&
    (!homeLocation || item.homeLocation === homeLocation) &&
    (!favoriteOnly || item.favorite)
  );

  const addHome = () => {
    if (!newHomeName.trim()) return;
    onAddHomeLocation(newHomeName, newHomeColor);
    setNewHomeName("");
    setHomeMenuOpen(false);
  };

  const startEditHome = (location: string) => {
    setEditingHome(location);
    setEditingHomeName(location);
  };

  const saveHome = (location: string) => {
    onUpdateHomeLocation(location, editingHomeName, homeColors[location] || "#b9ada7");
    setEditingHome(null);
    setEditingHomeName("");
  };

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
        <div className="grid grid-cols-2 gap-2">
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
          <div className="relative">
            <button className="mini-select home-filter-trigger" type="button" onClick={() => setHomeMenuOpen((current) => !current)}>
              <span>{homeLocation || "所有房子"}</span><ChevronDown size={15} />
            </button>
            {homeMenuOpen && (
              <div className="home-filter-menu">
                <button className={!homeLocation ? "is-selected" : ""} type="button" onClick={() => { setHomeLocation(""); setHomeMenuOpen(false); }}>所有房子</button>
                {homeLocations.map((location) => (
                  <div className="home-filter-option" key={location}>
                    {editingHome === location ? (
                      <input
                        className="home-edit-input"
                        value={editingHomeName}
                        autoFocus
                        onChange={(event) => setEditingHomeName(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && saveHome(location)}
                        aria-label="房子名称"
                      />
                    ) : (
                      <button className={homeLocation === location ? "is-selected" : ""} type="button" onClick={() => { setHomeLocation(location); setHomeMenuOpen(false); }}>
                        <i style={{ backgroundColor: homeColors[location] || "#b9ada7" }} />{location}
                      </button>
                    )}
                    <label title={`选择${location}的标记颜色`}>
                      <input type="color" value={homeColors[location] || "#b9ada7"} onChange={(event) => onHomeColorsChange({ ...homeColors, [location]: event.target.value })} />
                      <i style={{ backgroundColor: homeColors[location] || "#b9ada7" }} />
                    </label>
                    {editingHome === location ? (
                      <>
                        <button className="home-action" type="button" title="保存名称" onClick={() => saveHome(location)}><Check size={14} /></button>
                        <button className="home-action" type="button" title="取消" onClick={() => setEditingHome(null)}><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <button className="home-action" type="button" title="修改房子名称" onClick={() => startEditHome(location)}><Pencil size={13} /></button>
                        <button className="home-action home-delete" type="button" title="删除这个房子" onClick={() => onDeleteHomeLocation(location)}><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                ))}
                <div className="home-filter-add">
                  <input value={newHomeName} onChange={(event) => setNewHomeName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addHome())} placeholder="添加房子" />
                  <label title="选择这个房子的颜色"><input type="color" value={newHomeColor} onChange={(event) => setNewHomeColor(event.target.value)} /><i style={{ backgroundColor: newHomeColor }} /></label>
                  <button type="button" title="添加房子" onClick={addHome}><Plus size={16} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {filtered.length ? (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item) => <ClothingCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onToggleFavorite={onToggleFavorite} onReprocess={onReprocess} onChangeHomeLocation={onChangeHomeLocation} homeColors={homeColors} homeLocations={homeLocations} />)}
        </div>
      ) : (
        <div className="mobile-card p-10 text-center text-[#8a7488]">这里还空空的，去添加第一件衣服吧～</div>
      )}
    </div>
  );
}
