import { Edit3, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SCENES } from "../constants/wardrobe";
import type { ClothingItem, Outfit, OutfitScene } from "../types";

type Props = {
  outfits: Outfit[];
  clothes: ClothingItem[];
  onEdit: (outfit: Outfit) => void;
  onDelete: (outfit: Outfit) => void;
  onRename: (outfit: Outfit, name: string, scene: OutfitScene) => void;
};

export function OutfitsPage({ outfits, clothes, onEdit, onDelete, onRename }: Props) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftScene, setDraftScene] = useState<OutfitScene>("上班");
  const byId = useMemo(() => new Map(clothes.map((item) => [item.id, item])), [clothes]);

  const beginRename = (outfit: Outfit) => {
    setRenaming(outfit.id);
    setDraftName(outfit.name);
    setDraftScene(outfit.scene);
  };

  return (
    <div className="space-y-4">
      <div className="page-head">
        <div>
        <h1 className="page-title">我的搭配</h1>
        <p className="page-kicker">{outfits.length} 套已保存搭配</p>
        </div>
      </div>
      <div className="space-y-3">
        {outfits.map((outfit) => (
          <article key={outfit.id} className="outfit-card">
            <div className="scrapbook-bg relative h-36 w-[45%] shrink-0 overflow-hidden rounded-[22px]">
              {outfit.items.map((item) => {
                const clothing = byId.get(item.clothingId);
                if (!clothing) return null;
                return <img key={item.id} src={clothing.cutoutImage || clothing.originalImage} alt="" className="absolute w-24 object-contain" style={{ left: `${item.x / 6}%`, top: `${item.y / 6}%`, zIndex: item.z }} />;
              })}
            </div>
            <div className="min-w-0 flex-1 p-3">
            {renaming === outfit.id ? (
              <div className="mt-3 space-y-2">
                <input className="input" value={draftName} onChange={(event) => setDraftName(event.target.value)} />
                <select className="input" value={draftScene} onChange={(event) => setDraftScene(event.target.value as OutfitScene)}>{SCENES.map((item) => <option key={item}>{item}</option>)}</select>
                <button className="btn-primary w-full justify-center" onClick={() => { onRename(outfit, draftName, draftScene); setRenaming(null); }}>保存</button>
              </div>
            ) : (
              <div>
                <h2 className="font-medium">{outfit.name}</h2>
                <p className="text-sm text-[#8a7488]">{outfit.scene} · {outfit.items.length} 件 · {new Date(outfit.createdAt).toLocaleDateString()}</p>
                <div className="mt-3 flex gap-2">
                  <button className="btn-secondary" onClick={() => onEdit(outfit)}><Edit3 size={16} />继续编辑</button>
                  <button className="btn-secondary" onClick={() => beginRename(outfit)}>重命名</button>
                  <button className="icon-btn text-clay" onClick={() => onDelete(outfit)}><Trash2 size={16} /></button>
                </div>
              </div>
            )}
            </div>
          </article>
        ))}
      </div>
      {!outfits.length && <div className="cute-panel p-12 text-center text-[#8a7488]">还没有保存搭配，去工作台试一套吧。</div>}
    </div>
  );
}
