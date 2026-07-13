import { Save, Trash2, X } from "lucide-react";
import type { DragEvent, PointerEvent } from "react";
import { useMemo, useState } from "react";
import { ClothingCard } from "../components/ClothingCard";
import { SCENES } from "../constants/wardrobe";
import type { CanvasItem, ClothingItem, Outfit, OutfitScene } from "../types";
import { createId } from "../utils/id";

type Props = {
  clothes: ClothingItem[];
  editingOutfit?: Outfit | null;
  onSave: (outfit: Outfit, usedIds: string[]) => void;
  onCancelEdit: () => void;
};

export function StudioPage({ clothes, editingOutfit, onSave, onCancelEdit }: Props) {
  const [items, setItems] = useState<CanvasItem[]>(editingOutfit?.items || []);
  const [name, setName] = useState(editingOutfit?.name || "");
  const [scene, setScene] = useState<OutfitScene>(editingOutfit?.scene || "上班");
  const [draggedClothing, setDraggedClothing] = useState<ClothingItem | null>(null);
  const [active, setActive] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const byId = useMemo(() => new Map(clothes.map((item) => [item.id, item])), [clothes]);

  const addToCanvas = (clothingId: string, x = 120, y = 120) => {
    setItems((current) => [...current, { id: createId("canvas"), clothingId, x, y, scale: 1, rotation: 0, z: current.length + 1 }]);
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!draggedClothing) return;
    const rect = event.currentTarget.getBoundingClientRect();
    addToCanvas(draggedClothing.id, event.clientX - rect.left - 70, event.clientY - rect.top - 90);
    setDraggedClothing(null);
  };

  const pointerDown = (event: PointerEvent<HTMLDivElement>, item: CanvasItem) => {
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    setItems((current) => current.map((canvasItem) => canvasItem.id === item.id ? { ...canvasItem, z: current.length + 2 } : canvasItem));
    setActive({ id: item.id, dx: event.clientX - item.x, dy: event.clientY - item.y });
  };

  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!active) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setItems((current) => current.map((item) => item.id === active.id ? { ...item, x: event.clientX - rect.left - active.dx + rect.left, y: event.clientY - rect.top - active.dy + rect.top } : item));
  };

  const save = () => {
    if (!name.trim() || !items.length) return;
    const now = new Date().toISOString();
    onSave({
      id: editingOutfit?.id || createId("outfit"),
      name: name.trim(),
      scene,
      items,
      createdAt: editingOutfit?.createdAt || now,
      updatedAt: now
    }, items.map((item) => item.clothingId));
    if (!editingOutfit) {
      setName("");
      setScene("上班");
      setItems([]);
    }
  };

  return (
    <div className="space-y-4">
      <section className="flex min-h-[62dvh] flex-col overflow-hidden rounded-[28px] border border-[#eadcf4] bg-white/85 shadow-[0_14px_32px_rgba(93,61,130,0.10)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#eadcf4] bg-white/70 p-3">
          <input className="input max-w-xs" value={name} onChange={(event) => setName(event.target.value)} placeholder="搭配名称" />
          <select className="input max-w-40" value={scene} onChange={(event) => setScene(event.target.value as OutfitScene)}>
            {SCENES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <button className="btn-primary" onClick={save} disabled={!name.trim() || !items.length}><Save size={17} />保存搭配</button>
          <button className="btn-secondary" onClick={() => setItems([])}><Trash2 size={17} />清空</button>
          {editingOutfit && <button className="btn-secondary" onClick={onCancelEdit}><X size={17} />退出编辑</button>}
        </div>
        <div
          className="scrapbook-bg relative flex-1 overflow-hidden"
          onDragOver={(event) => event.preventDefault()}
          onDrop={drop}
          onPointerMove={pointerMove}
          onPointerUp={() => setActive(null)}
        >
          {!items.length && <div className="absolute inset-0 flex items-center justify-center text-[#aa93ad]">画布是空的，拖一件衣服进来吧</div>}
          {items.map((canvasItem) => {
            const clothing = byId.get(canvasItem.clothingId);
            if (!clothing) return null;
            return (
              <div
                key={canvasItem.id}
                className="absolute w-36 cursor-grab touch-none select-none"
                style={{ left: canvasItem.x, top: canvasItem.y, zIndex: canvasItem.z, transform: `scale(${canvasItem.scale}) rotate(${canvasItem.rotation}deg)` }}
                onPointerDown={(event) => pointerDown(event, canvasItem)}
              >
                <button
                  className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 text-clay shadow-sm"
                  onClick={(event) => { event.stopPropagation(); setItems((current) => current.filter((item) => item.id !== canvasItem.id)); }}
                >
                  <X size={15} />
                </button>
                <img src={clothing.cutoutImage || clothing.originalImage} alt={clothing.name} className="w-full object-contain drop-shadow-md" draggable={false} />
              </div>
            );
          })}
        </div>
      </section>
      <aside className="drawer-panel">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black">我的衣橱</h1>
            <p className="text-xs text-[#8b719d]">拖到画布里，像贴纸一样摆放。</p>
          </div>
          {editingOutfit && <button className="btn-secondary px-3 py-1.5" onClick={onCancelEdit}>退出</button>}
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {clothes.map((item) => (
            <div className="w-28 shrink-0" key={item.id}>
              <ClothingCard item={item} compact onDragStart={setDraggedClothing} />
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
