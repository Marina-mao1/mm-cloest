import { Save, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, DEFAULT_TAGS, MAIN_CATEGORIES } from "../constants/wardrobe";
import { ImagePicker } from "../components/ImagePicker";
import { backgroundRemovalService } from "../services/backgroundRemoval";
import { recognizeClothingCategory, type ClothingRecognition } from "../services/clothingRecognition";
import type { ClothingItem, ImageStatus, MainCategory } from "../types";
import { createId } from "../utils/id";
import { rotateDataUrl } from "../utils/image";

type Props = {
  clothesCount: number;
  editing?: ClothingItem | null;
  allTags: string[];
  homeLocations: string[];
  onSave: (item: ClothingItem) => void;
  onCancelEdit: () => void;
  onAfterCreate: () => void;
};

const empty = {
  name: "",
  mainCategory: "上衣" as MainCategory,
  subCategory: "短袖",
  color: "",
  homeLocation: "",
  tags: [] as string[],
  favorite: false,
  note: ""
};

export function AddClothingPage({ clothesCount, editing, allTags, homeLocations, onSave, onCancelEdit, onAfterCreate }: Props) {
  const [form, setForm] = useState(empty);
  const [originalImage, setOriginalImage] = useState("");
  const [cutoutImage, setCutoutImage] = useState<string | undefined>();
  const [imageStatus, setImageStatus] = useState<ImageStatus>("original");
  const [customTag, setCustomTag] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recognition, setRecognition] = useState<ClothingRecognition | null>(null);
  const tagOptions = useMemo(() => Array.from(new Set([...DEFAULT_TAGS, ...allTags])), [allTags]);

  useEffect(() => {
    if (!editing) return;
    setForm({
      name: editing.name,
      mainCategory: editing.mainCategory,
      subCategory: editing.subCategory,
      color: editing.color,
      homeLocation: editing.homeLocation || "",
      tags: editing.tags,
      favorite: editing.favorite,
      note: editing.note
    });
    setOriginalImage(editing.originalImage);
    setCutoutImage(editing.cutoutImage);
    setImageStatus(editing.imageStatus);
    setRecognition(null);
  }, [editing]);

  const processImage = async (image: string) => {
    setImageStatus("processing");
    setCutoutImage(undefined);
    setRecognition(null);
    try {
      const cutout = await backgroundRemovalService.removeBackground(image);
      setCutoutImage(cutout);
      setImageStatus("cutout");
      const result = await recognizeClothingCategory(image, cutout);
      setRecognition(result);
      setForm((current) => ({
        ...current,
        mainCategory: result.mainCategory,
        subCategory: result.subCategory
      }));
    } catch {
      setImageStatus("failed");
      try {
        const result = await recognizeClothingCategory(image);
        setRecognition(result);
        setForm((current) => ({
          ...current,
          mainCategory: result.mainCategory,
          subCategory: result.subCategory
        }));
      } catch {
        setRecognition(null);
      }
    }
  };

  const setImage = (image: string) => {
    setOriginalImage(image);
    void processImage(image);
  };

  const setPreparedCutout = async (image: string) => {
    setOriginalImage(image);
    setCutoutImage(image);
    setImageStatus("cutout");
    try {
      const result = await recognizeClothingCategory(image, image);
      setRecognition(result);
      setForm((current) => ({
        ...current,
        mainCategory: result.mainCategory,
        subCategory: result.subCategory
      }));
    } catch {
      setRecognition(null);
    }
  };

  const rotateImage = async (degrees: 90 | -90) => {
    if (!originalImage) return;
    const rotatedOriginal = await rotateDataUrl(originalImage, degrees);

    if (!cutoutImage) {
      setImage(rotatedOriginal);
      return;
    }

    const rotatedCutout = await rotateDataUrl(cutoutImage, degrees);
    setOriginalImage(rotatedOriginal);
    setCutoutImage(rotatedCutout);
    setImageStatus("cutout");
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
    setRecognition(null);
  };

  const save = async () => {
    if (!originalImage || saving) return;
    setSaving(true);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    const now = new Date().toISOString();
    onSave({
      id: editing?.id || createId("cloth"),
      ...form,
      name: form.name.trim() || form.subCategory || form.mainCategory,
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
    setSaving(false);
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
          onCutoutImage={setPreparedCutout}
          onRotate={rotateImage}
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
          <div>
            <span className="field-label">放在哪个家</span>
            {homeLocations.length ? <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setForm((current) => ({ ...current, homeLocation: "" }))} className={`tag ${!form.homeLocation ? "tag-active" : ""}`}>暂不标注</button>
              {homeLocations.map((location) => (
                <button key={location} type="button" onClick={() => setForm((current) => ({ ...current, homeLocation: location }))} className={`tag ${form.homeLocation === location ? "tag-active" : ""}`}>{location}</button>
              ))}
            </div> : <p className="mt-2 text-xs leading-5 text-[#927d74]">还没有添加房子。可以先保存，再到衣橱的“所有房子”里添加。</p>}
          </div>
          {recognition && (
            <div className="rounded-[22px] bg-[#f7efff]/80 px-4 py-3 text-sm text-[#765a86]">
              <div className="font-semibold text-[#8b63bd]">已自动识别：{recognition.mainCategory} · {recognition.subCategory}</div>
              <div className="mt-1 text-xs leading-relaxed text-[#9a8199]">
                {recognition.reason}，置信度 {Math.round(recognition.confidence * 100)}%。不准的话可以手动改。
              </div>
            </div>
          )}
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
            <button className="btn-primary flex-1 justify-center" onClick={() => void save()} disabled={!originalImage || saving}><Save size={17} />{saving ? "正在保存..." : "保存"}</button>
            {editing && <button className="btn-secondary" onClick={onCancelEdit}>取消</button>}
          </div>
        </div>
      </aside>
    </div>
  );
}
