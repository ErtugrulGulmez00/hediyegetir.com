"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useRef, useState } from "react";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGES_PER_PRODUCT } from "@/lib/admin/images";
import { slugify } from "@/lib/slug";

export type ImgItem = {
  key: string;
  id?: string;
  url: string;
  alt: string;
  isBlob: boolean;
  uploading?: boolean;
  /** Yükleme bitene kadar gösterilen yerel önizleme */
  preview?: string;
  progress?: number;
};

let keySeq = 0;
export const nextImgKey = () => `img-${++keySeq}`;

const UPLOAD_CONCURRENCY = 3;
const INTERNAL_DRAG = "application/x-hg-foto";

/**
 * Ürün fotoğrafları: sürükle-bırak ya da çoklu seçim, anında önizleme, paralel yükleme,
 * sürükleyerek / oklarla sıralama, silme. İlk fotoğraf kapak olur ve büyük gösterilir.
 */
export function PhotoUploader({
  images,
  setImages,
  blobEnabled,
  productName,
  onBatchUploaded,
  error,
}: {
  images: ImgItem[];
  setImages: React.Dispatch<React.SetStateAction<ImgItem[]>>;
  blobEnabled: boolean;
  productName: string;
  /** Seçilen dosyaların hepsi yüklenince (en az biri başarılıysa) çağrılır */
  onBatchUploaded: () => void;
  error?: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [dropActive, setDropActive] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFiles(files: FileList | File[] | null) {
    if (!files) return;
    setUploadError(null);
    const all = Array.from(files);
    const room = MAX_IMAGES_PER_PRODUCT - images.length;
    const problems: string[] = [];
    const valid = all.filter((file) => {
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        problems.push(`${file.name}: yalnızca JPEG, PNG ya da WebP`);
        return false;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        problems.push(`${file.name}: 5 MB'tan büyük`);
        return false;
      }
      return true;
    });
    const list = valid.slice(0, Math.max(0, room));
    if (valid.length > list.length) problems.push(`En fazla ${MAX_IMAGES_PER_PRODUCT} fotoğraf eklenebilir`);
    if (problems.length) setUploadError(problems.join(" · "));
    if (fileInput.current) fileInput.current.value = "";
    if (list.length === 0) return;

    // Önizlemeler hemen görünsün, yükleme arkada sürsün
    const items = list.map((file) => ({ file, key: nextImgKey(), preview: URL.createObjectURL(file) }));
    setImages((s) => [...s, ...items.map(({ key, preview }) => ({ key, url: "", alt: "", isBlob: blobEnabled, uploading: true, preview, progress: 0 }))]);

    let ok = 0;
    const queue = [...items];
    const worker = async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const { file, key, preview } = item;
        try {
          const url = await uploadOne(file, productName || "urun", blobEnabled, (p) =>
            setImages((s) => s.map((i) => (i.key === key ? { ...i, progress: p } : i))),
          );
          setImages((s) => s.map((i) => (i.key === key ? { ...i, url, uploading: false, progress: 100 } : i)));
          ok++;
        } catch (e) {
          setImages((s) => s.filter((i) => i.key !== key));
          setUploadError((prev) => [prev, `${file.name}: yüklenemedi (${e instanceof Error ? e.message : "hata"})`].filter(Boolean).join(" · "));
        } finally {
          URL.revokeObjectURL(preview);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, items.length) }, worker));
    if (ok > 0) onBatchUploaded();
  }

  const move = (key: string, dir: -1 | 1) =>
    setImages((s) => {
      const i = s.findIndex((x) => x.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const dropOn = (targetKey: string) =>
    setImages((s) => {
      if (!dragKey || dragKey === targetKey) return s;
      const from = s.findIndex((x) => x.key === dragKey);
      const to = s.findIndex((x) => x.key === targetKey);
      const copy = [...s];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });

  const isFileDrag = (e: React.DragEvent) => e.dataTransfer.types.includes("Files");
  const empty = images.length === 0;

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (!isFileDrag(e)) return;
          e.preventDefault();
          setDropActive(true);
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={(e) => {
          if (!isFileDrag(e)) return;
          e.preventDefault();
          setDropActive(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed transition-colors ${
          dropActive ? "border-kiremit bg-hardal/15" : "border-kraft-koyu bg-kagit/60"
        } ${empty ? "p-8 sm:p-12" : "p-3 sm:p-4"}`}
      >
        {empty ? (
          <div className="flex flex-col items-center text-center">
            <CameraIcon className="size-12 text-kraft-koyu" />
            <p className="mt-3 font-baslik text-xl">Ürün fotoğraflarını buraya bırak</p>
            <p className="mt-1 text-sm text-murekkep-soluk">
              Birden fazla fotoğraf seçebilirsin · JPEG, PNG, WebP · en fazla 5 MB · ilk fotoğraf kapak olur
            </p>
            <button type="button" className="btn btn-ana mt-5" onClick={() => fileInput.current?.click()}>
              Fotoğraf seç
            </button>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5" aria-label="Ürün fotoğrafları">
              {images.map((img, i) => (
                <li
                  key={img.key}
                  draggable={!img.uploading}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(INTERNAL_DRAG, img.key);
                    setDragKey(img.key);
                  }}
                  onDragOver={(e) => {
                    if (!isFileDrag(e)) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    if (isFileDrag(e)) return;
                    e.preventDefault();
                    dropOn(img.key);
                  }}
                  onDragEnd={() => setDragKey(null)}
                  className={`group relative ${i === 0 ? "col-span-2 row-span-2" : ""} ${dragKey === img.key ? "opacity-50" : ""}`}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-kraft bg-krem-koyu">
                    {img.uploading ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.preview} alt="" className="size-full object-cover opacity-60" />
                    ) : (
                      <Image src={img.url} alt={img.alt} fill sizes={i === 0 ? "400px" : "200px"} className="object-cover" loading={i === 0 ? "eager" : "lazy"} />
                    )}
                    {i === 0 && (
                      <span className="absolute top-2 left-2 rounded-full bg-murekkep px-2 py-0.5 text-xs font-bold text-kagit">kapak</span>
                    )}
                    {img.uploading && (
                      <span className="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-kagit/80">
                        <span className="block h-full bg-kiremit transition-[width]" style={{ width: `${Math.max(8, img.progress ?? 0)}%` }} />
                      </span>
                    )}
                    {!img.uploading && (
                      <div className="absolute inset-x-1.5 top-1.5 flex justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                        <IconButton label="Sola taşı" onClick={() => move(img.key, -1)} disabled={i === 0}>
                          ←
                        </IconButton>
                        <IconButton label="Sağa taşı" onClick={() => move(img.key, 1)} disabled={i === images.length - 1}>
                          →
                        </IconButton>
                        <IconButton label="Fotoğrafı kaldır" onClick={() => setImages((s) => s.filter((x) => x.key !== img.key))} danger>
                          ✕
                        </IconButton>
                      </div>
                    )}
                  </div>
                  <input
                    aria-label="Fotoğraf açıklaması"
                    className="mt-1 w-full truncate border-b border-transparent bg-transparent px-0.5 py-0.5 text-xs text-murekkep-soluk outline-none hover:border-kraft focus:border-murekkep focus:text-murekkep"
                    placeholder="Açıklama (alt metin)"
                    value={img.alt}
                    onChange={(e) => setImages((s) => s.map((x) => (x.key === img.key ? { ...x, alt: e.target.value } : x)))}
                  />
                </li>
              ))}
              {images.length < MAX_IMAGES_PER_PRODUCT && (
                <li>
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-kraft-koyu text-murekkep-soluk hover:border-murekkep hover:text-murekkep"
                  >
                    <span className="text-3xl leading-none">+</span>
                    <span className="text-sm font-semibold">Ekle</span>
                  </button>
                </li>
              )}
            </ul>
            <p className="mt-3 text-xs text-murekkep-soluk">
              Sürükleyerek sırala · yeni fotoğrafları bu alana bırakabilirsin
              {!blobEnabled && " · yerel mod: dosyalar public/uploads klasörüne kaydedilir"}
            </p>
          </>
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        multiple
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {(uploadError || error) && (
        <p role="alert" className="mt-2 text-sm font-semibold text-kiremit-koyu">
          {uploadError || error}
        </p>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex size-7 items-center justify-center rounded-full border border-murekkep/40 bg-kagit/95 text-sm font-bold shadow-sm disabled:hidden ${
        danger ? "text-kiremit-koyu hover:bg-kiremit hover:text-kagit" : "hover:bg-krem-koyu"
      }`}
    >
      {children}
    </button>
  );
}

function CameraIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" aria-hidden>
      <path d="M6 15a3 3 0 0 1 3-3h6l3-5h12l3 5h6a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" />
      <circle cx="24" cy="25" r="8" />
      <path d="M36 18h2" strokeLinecap="round" />
    </svg>
  );
}

async function uploadOne(file: File, productName: string, blobEnabled: boolean, onProgress: (p: number) => void): Promise<string> {
  const dot = file.name.lastIndexOf(".");
  const base = slugify(dot > 0 ? file.name.slice(0, dot) : file.name) || "foto";
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  if (blobEnabled) {
    const blob = await upload(`urunler/${slugify(productName) || "urun"}/${base}.${ext}`, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload",
      contentType: file.type,
      onUploadProgress: ({ percentage }) => onProgress(percentage),
    });
    return blob.url;
  }
  const body = new FormData();
  body.set("file", file);
  const res = await fetch("/api/admin/upload-local", { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json.url;
}
