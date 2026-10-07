"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import type { AiOneriResponse } from "@/app/api/admin/ai-oneri/route";
import { TagChip } from "@/components/ui/TagChip";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGES_PER_PRODUCT } from "@/lib/admin/images";
import type { ProductFormInput } from "@/lib/admin/product-input";
import { mergeSuggestion } from "@/lib/ai/merge";
import { HOBBIES, RECIPIENTS, type GenderKey } from "@/lib/hedis/config";
import { slugify } from "@/lib/slug";
import { deleteProductAction, saveProductAction, type ProductFormState } from "../../actions";
import { Field, inputClass, Panel } from "../ui";

export type ProductFormInitial = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  recipients: string[];
  gender: GenderKey;
  hobbies: string[];
  hedisReviewed: boolean;
  images: { id: string; url: string; alt: string; isBlob: boolean }[];
};

type ImgItem = { key: string; id?: string; url: string; alt: string; isBlob: boolean; uploading?: boolean; preview?: string };

let keySeq = 0;
const nextKey = () => `img-${++keySeq}`;

export function ProductForm({
  initial,
  categories,
  blobEnabled,
  aiEnabled,
}: {
  initial: ProductFormInitial;
  categories: { id: string; name: string }[];
  blobEnabled: boolean;
  /** OpenRouter anahtarı tanımlıysa fotoğraftan öneri özelliği açılır */
  aiEnabled: boolean;
}) {
  const [v, setV] = useState(initial);
  const [images, setImages] = useState<ImgItem[]>(() => initial.images.map((i) => ({ ...i, key: nextKey() })));
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [ai, setAi] = useState<{ status: "idle" | "running" | "done" | "error"; message?: string }>({ status: "idle" });
  const aiAutoRan = useRef(false);
  // Öneri gelene kadar admin yazmaya devam edebilir; birleştirmede en güncel form kullanılır
  const latest = useRef(v);
  const latestImages = useRef(images);
  useEffect(() => {
    latest.current = v;
    latestImages.current = images;
  }, [v, images]);

  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    saveProductAction.bind(null, initial.id),
    {},
  );
  const err = state.errors ?? {};
  const set = <K extends keyof ProductFormInitial>(k: K, val: ProductFormInitial[K]) => setV((s) => ({ ...s, [k]: val }));
  const uploading = images.some((i) => i.uploading);

  const payload: ProductFormInput = {
    name: v.name,
    slug: v.slug,
    description: v.description,
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    stock: v.stock,
    categoryId: v.categoryId,
    isActive: v.isActive,
    isFeatured: v.isFeatured,
    recipients: v.recipients,
    gender: v.gender,
    hobbies: v.hobbies,
    hedisReviewed: v.hedisReviewed,
    images: images.filter((i) => !i.uploading).map(({ id, url, alt, isBlob }) => ({ id, url, alt, isBlob })),
  };

  async function runAi(imageUrl: string) {
    setAi({ status: "running" });
    try {
      const res = await fetch("/api/admin/ai-oneri", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = (await res.json().catch(() => ({ error: `HTTP ${res.status}` }))) as AiOneriResponse;
      if ("error" in data) return setAi({ status: "error", message: data.error });

      const s = data.suggestion;
      const nameBefore = latest.current.name;
      const { next, filled } = mergeSuggestion(latest.current, s);
      setV(next);
      // Fotoğraf açıklaması boşsa ya da yalnızca ürün adıysa öneriyle değiştir
      const target = latestImages.current.find((img) => img.url === imageUrl);
      if (s.alt && target && (!target.alt.trim() || target.alt === nameBefore)) {
        setImages((list) => list.map((img) => (img.url === imageUrl ? { ...img, alt: s.alt! } : img)));
        filled.push("fotoğraf açıklaması");
      }
      const parts = [filled.length ? `Doldurdum: ${filled.join(", ")}.` : "Boş alan yoktu, hiçbir şeyi değiştirmedim."];
      if (s.newCategoryName && !next.categoryId) parts.push(`Önerilen kategori "${s.newCategoryName}" henüz yok; istersen Kategoriler'den ekleyebilirsin.`);
      if (filled.includes("Hediş etiketleri")) parts.push("Etiketleri kontrol edip kutuyu işaretlemeyi unutma.");
      setAi({ status: "done", message: parts.join(" ") });
    } catch {
      setAi({ status: "error", message: "Öneri alınamadı, bağlantını kontrol et." });
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setUploadError(null);
    // Ürünün ilk fotoğrafı yüklenince bir kez otomatik öneri al
    const autoAi = aiEnabled && !aiAutoRan.current && images.length === 0;
    const room = MAX_IMAGES_PER_PRODUCT - images.length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > list.length) setUploadError(`En fazla ${MAX_IMAGES_PER_PRODUCT} fotoğraf eklenebilir.`);

    for (const file of list) {
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        setUploadError(`${file.name}: yalnızca JPEG, PNG ya da WebP yükleyebilirsin.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setUploadError(`${file.name}: dosya 5 MB'tan büyük.`);
        continue;
      }
      const key = nextKey();
      const preview = URL.createObjectURL(file);
      setImages((s) => [...s, { key, url: "", alt: v.name, isBlob: blobEnabled, uploading: true, preview }]);
      try {
        const url = await uploadOne(file, v.name || "urun", blobEnabled);
        setImages((s) => s.map((i) => (i.key === key ? { ...i, url, uploading: false } : i)));
        if (autoAi && !aiAutoRan.current) {
          aiAutoRan.current = true;
          void runAi(url);
        }
      } catch (e) {
        setImages((s) => s.filter((i) => i.key !== key));
        setUploadError(`${file.name}: yüklenemedi (${e instanceof Error ? e.message : "bilinmeyen hata"}).`);
      } finally {
        URL.revokeObjectURL(preview);
      }
    }
    if (fileInput.current) fileInput.current.value = "";
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

  const toggleIn = (list: string[], key: string) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  const quickRecipients = (mode: "KADIN" | "ERKEK" | "HEPSI" | "TEMIZLE") => {
    if (mode === "TEMIZLE") return set("recipients", []);
    const keys = RECIPIENTS.filter((r) => r.key !== "cocuk" && (mode === "HEPSI" || r.gender === null || r.gender === mode)).map(
      (r) => r.key,
    );
    set("recipients", keys);
    if (mode !== "HEPSI") set("gender", mode);
    else set("gender", "UNISEX");
  };

  return (
    <form action={formAction} className="flex flex-col gap-6 pb-24">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      {state.message && (
        <p role="alert" className="border-l-4 border-kiremit bg-kagit px-4 py-3 font-semibold">
          {state.message}
        </p>
      )}

      <Panel title="Temel bilgiler">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ürün adı" error={err.name} className="sm:col-span-2">
            <input className={inputClass} value={v.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field
            label="Adres (slug)"
            error={err.slug}
            hint={`hediyegetir.com/urun/${slugify(v.slug || v.name) || "…"}`}
            className="sm:col-span-2"
          >
            <input className={inputClass} value={v.slug} placeholder="Boş bırakırsan addan üretilir" onChange={(e) => set("slug", e.target.value)} />
          </Field>
          <Field label="Açıklama" error={err.description} className="sm:col-span-2">
            <textarea className={`${inputClass} min-h-40`} value={v.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Kategori">
            <select className={inputClass} value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Kategorisiz</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" className="size-4 accent-kiremit" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} />
              Sitede yayında
            </label>
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" className="size-4 accent-kiremit" checked={v.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
              Öne çıkan (listelerde başta, Hediş&apos;te küçük öncelik)
            </label>
          </div>
        </div>
      </Panel>

      <Panel title="Fiyat ve stok">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Satış fiyatı (₺)" error={err.price} hint="Ör. 1.250 ya da 1250,50">
            <input className={inputClass} inputMode="decimal" value={v.price} onChange={(e) => set("price", e.target.value)} required />
          </Field>
          <Field label="Eski fiyat (₺)" error={err.compareAtPrice} hint="İndirim varsa; üstü çizili görünür">
            <input className={inputClass} inputMode="decimal" value={v.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} />
          </Field>
          <Field label="Stok" error={err.stock} hint="Boş = sipariş üzerine yapılır, 0 = tükendi">
            <input className={inputClass} inputMode="numeric" value={v.stock} onChange={(e) => set("stock", e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel title="Fotoğraflar">
        <p className="mb-3 text-sm text-murekkep-soluk">
          İlk fotoğraf kapak olur. Sürükleyerek ya da oklarla sırala. JPEG/PNG/WebP, en fazla 5 MB.
          {!blobEnabled && " (Yerel mod: dosyalar public/uploads klasörüne kaydedilir.)"}
        </p>
        {err.images && <p className="mb-3 text-sm font-semibold text-kiremit-koyu">{err.images}</p>}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <li
              key={img.key}
              draggable={!img.uploading}
              onDragStart={() => setDragKey(img.key)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(img.key)}
              onDragEnd={() => setDragKey(null)}
              className={`relative border-2 bg-kagit p-1.5 ${dragKey === img.key ? "border-dashed border-kiremit opacity-60" : "border-kraft"}`}
            >
              <div className="relative aspect-square overflow-hidden bg-krem-koyu">
                {img.uploading ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.preview} alt="" className="size-full object-cover opacity-50" />
                ) : (
                  <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-cover" />
                )}
                {i === 0 && <span className="absolute top-1 left-1 bg-murekkep px-1.5 text-xs font-bold text-kagit">kapak</span>}
                {img.uploading && <span className="absolute inset-0 flex items-center justify-center font-el text-xl">yükleniyor…</span>}
              </div>
              <input
                aria-label="Fotoğraf açıklaması"
                className="mt-1.5 w-full border-b border-kraft bg-transparent px-1 py-0.5 text-xs outline-none focus:border-murekkep"
                placeholder="Açıklama (alt metin)"
                value={img.alt}
                onChange={(e) => setImages((s) => s.map((x) => (x.key === img.key ? { ...x, alt: e.target.value } : x)))}
              />
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="flex gap-1">
                  <button type="button" className="px-1.5 hover:bg-krem-koyu disabled:opacity-30" onClick={() => move(img.key, -1)} disabled={i === 0} aria-label="Sola taşı">
                    ←
                  </button>
                  <button type="button" className="px-1.5 hover:bg-krem-koyu disabled:opacity-30" onClick={() => move(img.key, 1)} disabled={i === images.length - 1} aria-label="Sağa taşı">
                    →
                  </button>
                </span>
                <button
                  type="button"
                  className="px-1.5 text-kiremit-koyu hover:underline"
                  onClick={() => setImages((s) => s.filter((x) => x.key !== img.key))}
                  disabled={img.uploading}
                >
                  Kaldır
                </button>
              </div>
            </li>
          ))}
          {images.length < MAX_IMAGES_PER_PRODUCT && (
            <li>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex aspect-square w-full flex-col items-center justify-center gap-1 border-2 border-dashed border-kraft-koyu text-murekkep-soluk hover:border-murekkep hover:text-murekkep"
              >
                <span className="text-3xl leading-none">+</span>
                <span className="text-sm font-semibold">Fotoğraf ekle</span>
              </button>
            </li>
          )}
        </ul>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        {uploadError && (
          <p role="alert" className="mt-3 text-sm font-semibold text-kiremit-koyu">
            {uploadError}
          </p>
        )}
        {aiEnabled && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t-2 border-dashed border-kraft pt-4">
            <button
              type="button"
              className="btn btn-ikincil min-h-9 py-1 text-sm"
              disabled={ai.status === "running" || !images[0] || !!images[0].uploading}
              onClick={() => images[0] && void runAi(images[0].url)}
            >
              {ai.status === "running" ? "Fotoğrafa bakılıyor…" : "Fotoğraftan doldur"}
            </button>
            <p
              aria-live="polite"
              className={`min-w-0 flex-1 text-sm ${ai.status === "error" ? "font-semibold text-kiremit-koyu" : "text-murekkep-soluk"}`}
            >
              {ai.status === "idle" && "Kapak fotoğrafından ad, açıklama, kategori ve Hediş etiketi önerir; yalnızca boş alanları doldurur."}
              {ai.status === "running" && "Yapay zeka kapak fotoğrafına bakıyor… Ücretsiz modelde 30 saniye kadar sürebilir; bu sırada formu doldurmaya devam edebilirsin."}
              {(ai.status === "done" || ai.status === "error") && ai.message}
            </p>
          </div>
        )}
      </Panel>

      <Panel title="Hediş etiketleri">
        <p className="mb-4 text-sm text-murekkep-soluk">Hediş bu bilgilerle ürünü doğru kişiye önerir.</p>

        <fieldset>
          <legend className="text-sm font-bold">Kime uygun?</legend>
          <div className="mt-2 mb-3 flex flex-wrap gap-2 text-sm">
            {(
              [
                ["KADIN", "Tüm kadınlar"],
                ["ERKEK", "Tüm erkekler"],
                ["HEPSI", "Herkes"],
                ["TEMIZLE", "Temizle"],
              ] as const
            ).map(([mode, label]) => (
              <button key={mode} type="button" className="rounded-sm border border-murekkep px-2 py-0.5 hover:bg-krem-koyu" onClick={() => quickRecipients(mode)}>
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
            {RECIPIENTS.map((r) => (
              <label key={r.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 accent-kiremit"
                  checked={v.recipients.includes(r.key)}
                  onChange={() => set("recipients", toggleIn(v.recipients, r.key))}
                />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-sm font-bold">Cinsiyet</legend>
          <div className="mt-2 flex flex-wrap gap-5">
            {(
              [
                ["KADIN", "Kadın"],
                ["ERKEK", "Erkek"],
                ["UNISEX", "Herkese uygun"],
              ] as const
            ).map(([g, label]) => (
              <label key={g} className="flex items-center gap-2">
                <input type="radio" name="gender-ui" className="size-4 accent-kiremit" checked={v.gender === g} onChange={() => set("gender", g)} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-sm font-bold">İlgi alanları</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {HOBBIES.map((h) => (
              <TagChip key={h.key} active={v.hobbies.includes(h.key)} onClick={() => set("hobbies", toggleIn(v.hobbies, h.key))}>
                {h.label}
              </TagChip>
            ))}
          </div>
        </fieldset>

        <label className="mt-6 flex items-center gap-2 border-t-2 border-dashed border-kraft pt-4 font-semibold">
          <input type="checkbox" className="size-4 accent-kiremit" checked={v.hedisReviewed} onChange={(e) => set("hedisReviewed", e.target.checked)} />
          Etiketleri kontrol ettim
        </label>
      </Panel>

      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-t-2 border-murekkep bg-krem px-4 py-3 sm:-mx-8 sm:px-8">
        <button type="submit" className="btn btn-ana" disabled={pending || uploading}>
          {pending ? "Kaydediliyor…" : uploading ? "Fotoğraflar yükleniyor…" : "Kaydet"}
        </button>
        {initial.id && (
          <a href={`/urun/${initial.slug}`} target="_blank" rel="noopener" className="link-el text-sm font-semibold">
            Sitede gör ↗
          </a>
        )}
        {initial.id && (
          <button
            type="button"
            className="ml-auto text-sm font-semibold text-kiremit-koyu hover:underline"
            onClick={async () => {
              const msg = `"${initial.name}" silinsin mi? Bu geri alınamaz. Yalnızca gizlemek istiyorsan "Sitede yayında" kutusunu kaldırman yeterli.`;
              if (confirm(msg)) await deleteProductAction(initial.id!);
            }}
          >
            Ürünü sil
          </button>
        )}
      </div>
    </form>
  );
}

async function uploadOne(file: File, productName: string, blobEnabled: boolean): Promise<string> {
  const dot = file.name.lastIndexOf(".");
  const base = slugify(dot > 0 ? file.name.slice(0, dot) : file.name) || "foto";
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  if (blobEnabled) {
    const blob = await upload(`urunler/${slugify(productName) || "urun"}/${base}.${ext}`, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload",
      contentType: file.type,
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
