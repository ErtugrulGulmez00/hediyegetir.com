"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BUDGETS } from "@/lib/hedis/config";
import { hrefWith, SORT_OPTIONS, type Filters, type SortKey } from "@/lib/shop-filters";

export type ToolbarCategory = { slug: string; name: string; count: number };

const chip =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-sm font-semibold whitespace-nowrap transition-colors";
const chipTone = (active: boolean) =>
  active ? "border-murekkep bg-murekkep text-kagit" : "border-kraft-koyu/70 bg-kagit text-murekkep hover:border-murekkep";

/**
 * Vitrin filtreleri: yatay kaydırılan kategori çipleri + aramalı "Tüm kategoriler" penceresi + kompakt
 * bütçe/sıralama seçicileri. 20+ kategoride de tek satır kalır.
 */
export function ShopToolbar({ categories, filters, total }: { categories: ToolbarCategory[]; filters: Filters; total: number }) {
  const [allOpen, setAllOpen] = useState(false);
  const activeName = categories.find((c) => c.slug === filters.category)?.name;

  return (
    <div id="urunler" className="mt-8 scroll-mt-4 border-y-2 border-dashed border-kraft-koyu py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <CategoryStrip categories={categories} filters={filters} />
          <button
            type="button"
            onClick={() => setAllOpen(true)}
            className={`${chip} border-dashed border-murekkep/60 bg-transparent hover:bg-kagit`}
            aria-haspopup="dialog"
          >
            <GridIcon />
            <span className="hidden sm:inline">Tüm kategoriler</span>
            <span className="sm:hidden">Tümü</span>
          </button>
        </div>
        <div className="flex min-w-0 items-center gap-2">
            <FilterSelect
              label="Bütçe"
              value={filters.budget ?? ""}
              options={[
                { value: "", label: "Fark etmez", href: hrefWith(filters, { budget: undefined }) },
                ...BUDGETS.map((b) => ({ value: b.key, label: b.label, href: hrefWith(filters, { budget: b.key }) })),
              ]}
            />
            <FilterSelect
              label="Sırala"
              value={filters.sort}
              options={Object.entries(SORT_OPTIONS).map(([value, label]) => ({
                value,
                label,
                href: hrefWith(filters, { sort: value as SortKey }),
              }))}
            />
        </div>
      </div>
      <p className="mt-2 text-sm text-murekkep-soluk" aria-live="polite">
        {total} ürün{activeName ? ` · ${activeName}` : ""}
      </p>
      <AllCategoriesDialog open={allOpen} onClose={() => setAllOpen(false)} categories={categories} filters={filters} />
    </div>
  );
}

/** Yatay kaydırılan çipler; taşarsa kenarlarda solma ve masaüstünde ok düğmeleri. */
function CategoryStrip({ categories, filters }: { categories: ToolbarCategory[]; filters: Filters }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    // Seçili kategoriyi görünür alana getir (sayfayı dikeyde kaydırmadan)
    const active = el.querySelector<HTMLElement>("[aria-current=true]");
    if (active) el.scrollLeft = active.offsetLeft - el.clientWidth / 2 + active.offsetWidth / 2;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [filters.category]);

  const scrollBy = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: "smooth" });
  const mask = `linear-gradient(to right, ${edges.left ? "transparent" : "black"}, black 2.5rem, black calc(100% - 2.5rem), ${edges.right ? "transparent" : "black"})`;

  return (
    <div className="relative min-w-0 flex-1">
      <div
        ref={ref}
        className="flex gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
        role="list"
        aria-label="Kategoriler"
      >
        <CategoryChip href={hrefWith(filters, { category: undefined })} active={!filters.category}>
          Hepsi
        </CategoryChip>
        {categories.map((c) => (
          <CategoryChip key={c.slug} href={hrefWith(filters, { category: c.slug })} active={filters.category === c.slug}>
            {c.name}
          </CategoryChip>
        ))}
      </div>
      {edges.left && <ArrowButton side="left" onClick={() => scrollBy(-1)} />}
      {edges.right && <ArrowButton side="right" onClick={() => scrollBy(1)} />}
    </div>
  );
}

function CategoryChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <span role="listitem" className="shrink-0">
      <Link href={href} scroll={false} aria-current={active ? "true" : undefined} className={`${chip} ${chipTone(active)}`}>
        {children}
      </Link>
    </span>
  );
}

function ArrowButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Önceki kategoriler" : "Sonraki kategoriler"}
      className={`absolute top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-murekkep bg-kagit shadow-baski-sm lg:flex ${
        side === "left" ? "-left-1" : "-right-1"
      }`}
    >
      <svg viewBox="0 0 16 16" className={`size-4 ${side === "left" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="m6 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function FilterSelect({
  label,
  value,
  options,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; href: string }[];
}) {
  const router = useRouter();
  return (
    <label className="relative flex h-9 min-w-0 flex-1 items-center rounded-full border-[1.5px] border-kraft-koyu/70 bg-kagit pl-3.5 text-sm hover:border-murekkep focus-within:border-murekkep lg:flex-none">
      <span className="shrink-0 text-murekkep-soluk">{label}:</span>
      <select
        value={value}
        onChange={(e) => {
          const opt = options.find((o) => o.value === e.target.value);
          if (opt) router.push(opt.href, { scroll: false });
        }}
        className="h-full w-full min-w-0 cursor-pointer appearance-none truncate rounded-full bg-transparent pr-8 pl-1 font-semibold outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 16 16" className="pointer-events-none absolute right-3 size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}

/** Aramalı kategori penceresi: mobilde alttan açılan sayfa, masaüstünde ortada. */
function AllCategoriesDialog({
  open,
  onClose,
  categories,
  filters,
}: {
  open: boolean;
  onClose: () => void;
  categories: ToolbarCategory[];
  filters: Filters;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const q = query.toLocaleLowerCase("tr-TR").trim();
  const list = q ? categories.filter((c) => c.name.toLocaleLowerCase("tr-TR").includes(q)) : categories;

  return (
    <dialog
      ref={ref}
      aria-labelledby="tum-kategoriler-baslik"
      onClose={() => {
        setQuery("");
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="mt-auto mb-0 w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-murekkep/45 sm:m-auto sm:w-[calc(100%-3rem)] sm:max-w-2xl"
    >
      <div className="max-h-[80dvh] overflow-y-auto rounded-t-xl bg-krem p-5 sm:rounded-sm sm:border-2 sm:border-murekkep sm:shadow-baski">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="tum-kategoriler-baslik" className="text-2xl">
            Tüm kategoriler
          </h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm font-semibold hover:bg-krem-koyu">
            Kapat <span aria-hidden>✕</span>
          </button>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kategori ara…"
          aria-label="Kategori ara"
          autoFocus
          className="h-11 w-full rounded-full border-[1.5px] border-kraft-koyu bg-kagit px-4 outline-none focus:border-murekkep"
        />
        <ul className="mt-4 grid gap-1 sm:grid-cols-2">
          {!q && (
            <li>
              <Link
                href={hrefWith(filters, { category: undefined })}
                scroll={false}
                onClick={onClose}
                className={`flex items-center justify-between rounded-md px-3 py-2.5 ${!filters.category ? "bg-murekkep text-kagit" : "hover:bg-krem-koyu"}`}
              >
                <span className="font-semibold">Hepsi</span>
              </Link>
            </li>
          )}
          {list.map((c) => {
            const active = filters.category === c.slug;
            return (
              <li key={c.slug}>
                <Link
                  href={hrefWith(filters, { category: c.slug })}
                  scroll={false}
                  onClick={onClose}
                  aria-current={active ? "true" : undefined}
                  className={`flex items-center justify-between gap-3 rounded-md px-3 py-2.5 ${active ? "bg-murekkep text-kagit" : "hover:bg-krem-koyu"}`}
                >
                  <span className="font-semibold">{c.name}</span>
                  <span className={`text-sm ${active ? "text-kagit/80" : "text-murekkep-soluk"}`}>{c.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {list.length === 0 && <p className="mt-4 text-murekkep-soluk">&quot;{query}&quot; ile eşleşen kategori yok.</p>}
      </div>
    </dialog>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden>
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  );
}
