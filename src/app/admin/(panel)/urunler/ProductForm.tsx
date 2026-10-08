"use client";

import { confirmDialog } from "@/store/confirm";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { AiOneriRequest, AiOneriResponse } from "@/app/api/admin/ai-oneri/route";
import { AiBadge } from "@/components/ai/AiBits";
import { Stamp } from "@/components/ui/Stamp";
import type { ProductFormInput } from "@/lib/admin/product-input";
import { mergeSuggestion, type AiField } from "@/lib/ai/merge";
import { HOBBIES, OCCASIONS, RECIPIENTS, type GenderKey } from "@/lib/hedis/config";
import { parsePriceInput } from "@/lib/money";
import {
  effectiveLayout,
  GALLERY_LAYOUTS,
  MAX_STAMPS,
  STAMP_MAX_LENGTH,
  STAMP_PRESETS,
  STAMP_ROTATIONS,
  type GalleryLayoutKey,
} from "@/lib/product-display";
import { slugify } from "@/lib/slug";
import { createCategoryQuickAction, deleteProductAction, saveProductAction, type ProductFormState } from "../../actions";
import { Field, inputClass } from "../ui";
import { AiPanel, AiProposal, type AiState } from "./AiPanel";
import { nextImgKey, PhotoUploader, type ImgItem } from "./PhotoUploader";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

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
  occasions: string[];
  tags: string[];
  features: string[];
  images: { id: string; url: string; alt: string; isBlob: boolean }[];
  galleryLayout: GalleryLayoutKey;
  stamps: string[];
};

type Form = ProductFormInitial;

/** Hangi form alanı hangi AI alanına karşılık gelir (admin değiştirince AI rozeti kalkar) */
const FIELD_TO_AI: Partial<Record<keyof Form, AiField>> = {
  name: "name",
  description: "description",
  categoryId: "category",
  recipients: "audience",
  hobbies: "audience",
  gender: "audience",
  occasions: "occasions",
  tags: "tags",
  features: "features",
};

/** Ürün adı yazıldıktan bu kadar sonra (fotoğraf yoksa) AI kendiliğinden analiz eder */
const NAME_DEBOUNCE_MS = 1500;

export function ProductForm({
  initial,
  categories: initialCategories,
  blobEnabled,
  aiEnabled,
}: {
  initial: ProductFormInitial;
  categories: { id: string; name: string }[];
  blobEnabled: boolean;
  /** Yapay zeka anahtarı tanımlıysa AI asistanı açılır */
  aiEnabled: boolean;
}) {
  const [v, setV] = useState(initial);
  const [images, setImages] = useState<ImgItem[]>(() => initial.images.map((i) => ({ ...i, key: nextImgKey() })));
  const [categories, setCategories] = useState(initialCategories);
  const [ai, setAi] = useState<AiState>({ status: "idle" });
  const [aiFields, setAiFields] = useState<Set<AiField>>(new Set());
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [betterDescription, setBetterDescription] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(saveProductAction.bind(null, initial.id), {});
  const err = state.errors ?? {};
  const uploading = images.some((i) => i.uploading);
  const isNew = initial.id === null;

  // Cevap gelene kadar admin yazmaya devam edebilir; birleştirmede en güncel durum kullanılır
  const latest = useRef({ v, images, aiFields });
  useEffect(() => {
    latest.current = { v, images, aiFields };
  }, [v, images, aiFields]);
  const analysis = useRef({ ran: false, withPhotos: false, running: false, queued: false });

  const set = <K extends keyof Form>(k: K, val: Form[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    const aiField = FIELD_TO_AI[k];
    if (aiField) setAiFields((s) => (s.has(aiField) ? new Set([...s].filter((f) => f !== aiField)) : s));
  };
  const toggleIn = (list: string[], key: string) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  // Yalnızca ref'lerden okur; bayat kapanış sorun olmaz
  async function analyze() {
    const a = analysis.current;
    if (a.running) {
      a.queued = true;
      return;
    }
    const { v: form, images: imgs, aiFields: aiNow } = latest.current;
    const imageUrls = imgs.filter((i) => !i.uploading && i.url).map((i) => i.url);
    if (imageUrls.length === 0 && form.name.trim().length < 3) return;

    a.running = true;
    const withImages = imageUrls.length > 0;
    setAi({ status: "running", withImages });
    const minDelay = new Promise((r) => setTimeout(r, 1200)); // adımlar okunabilsin
    try {
      const body: AiOneriRequest = {
        name: form.name,
        description: aiNow.has("description") ? "" : form.description,
        priceKurus: parsePriceInput(form.price),
        imageUrls,
      };
      const [res] = await Promise.all([
        fetch("/api/admin/ai-oneri", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
        minDelay,
      ]);
      const data = (await res.json().catch(() => ({ error: `HTTP ${res.status}` }))) as AiOneriResponse;
      if ("error" in data) {
        setAi({ status: "error", message: data.error, withImages });
        return;
      }
      const s = data.suggestion;
      const cur = latest.current;
      const nameBefore = cur.v.name;
      const { next, filled } = mergeSuggestion(cur.v, s, [...cur.aiFields]);
      setV(next);
      setAiFields(new Set([...cur.aiFields, ...filled]));

      // Fotoğraf açıklamaları: boşsa ya da yalnızca ürün adıysa
      setImages((list) =>
        list.map((img) => {
          const idx = data.analyzedImages.indexOf(img.url);
          const alt = idx >= 0 ? s.alts[idx] : undefined;
          return alt && (!img.alt.trim() || img.alt === nameBefore) ? { ...img, alt } : img;
        }),
      );

      // Admin kendi açıklamasını yazdıysa geliştirilmiş hali öneri olarak sun
      if (!filled.includes("description") && s.description && cur.v.description.trim() && s.description.trim() !== cur.v.description.trim()) {
        setBetterDescription(s.description);
      }
      setNewCategory(!next.categoryId && s.newCategoryName ? s.newCategoryName : null);
      setAi({ status: "done", filled, withImages });
      a.ran = true;
      a.withPhotos ||= withImages;
    } catch {
      setAi({ status: "error", message: "Bağlantı sorunu; tekrar dener misin?", withImages });
    } finally {
      a.running = false;
      if (a.queued) {
        a.queued = false;
        if (!a.withPhotos && latest.current.images.some((i) => i.url && !i.uploading)) void analyze();
      }
    }
  }
  const analyzeRef = useRef(analyze);
  useEffect(() => {
    analyzeRef.current = analyze;
  });

  // Yeni üründe: fotoğraf yoksa ürün adı yazılınca kendiliğinden analiz et
  useEffect(() => {
    if (!aiEnabled || !isNew || analysis.current.ran || analysis.current.running) return;
    if (v.name.trim().length < 3 || images.length > 0) return;
    const id = setTimeout(() => void analyzeRef.current(), NAME_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [aiEnabled, isNew, v.name, images.length]);

  // Fotoğraflar yüklenince: henüz fotoğrafla analiz yapılmadıysa kendiliğinden analiz et.
  // Yükleme biter bitmez değil, yeni adresler duruma işlendikten sonra (efektte) çalışır.
  const [photosReady, setPhotosReady] = useState(false);
  const onBatchUploaded = () => {
    if (aiEnabled && !analysis.current.withPhotos) setPhotosReady(true);
  };
  useEffect(() => {
    if (!photosReady || uploading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tek seferlik tetik bayrağını sıfırla
    setPhotosReady(false);
    void analyzeRef.current();
  }, [photosReady, uploading]);

  async function createCategory(name: string) {
    setCreatingCategory(true);
    const res = await createCategoryQuickAction(name);
    setCreatingCategory(false);
    if ("error" in res) {
      setAi((s) => (s.status === "done" ? { ...s, note: res.error } : s));
      return;
    }
    setCategories((list) => (list.some((c) => c.id === res.id) ? list : [...list, res]));
    setV((s) => ({ ...s, categoryId: res.id }));
    setAiFields((s) => new Set([...s, "category"]));
    setNewCategory(null);
  }

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
    occasions: v.occasions,
    tags: v.tags,
    features: v.features,
    images: images.filter((i) => !i.uploading).map(({ id, url, alt, isBlob }) => ({ id, url, alt, isBlob })),
    galleryLayout: v.galleryLayout,
    stamps: v.stamps,
  };

  // Kaydedilmemiş değişiklik varken sayfadan ayrılırken uyar. Kayıttan sonra form yeniden kurulduğu için
  // (bkz. [id]/page.tsx'teki key) başlangıç hâli de sıfırlanır.
  const payloadJson = JSON.stringify(payload);
  const [savedJson] = useState(payloadJson);
  useUnsavedChangesGuard((payloadJson !== savedJson || uploading) && !pending);

  const badge = (f: AiField) => (aiFields.has(f) ? <AiBadge /> : null);
  const canRunAi = images.some((i) => i.url && !i.uploading) || v.name.trim().length >= 3;

  const aiPanel = aiEnabled ? (
    <AiPanel state={ai} canRun={canRunAi} onRun={() => void analyze()}>
      {newCategory && (
        <AiProposal
          title="Bu ürün mevcut kategorilerinle tam olarak eşleşmiyor."
          confirmLabel="Kategoriyi oluştur"
          busy={creatingCategory}
          onConfirm={() => void createCategory(newCategory)}
          onDismiss={() => setNewCategory(null)}
        >
          Yeni <strong>&ldquo;{newCategory}&rdquo;</strong> kategorisi oluşturulsun mu?
        </AiProposal>
      )}
      {betterDescription && (
        <AiProposal
          title="Açıklamanı biraz geliştirdim"
          confirmLabel="Bunu kullan"
          onConfirm={() => {
            set("description", betterDescription);
            setAiFields((s) => new Set([...s, "description"]));
            setBetterDescription(null);
          }}
          onDismiss={() => setBetterDescription(null)}
        >
          <p className="whitespace-pre-line text-murekkep-soluk">{betterDescription}</p>
        </AiProposal>
      )}
    </AiPanel>
  ) : null;

  return (
    <form action={formAction} className="pb-8">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      {/* Üst çubuk: kaydet ve yayın anahtarları her zaman görünür */}
      <div className="sticky top-0 z-30 -mx-4 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b-2 border-murekkep bg-krem/95 px-4 py-2.5 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <Link href="/admin/urunler" className="text-sm text-murekkep-soluk hover:underline">
          ← Ürünler
        </Link>
        <h1 className="min-w-0 flex-1 truncate font-baslik text-xl sm:text-2xl">{v.name.trim() || (isNew ? "Yeni ürün" : "Ürün")}</h1>
        <div className="order-last flex w-full items-center gap-5 sm:order-none sm:w-auto">
          <Switch label="Yayında" checked={v.isActive} onChange={(c) => set("isActive", c)} />
          <Switch label="Öne çıkan" checked={v.isFeatured} onChange={(c) => set("isFeatured", c)} />
        </div>
        {!isNew && (
          <a href={`/urun/${initial.slug}`} target="_blank" rel="noopener" className="link-el text-sm font-semibold">
            Sitede gör ↗
          </a>
        )}
        <button type="submit" className="btn btn-ana" disabled={pending || uploading}>
          {pending ? "Kaydediliyor…" : uploading ? "Fotoğraflar yükleniyor…" : "Kaydet"}
        </button>
      </div>

      {state.message && (
        <p role="alert" className="mb-4 border-l-4 border-kiremit bg-kagit px-4 py-3 font-semibold">
          {state.message}
        </p>
      )}

      {/*
        Geniş ekranda üç sütun: fotoğraf + görünüm | ürün bilgileri | AI + Hediş.
        Orta boyda sol sütunda fotoğraflar ve bilgiler alt alta, sağda AI + Hediş.
      */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[19rem_minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
          <Section title="Fotoğraflar">
            <PhotoUploader
              images={images}
              setImages={setImages}
              blobEnabled={blobEnabled}
              productName={v.name}
              onBatchUploaded={onBatchUploaded}
              error={err.images}
            />
          </Section>
          <Section title="Ürün sayfasında görünüm">
            <LayoutPicker value={v.galleryLayout} onChange={(l) => set("galleryLayout", l)} images={images} />
            <StampPicker values={v.stamps} onChange={(list) => set("stamps", list)} error={err.stamps} />
          </Section>
        </div>

        {/* Mobilde AI kutusu fotoğrafların hemen altında */}
        {aiPanel && <div className="lg:hidden">{aiPanel}</div>}

        <Section title="Ürün bilgileri" className="lg:col-start-1 lg:row-start-2 xl:col-start-2 xl:row-start-1">
          <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2 2xl:grid-cols-4">
            <Field label="Ürün adı" error={err.name} className="sm:col-span-2 2xl:col-span-4" labelExtra={badge("name")}>
              <input className={inputClass} value={v.name} onChange={(e) => set("name", e.target.value)} required placeholder="Ör. Kişiye özel ahşap kalem" />
            </Field>
            <Field label="Satış fiyatı (₺)" error={err.price}>
              <input className={inputClass} inputMode="decimal" value={v.price} onChange={(e) => set("price", e.target.value)} required placeholder="Ör. 1.250" />
            </Field>
            <Field label="Eski fiyat (₺)" error={err.compareAtPrice} hint="Varsa üstü çizili görünür">
              <input className={inputClass} inputMode="decimal" value={v.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} />
            </Field>
            <Field label="Stok" error={err.stock} hint="0 = tükendi">
              <input className={inputClass} inputMode="numeric" value={v.stock} onChange={(e) => set("stock", e.target.value)} placeholder="Sipariş üzerine" />
            </Field>
            <Field label="Kategori" labelExtra={badge("category")}>
              <select className={inputClass} value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">Kategorisiz</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Açıklama" error={err.description} className="sm:col-span-2 2xl:col-span-4" labelExtra={badge("description")}>
              <textarea className={`${inputClass} min-h-32`} value={v.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <div className="sm:col-span-2 2xl:col-span-4">
              <FeatureList values={v.features} onChange={(list) => set("features", list)} badge={badge("features")} error={err.features} />
            </div>
          </div>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-semibold text-murekkep-soluk hover:text-murekkep">Gelişmiş: sayfa adresi</summary>
            <Field label="Adres (slug)" error={err.slug} hint={`hediyegetir.com/urun/${slugify(v.slug || v.name) || "…"}`} className="mt-3">
              <input className={inputClass} value={v.slug} placeholder="Boş bırakırsan addan üretilir" onChange={(e) => set("slug", e.target.value)} />
            </Field>
          </details>
        </Section>

        {/* Sağ sütun yapışık ve kendi içinde kayar; sayfa boyu yalnızca en uzun sol/orta sütun kadar */}
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:pb-1 xl:col-start-3 xl:row-span-1">
          {aiPanel && <div className="hidden lg:block">{aiPanel}</div>}

          <Section title="Hediş için" titleExtra={badge("audience")} hint="Hediş bu bilgilerle ürünü doğru kişiye önerir.">
            <Group label="Kime uygun?">
              <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
                {(
                  [
                    ["KADIN", "Tüm kadınlar"],
                    ["ERKEK", "Tüm erkekler"],
                    ["HEPSI", "Herkes"],
                    ["TEMIZLE", "Temizle"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    className="rounded-full border border-murekkep/50 px-2 py-0.5 hover:bg-krem-koyu"
                    onClick={() => {
                      if (mode === "TEMIZLE") return set("recipients", []);
                      set(
                        "recipients",
                        RECIPIENTS.filter((r) => r.key !== "cocuk" && (mode === "HEPSI" || r.gender === null || r.gender === mode)).map((r) => r.key),
                      );
                      set("gender", mode === "HEPSI" ? "UNISEX" : mode);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <ToggleGroup options={RECIPIENTS} selected={v.recipients} onToggle={(k) => set("recipients", toggleIn(v.recipients, k))} />
            </Group>
            <Group label="Cinsiyet">
              <div role="radiogroup" aria-label="Cinsiyet" className="inline-flex rounded-full border-[1.5px] border-murekkep/60 p-0.5">
                {(
                  [
                    ["KADIN", "Kadın"],
                    ["ERKEK", "Erkek"],
                    ["UNISEX", "Herkese uygun"],
                  ] as const
                ).map(([g, label]) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={v.gender === g}
                    onClick={() => set("gender", g)}
                    className={`rounded-full px-3 py-0.5 text-sm font-semibold ${v.gender === g ? "bg-murekkep text-kagit" : "hover:bg-krem-koyu"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Group>
            <Group label="İlgi alanları">
              <ToggleGroup options={HOBBIES} selected={v.hobbies} onToggle={(k) => set("hobbies", toggleIn(v.hobbies, k))} />
            </Group>
            <Group label="Özel günler" extra={badge("occasions")}>
              <ToggleGroup options={OCCASIONS} selected={v.occasions} onToggle={(k) => set("occasions", toggleIn(v.occasions, k))} />
            </Group>
            <Group label="Etiketler" extra={badge("tags")}>
              <ChipInput values={v.tags} onChange={(list) => set("tags", list)} error={err.tags} />
            </Group>
            <label className="flex items-center gap-2 border-t-2 border-dashed border-kraft pt-3 font-semibold">
              <input type="checkbox" className="size-4 accent-kiremit" checked={v.hedisReviewed} onChange={(e) => set("hedisReviewed", e.target.checked)} />
              Etiketleri kontrol ettim
            </label>
          </Section>

          {!isNew && (
            <button
              type="button"
              className="self-start px-1 text-sm font-semibold text-kiremit-koyu hover:underline"
              onClick={async () => {
                const ok = await confirmDialog({
                  title: `"${initial.name}" silinsin mi?`,
                  message: 'Bu geri alınamaz. Yalnızca gizlemek istiyorsan "Yayında" anahtarını kapatman yeterli.',
                  confirmLabel: "Evet, sil",
                  danger: true,
                });
                if (ok) await deleteProductAction(initial.id!);
              }}
            >
              Ürünü sil
            </button>
          )}
        </aside>
      </div>
    </form>
  );
}

function Section({
  title,
  titleExtra,
  hint,
  className = "",
  children,
}: {
  title: string;
  titleExtra?: React.ReactNode;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`kagit min-w-0 rounded-xl p-4 ${className}`}>
      <h2 className="flex items-center font-baslik text-lg leading-tight">
        {title}
        {titleExtra}
      </h2>
      {hint && <p className="mt-0.5 text-sm text-murekkep-soluk">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Group({ label, extra, children }: { label: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-1.5 flex items-center text-sm font-bold">
        {label}
        {extra}
      </legend>
      {children}
    </fieldset>
  );
}

function Chip({ on, onClick, disabled, children }: { on: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border-[1.5px] px-2.5 py-0.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        on ? "border-murekkep bg-murekkep text-kagit" : "border-kraft-koyu/60 bg-kagit enabled:hover:border-murekkep"
      }`}
    >
      {children}
    </button>
  );
}

function ToggleGroup({
  options,
  selected,
  onToggle,
}: {
  options: readonly { key: string; label: string }[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Chip key={o.key} on={selected.includes(o.key)} onClick={() => onToggle(o.key)}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

/**
 * Ürün sayfasındaki damgalar (en fazla 3): hazır yazılar aç/kapa, kendi yazını ekle; üstte canlı önizleme.
 * Hiç damga seçilmezse ürün sayfasında damga görünmez.
 */
function StampPicker({ values, onChange, error }: { values: string[]; onChange: (v: string[]) => void; error?: string }) {
  const [draft, setDraft] = useState("");
  const full = values.length >= MAX_STAMPS;
  const custom = values.filter((t) => !(STAMP_PRESETS as readonly string[]).includes(t));
  const toggle = (t: string) => onChange(values.includes(t) ? values.filter((x) => x !== t) : [...values, t]);
  const add = () => {
    const t = draft.trim().replace(/\s+/g, " ");
    if (t && !full && !values.includes(t)) onChange([...values, t]);
    setDraft("");
  };

  return (
    <div className="mt-4 border-t-2 border-dashed border-kraft pt-4">
      <p className="flex items-baseline justify-between gap-2 text-sm font-bold">
        Damgalar
        <span className="text-xs font-normal text-murekkep-soluk">
          {values.length}/{MAX_STAMPS} · başlığın yanında
        </span>
      </p>
      <div aria-hidden className="mt-2 flex h-20 items-center justify-center rounded-lg bg-krem-koyu/60">
        {values.length > 0 ? (
          <div className="flex origin-center scale-[0.8] -space-x-3">
            {values.map((t, i) => (
              <Stamp key={t} rotate={STAMP_ROTATIONS[i % STAMP_ROTATIONS.length]}>
                {t}
              </Stamp>
            ))}
          </div>
        ) : (
          <span className="font-el text-lg text-murekkep-soluk">damga yok</span>
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Hazır damgalar">
        {STAMP_PRESETS.map((p) => {
          const on = values.includes(p);
          return (
            <Chip key={p} on={on} disabled={full && !on} onClick={() => toggle(p)}>
              {p}
            </Chip>
          );
        })}
        {custom.map((t) => (
          <Chip key={t} on onClick={() => toggle(t)}>
            {t} <span aria-hidden>✕</span>
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          aria-label="Kendi damga yazın"
          value={draft}
          maxLength={STAMP_MAX_LENGTH}
          disabled={full}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={full ? `En fazla ${MAX_STAMPS} damga` : "Kendi yazın, ör. Anne eli"}
          className={`${inputClass} min-w-0 py-1.5 text-sm`}
        />
        <button type="button" onClick={add} disabled={full || !draft.trim()} className="btn btn-ikincil min-h-9 shrink-0 px-3 py-1 text-sm">
          Ekle
        </button>
      </div>
      {values.length > 0 && (
        <button type="button" onClick={() => onChange([])} className="mt-2 text-xs font-semibold text-murekkep-soluk hover:text-kiremit-koyu hover:underline">
          Damgasız yap
        </button>
      )}
      {error && <p className="mt-1 text-sm font-semibold text-kiremit-koyu">{error}</p>}
    </div>
  );
}

/** Ürün sayfasında fotoğrafların dizilişi; her seçenek eldeki fotoğraflarla küçük bir önizleme gösterir */
function LayoutPicker({ value, onChange, images }: { value: GalleryLayoutKey; onChange: (l: GalleryLayoutKey) => void; images: ImgItem[] }) {
  const count = images.length;
  const shown = effectiveLayout(value, count);
  const current = GALLERY_LAYOUTS.find((l) => l.key === value)!;
  return (
    <div>
      <p id="duzen-baslik" className="text-sm font-bold">
        Fotoğraf düzeni
      </p>
      <div role="radiogroup" aria-labelledby="duzen-baslik" className="mt-2 grid grid-cols-3 gap-2">
        {GALLERY_LAYOUTS.map((l) => {
          const on = value === l.key;
          return (
            <button
              key={l.key}
              type="button"
              role="radio"
              aria-checked={on}
              title={l.hint}
              onClick={() => onChange(l.key)}
              className={`rounded-lg border-2 p-1 transition-colors ${on ? "border-murekkep bg-kagit shadow-baski-sm" : "border-kraft bg-kagit/50 hover:border-murekkep/60"}`}
            >
              <MiniGallery layout={l.key} images={images} />
              <span className="mt-0.5 block text-sm font-semibold">{l.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-murekkep-soluk">
        {shown !== value && count > 0
          ? `${current.label} düzen için en az ${value === "UCLU" ? 3 : 2} fotoğraf gerekir; şimdilik ${shown === "TEK" ? "tek fotoğraf" : "ikili"} düzende görünür.`
          : current.hint}
      </p>
    </div>
  );
}

const MINI_CELLS: Record<GalleryLayoutKey, { grid: string; cells: string[] }> = {
  TEK: { grid: "grid-cols-4 grid-rows-[1fr_auto]", cells: ["col-span-4", "aspect-square", "aspect-square", "aspect-square", "aspect-square"] },
  IKILI: { grid: "grid-cols-2 grid-rows-2", cells: ["", "", "", ""] },
  UCLU: { grid: "grid-cols-3 grid-rows-2", cells: ["col-span-2 row-span-2", "", ""] },
};

function MiniGallery({ layout, images }: { layout: GalleryLayoutKey; images: ImgItem[] }) {
  const { grid, cells } = MINI_CELLS[layout];
  return (
    <span aria-hidden className={`grid aspect-square gap-0.5 overflow-hidden rounded-sm ${grid}`}>
      {cells.map((cell, i) => {
        const img = images[i];
        const src = img ? img.url || img.preview : undefined;
        return (
          <span key={i} className={`relative overflow-hidden bg-krem-koyu ${cell}`}>
            {src && (
              // eslint-disable-next-line @next/next/no-img-element -- küçük önizleme; yüklenirken yerel blob adresi de gösterilir
              <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
            )}
          </span>
        );
      })}
    </span>
  );
}

/** Serbest etiket girişi: Enter ya da virgülle ekle, ✕ ile sil. */
function ChipInput({ values, onChange, error }: { values: string[]; onChange: (v: string[]) => void; error?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim().toLocaleLowerCase("tr-TR").replace(/,+$/, "");
    if (t && !values.includes(t)) onChange([...values, t]);
    setDraft("");
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border-[1.5px] border-murekkep/60 bg-kagit p-1.5 focus-within:border-murekkep">
        {values.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-krem-koyu py-0.5 pr-1 pl-2.5 text-sm">
            {t}
            <button
              type="button"
              aria-label={`${t} etiketini kaldır`}
              onClick={() => onChange(values.filter((x) => x !== t))}
              className="rounded-full px-1 text-murekkep-soluk hover:text-kiremit-koyu"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && values.length) onChange(values.slice(0, -1));
          }}
          onBlur={add}
          aria-label="Etiket ekle"
          placeholder={values.length ? "" : "romantik, kişiye özel…"}
          className="min-w-24 flex-1 bg-transparent px-1.5 py-1 text-sm outline-none"
        />
      </div>
      {error && <p className="mt-1 text-sm font-semibold text-kiremit-koyu">{error}</p>}
    </div>
  );
}

/** Ürün özellikleri: madde madde, ekle / sil. */
function FeatureList({
  values,
  onChange,
  badge,
  error,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  badge: React.ReactNode;
  error?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t) onChange([...values, t]);
    setDraft("");
  };
  return (
    <div>
      <p className="mb-1.5 flex items-center text-sm font-bold">
        Ürün özellikleri
        {badge}
      </p>
      {values.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1.5">
          {values.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <span aria-hidden className="text-kiremit">
                •
              </span>
              <input
                aria-label={`${i + 1}. özellik`}
                value={f}
                onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
                className="min-w-0 flex-1 border-b border-transparent bg-transparent py-1 outline-none hover:border-kraft focus:border-murekkep"
              />
              <button
                type="button"
                aria-label={`${i + 1}. özelliği kaldır`}
                onClick={() => onChange(values.filter((_, j) => j !== i))}
                className="px-1 text-murekkep-soluk hover:text-kiremit-koyu"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          aria-label="Özellik ekle"
          placeholder="Ör. %100 pamuk ip"
          className={`${inputClass} py-1.5 text-sm`}
        />
        <button type="button" onClick={add} className="btn btn-ikincil min-h-9 shrink-0 px-3 py-1 text-sm">
          Ekle
        </button>
      </div>
      {error && <p className="mt-1 text-sm font-semibold text-kiremit-koyu">{error}</p>}
    </div>
  );
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
      {label}
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-6 w-11 shrink-0 rounded-full border-2 border-murekkep bg-krem-koyu transition-colors peer-checked:bg-zeytin peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-kiremit peer-focus-visible:outline-dashed after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:border-2 after:border-murekkep after:bg-kagit after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}
