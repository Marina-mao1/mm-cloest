import { Edit3, Heart, RotateCcw, Trash2 } from "lucide-react";
import type { ClothingItem } from "../types";

type Props = {
  item: ClothingItem;
  compact?: boolean;
  onEdit?: (item: ClothingItem) => void;
  onDelete?: (item: ClothingItem) => void;
  onToggleFavorite?: (item: ClothingItem) => void;
  onReprocess?: (item: ClothingItem) => void;
  onDragStart?: (item: ClothingItem) => void;
};

export function ClothingCard({ item, compact, onEdit, onDelete, onToggleFavorite, onReprocess, onDragStart }: Props) {
  const image = item.cutoutImage || item.originalImage;
  return (
    <article
      className="group rounded-[20px] border border-[#eadcf4] bg-white/85 p-2 shadow-[0_10px_24px_rgba(93,61,130,0.08)] backdrop-blur transition hover:-translate-y-1 hover:shadow-soft"
      draggable={Boolean(onDragStart)}
      onDragStart={() => onDragStart?.(item)}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#faf6fb]">
        <img src={image} alt={item.name} className="h-full w-full object-contain p-2" />
        <button
          title="收藏"
          onClick={() => onToggleFavorite?.(item)}
          className={`absolute right-1.5 top-1.5 rounded-full p-1.5 shadow-sm ${item.favorite ? "bg-clay text-white" : "bg-white/90 text-[#8b7289]"}`}
        >
          <Heart size={13} fill={item.favorite ? "currentColor" : "none"} />
        </button>
        {item.imageStatus === "processing" && (
          <div className="absolute inset-x-3 bottom-3 rounded-full bg-white/90 px-3 py-1 text-center text-xs text-[#7b6380]">抠图中</div>
        )}
        {item.imageStatus === "failed" && (
          <div className="absolute inset-x-3 bottom-3 rounded-full bg-clay/90 px-3 py-1 text-center text-xs text-white">抠图失败</div>
        )}
      </div>
      <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="line-clamp-1 text-xs font-semibold">{item.name}</h3>
            {!compact && <p className="mt-0.5 text-[10px] text-[#8a7488]">{item.color || item.mainCategory}</p>}
          </div>
        </div>
        {(onEdit || onDelete || onReprocess) && (
          <div className="mt-3 flex gap-2">
            {onEdit && <button title="编辑" className="icon-btn" onClick={() => onEdit(item)}><Edit3 size={16} /></button>}
            {onReprocess && <button title="重新抠图" className="icon-btn" onClick={() => onReprocess(item)}><RotateCcw size={16} /></button>}
            {onDelete && <button title="删除" className="icon-btn text-clay" onClick={() => onDelete(item)}><Trash2 size={16} /></button>}
          </div>
        )}
      </div>
    </article>
  );
}
