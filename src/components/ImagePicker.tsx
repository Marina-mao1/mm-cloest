import { Camera, ImagePlus, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fileToDataUrl, resizeDataUrl } from "../utils/image";

type Props = {
  image?: string;
  cutout?: string;
  status?: string;
  onImage: (dataUrl: string) => void;
  onReprocess: () => void;
};

export function ImagePicker({ image, cutout, status, onImage, onReprocess }: Props) {
  const [cameraOpen, setCameraOpen] = useState(false);
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
    onImage(await resizeDataUrl(await fileToDataUrl(file)));
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
        <button className="btn-secondary" onClick={() => setCameraOpen(true)} type="button"><Camera size={17} />拍照</button>
        <button className="btn-secondary" onClick={onReprocess} type="button" disabled={!image || status === "processing"}><RefreshCw size={17} />重新抠图</button>
      </div>
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
