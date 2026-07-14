import { Camera, ImagePlus, Scissors, Clipboard, RefreshCw, RotateCcw, RotateCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { dataUrlHasTransparency, fileToDataUrl, resizeDataUrl } from "../utils/image";

type Props = {
  image?: string;
  cutout?: string;
  status?: string;
  onImage: (dataUrl: string) => void;
  onCutoutImage: (dataUrl: string) => void;
  onRotate: (degrees: 90 | -90) => Promise<void>;
  onReprocess: () => void;
};

export function ImagePicker({ image, cutout, status, onImage, onCutoutImage, onRotate, onReprocess }: Props) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pasteMessage, setPasteMessage] = useState("");
  const [rotating, setRotating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!cameraOpen) return;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } }).then((stream) => {
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(() => setCameraOpen(false));
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraOpen]);

  const pickFile = async (file?: File) => {
    if (!file) return;
    const dataUrl = await resizeDataUrl(await fileToDataUrl(file));
    if (await dataUrlHasTransparency(dataUrl)) {
      onCutoutImage(dataUrl);
      return;
    }
    onImage(dataUrl);
  };

  const pickCutoutFile = async (file?: File) => {
    if (!file) return;
    onCutoutImage(await resizeDataUrl(await fileToDataUrl(file)));
  };

  const pasteCutout = async () => {
    setPasteMessage("");
    try {
      const items = await navigator.clipboard?.read?.();
      const imageItem = items?.find((item) => item.types.some((type) => type.startsWith("image/")));
      const imageType = imageItem?.types.find((type) => type.startsWith("image/"));
      if (!imageItem || !imageType) {
        setPasteMessage("剪贴板里还没有图片。可以先在照片里长按衣服主体，点复制。");
        return;
      }
      const blob = await imageItem.getType(imageType);
      const dataUrl = await resizeDataUrl(await fileToDataUrl(new File([blob], "apple-cutout.png", { type: blob.type || "image/png" })));
      onCutoutImage(dataUrl);
      setPasteMessage("已粘贴苹果抠图。");
    } catch {
      setPasteMessage("当前浏览器不允许直接读取剪贴板，可以用“上传苹果抠图 PNG”。");
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    onImage(await resizeDataUrl(canvas.toDataURL("image/jpeg", 0.9)));
    setCameraOpen(false);
  };

  const rotate = async (degrees: 90 | -90) => {
    if (!image || rotating) return;
    setRotating(true);
    try {
      await onRotate(degrees);
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="cute-panel p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="aspect-[4/5] overflow-hidden rounded-[22px] bg-gradient-to-br from-paper via-white to-skywash/45">
          {image ? <img src={image} alt="原图" className="h-full w-full object-contain p-3" /> : <div className="flex h-full items-center justify-center text-[#aa93ad]">原图</div>}
        </div>
        <div className="aspect-[4/5] overflow-hidden rounded-[22px] bg-[linear-gradient(45deg,#f5edf7_25%,transparent_25%),linear-gradient(-45deg,#f5edf7_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f5edf7_75%),linear-gradient(-45deg,transparent_75%,#f5edf7_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0]">
          {cutout ? <img src={cutout} alt="抠图" className="h-full w-full object-contain p-3" /> : <div className="flex h-full items-center justify-center bg-white/35 text-[#aa93ad]">{status === "processing" ? "正在自动抠图" : "透明 PNG"}</div>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <label className="btn-primary cursor-pointer">
          <ImagePlus size={17} />
          上传图片
          <input className="hidden" type="file" accept="image/*" onChange={(event) => pickFile(event.target.files?.[0])} />
        </label>
        <label className="btn-secondary cursor-pointer">
          <Scissors size={17} />
          上传苹果抠图 PNG
          <input className="hidden" type="file" accept="image/png,image/*" onChange={(event) => pickCutoutFile(event.target.files?.[0])} />
        </label>
        <button className="btn-secondary" onClick={pasteCutout} type="button"><Clipboard size={17} />粘贴抠图</button>
        <button className="btn-secondary" onClick={() => setCameraOpen(true)} type="button"><Camera size={17} />拍照</button>
        <button className="btn-secondary" onClick={() => void rotate(-90)} type="button" disabled={!image || status === "processing" || rotating}><RotateCcw size={17} />向左转</button>
        <button className="btn-secondary" onClick={() => void rotate(90)} type="button" disabled={!image || status === "processing" || rotating}><RotateCw size={17} />向右转</button>
        <button className="btn-secondary" onClick={onReprocess} type="button" disabled={!image || status === "processing"}><RefreshCw size={17} />重新抠图</button>
      </div>
      {image && <p className="mt-3 text-xs leading-5 text-[#927d74]">方向不对时可以旋转，原图和透明抠图会一起调整。</p>}
      {pasteMessage && <p className="mt-3 rounded-2xl bg-white/70 px-3 py-2 text-sm text-[#8a7488]">{pasteMessage}</p>}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div className="w-full max-w-2xl rounded-[28px] bg-milk p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">拍摄衣服</h3>
              <button className="icon-btn" onClick={() => setCameraOpen(false)}><X size={18} /></button>
            </div>
            <video ref={videoRef} autoPlay playsInline className="max-h-[70vh] w-full rounded-[22px] bg-black object-contain" />
            <button className="btn-primary mt-3 w-full justify-center" onClick={capture}>保存照片</button>
          </div>
        </div>
      )}
    </div>
  );
}
