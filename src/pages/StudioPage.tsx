import { Minus, Plus, RotateCcw, RotateCw, Save, Trash2, X } from "lucide-react";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const byId = useMemo(() => new Map(clothes.map((item) => [item.id, item])), [clothes]);
  const selectedItem = items.find((item) => item.id === selectedId);

  const addToCanvas = (clothingId: string, x = 120, y = 120) => {
    const id = createId("canvas");
    setItems((current) => [...current, { id, clothingId, x, y, scale: 1, rotation: 0, z: current.length + 1 }]);
    setSelectedId(id);
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
    setSelectedId(item.id);
    setActive({ id: item.id, dx: event.clientX - item.x, dy: event.clientY - item.y });
  };

  const updateSelected = (patch: Partial<Pick<CanvasItem, "scale" | "rotation">>) => {
    if (!selectedId) return;
    setItems((current) => current.map((item) => item.id === selectedId ? { ...item, ...patch } : item));
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setItems((current) => current.filter((item) => item.id !== selectedId));
    setSelectedId(null);
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
          <button className="btn-secondary" onClick={() => { setItems([]); setSelectedId(null); }}><Trash2 size={17} />清空</button>
          {editingOutfit && <button className="btn-secondary" onClick={onCancelEdit}><X size={17} />退出编辑</button>}
        </div>
        <div
          className="scrapbook-bg relative flex-1 overflow-hidden"
          onDragOver={(event) => event.preventDefault()}
          onDrop={drop}
          onPointerMove={pointerMove}
          onPointerUp={() => setActive(null)}
          onPointerDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}
        >
          {!items.length && <div className="absolute inset-0 flex items-center justify-center text-[#aa93ad]">画布是空的，拖一件衣服进来吧</div>}
          {selectedItem && (
            <div className="studio-transform-tools" onPointerDown={(event) => event.stopPropagation()}>
              <button className="studio-tool-icon" type="button" aria-label="缩小" onClick={() => updateSelected({ scale: Math.max(0.45, selectedItem.scale - 0.1) })}><Minus size={16} /></button>
              <label className="studio-scale-control">
                <span>{Math.round(selectedItem.scale * 100)}%</span>
                <input
                  aria-label="调整大小"
                  type="range"
                  min="0.45"
                  max="2.2"
                  step="0.05"
                  value={selectedItem.scale}
                  onChange={(event) => updateSelected({ scale: Number(event.target.value) })}
                />
              </label>
              <button className="studio-tool-icon" type="button" aria-label="放大" onClick={() => updateSelected({ scale: Math.min(2.2, selectedItem.scale + 0.1) })}><Plus size={16} /></button>
              <span className="studio-tools-divider" />
              <button className="studio-tool-icon" type="button" aria-label="向左旋转" onClick={() => updateSelected({ rotation: selectedItem.rotation - 15 })}><RotateCcw size={16} /></button>
              <button className="studio-tool-icon" type="button" aria-label="向右旋转" onClick={() => updateSelected({ rotation: selectedItem.rotation + 15 })}><RotateCw size={16} /></button>
              <button className="studio-tool-icon studio-tool-delete" type="button" aria-label="删除单品" onClick={removeSelected}><Trash2 size={16} /></button>
            </div>
          )}
          {items.map((canvasItem) => {
            const clothing = byId.get(canvasItem.clothingId);
            if (!clothing) return null;
            return (
              <div
                key={canvasItem.id}
                className={`studio-sticker absolute w-36 cursor-grab touch-none select-none ${selectedId === canvasItem.id ? "is-selected" : ""}`}
                style={{ left: canvasItem.x, top: canvasItem.y, zIndex: canvasItem.z, transform: `scale(${canvasItem.scale}) rotate(${canvasItem.rotation}deg)` }}
                onPointerDown={(event) => pointerDown(event, canvasItem)}
              >
                <button
                  className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1 text-clay shadow-sm"
                  onClick={(event) => { event.stopPropagation(); setItems((current) => current.filter((item) => item.id !== canvasItem.id)); setSelectedId((current) => current === canvasItem.id ? null : current); }}
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
