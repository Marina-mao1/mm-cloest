import { Save, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, DEFAULT_TAGS, MAIN_CATEGORIES } from "../constants/wardrobe";
import { ImagePicker } from "../components/ImagePicker";
import { backgroundRemovalService } from "../services/backgroundRemoval";
import type { ClothingItem, ImageStatus, MainCategory } from "../types";
import { createId } from "../utils/id";

type Props = {
  clothesCount: number;
  editing?: ClothingItem | null;
  allTags: string[];
  onSave: (item: ClothingItem) => void;
  onCancelEdit: () => void;
  onAfterCreate: () => void;
};

const empty = {
  name: "",
  mainCategory: "上衣" as MainCategory,
  subCategory: "短袖",
  color: "",
  tags: [] as string[],
  favorite: false,
  note: ""
};

export function AddClothingPage({ clothesCount, editing, allTags, onSave, onCancelEdit, onAfterCreate }: Props) {
  const [form, setForm] = useState(empty);
  const [originalImage, setOriginalImage] = useState("");
  const [cutoutImage, setCutoutImage] = useState<string | undefined>();
  const [imageStatus, setImageStatus] = useState<ImageStatus>("original");
  const [customTag, setCustomTag] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const tagOptions = useMemo(() => Array.from(new Set([...DEFAULT_TAGS, ...allTags])), [allTags]);

  useEffect(() => {
    if (!editing) return;
    setForm({
      name: editing.name,
      mainCategory: editing.mainCategory,
      subCategory: editing.subCategory,
      color: editing.color,
      tags: editing.tags,
      favorite: editing.favorite,
      note: editing.note
    });
    setOriginalImage(editing.originalImage);
    setCutoutImage(editing.cutoutImage);
    setImageStatus(editing.imageStatus);
  }, [editing]);

  const processImage = async (image: string) => {
    setImageStatus("processing");
    setCutoutImage(undefined);
    try {
      const cutout = await backgroundRemovalService.removeBackground(image);
      setCutoutImage(cutout);
      setImageStatus("cutout");
    } catch {
      setImageStatus("failed");
    }
  };

  const setImage = (image: string) => {
    setOriginalImage(image);
    void processImage(image);
  };

  const setMainCategory = (mainCategory: MainCategory) => {
    setForm((current) => ({ ...current, mainCategory, subCategory: CATEGORIES[mainCategory][0] }));
  };

  const toggleTag = (tag: string) => {
    setForm((current) => ({
      ...current,
      tags: current.tags.includes(tag) ? current.tags.filter((item) => item !== tag) : [...current.tags, tag]
    }));
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (!tag) return;
    setForm((current) => ({ ...current, tags: Array.from(new Set([...current.tags, tag])) }));
    setCustomTag("");
  };

  const reset = () => {
    setForm(empty);
    setOriginalImage("");
    setCutoutImage(undefined);
    setImageStatus("original");
  };

  const save = () => {
    if (!originalImage || !form.name.trim()) return;
    const now = new Date().toISOString();
    onSave({
      id: editing?.id || createId("cloth"),
      ...form,
      name: form.name.trim(),
      originalImage,
      cutoutImage,
      imageStatus,
      usageCount: editing?.usageCount || 0,
      lastUsedAt: editing?.lastUsedAt,
      createdAt: editing?.createdAt || now,
      updatedAt: now
    });
    if (editing) onCancelEdit();
    if (!editing && batchMode) reset();
    if (!editing && !batchMode) onAfterCreate();
  };

  return (
    <div className="space-y-4">
      <section>
        <div className="page-head mb-4">
          <div>
            <h1 className="page-title">{editing ? "编辑衣服" : "添加衣服"}</h1>
            <p className="page-kicker">拍一张你的新衣服吧。</p>
          </div>
          {!editing && (
            <label className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-[#725d72] shadow-sticker">
              <input type="checkbox" checked={batchMode} onChange={(event) => setBatchMode(event.target.checked)} />
              连续录入模式
            </label>
          )}
        </div>
        <ImagePicker
          image={originalImage}
          cutout={cutoutImage}
          status={imageStatus}
          onImage={setImage}
          onReprocess={() => originalImage && processImage(originalImage)}
        />
      </section>
      <aside className="cute-panel p-5">
        <div className="space-y-4">
          <label className="field-label">名称<input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="白色短袖、灰色运动裤" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="field-label">大类<select className="input" value={form.mainCategory} onChange={(event) => setMainCategory(event.target.value as MainCategory)}>{MAIN_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field-label">子分类<select className="input" value={form.subCategory} onChange={(event) => setForm({ ...form, subCategory: event.target.value })}>{CATEGORIES[form.mainCategory].map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <label className="field-label">颜色<input className="input" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} placeholder="奶白、深蓝、卡其" /></label>
          <div>
            <span className="field-label">标签</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {tagOptions.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`tag ${form.tags.includes(tag) ? "tag-active" : ""}`}>{tag}</button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input className="input" value={customTag} onChange={(event) => setCustomTag(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addCustomTag())} placeholder="自定义标签" />
              <button className="btn-secondary" type="button" onClick={addCustomTag}>添加</button>
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-2xl bg-paper px-3 py-2 text-sm text-[#725d72]"><input type="checkbox" checked={form.favorite} onChange={(event) => setForm({ ...form, favorite: event.target.checked })} /><Star size={16} />收藏</label>
          <label className="field-label">备注<textarea className="input min-h-24 resize-none" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="版型、搭配灵感、洗护提醒" /></label>
          <div className="flex gap-2">
            <button className="btn-primary flex-1 justify-center" onClick={save} disabled={!originalImage || !form.name.trim()}><Save size={17} />保存</button>
            {editing && <button className="btn-secondary" onClick={onCancelEdit}>取消</button>}
          </div>
        </div>
      </aside>
    </div>
  );
}
