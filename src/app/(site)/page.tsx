import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HedisAutoOpen, HedisOpenButton } from "@/components/hedis/HedisDialog";
import { ProductCard } from "@/components/site/ProductCard";
import { SortSelect } from "@/components/site/SortSelect";
import { NotePaper } from "@/components/ui/NotePaper";
import { Scribble } from "@/components/ui/Scribble";
import { TagLink } from "@/components/ui/TagChip";
import { getCategories, getShopProducts, isSortKey, SORTS, type SortKey } from "@/lib/catalog";
import { BUDGETS, budgetByKey, type BudgetKey } from "@/lib/hedis/config";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

type Filters = { category?: string; budget?: BudgetKey; sort: SortKey };

function readFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const budget = one(sp.butce);
  const sort = one(sp.sirala);
  return {
    category: one(sp.kategori) || undefined,
    budget: budget && budgetByKey(budget) ? (budget as BudgetKey) : undefined,
    sort: isSortKey(sort) ? sort : "onerilen",
  };
}

function hrefWith(f: Filters, patch: Partial<Filters>) {
  const next = { ...f, ...patch };
  const q = new URLSearchParams();
  if (next.category) q.set("kategori", next.category);
  if (next.budget) q.set("butce", next.budget);
  if (next.sort !== "onerilen") q.set("sirala", next.sort);
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

export default function HomePage(props: PageProps<"/">) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      {/* Ziyaretçiye oturum başına bir kez Hediş penceresini açar */}
      <HedisAutoOpen />
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <h1 className="max-w-2xl text-[2.1rem] leading-[1.08] sm:text-5xl">
            Elde örülen, <Scribble>sevgiyle</Scribble> paketlenen hediyeler
          </h1>
          <p className="mt-4 font-el text-2xl text-murekkep-soluk">hepsi elde, sabırla yapıldı</p>
        </div>
        <div className="max-w-xs">
          <p className="text-[0.95rem] text-murekkep-soluk">Kime ne alacağını bilemiyor musun? Hediş birkaç soruda seçsin.</p>
          <HedisOpenButton className="btn btn-ikincil mt-3">Hediş&apos;e sor</HedisOpenButton>
        </div>
      </div>
      <Suspense fallback={<ShopSkeleton />}>
        <ShopContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function ShopContent({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const filters = readFilters(await searchParams);
  const [categories, products] = await Promise.all([getCategories(), getShopProducts(filters)]);
  const filtered = !!(filters.category || filters.budget);

  return (
    <>
      <div id="urunler" className="mt-8 flex scroll-mt-4 flex-col gap-4 border-y-2 border-dashed border-kraft-koyu py-5">
        <FilterRow label="Kategori">
          <TagLink href={hrefWith(filters, { category: undefined })} active={!filters.category}>
            Hepsi
          </TagLink>
          {categories.map((c) => (
            <TagLink key={c.id} href={hrefWith(filters, { category: c.slug })} active={filters.category === c.slug}>
              {c.name}
            </TagLink>
          ))}
        </FilterRow>
        <FilterRow label="Bütçe">
          <TagLink href={hrefWith(filters, { budget: undefined })} active={!filters.budget}>
            Fark etmez
          </TagLink>
          {BUDGETS.map((b) => (
            <TagLink key={b.key} href={hrefWith(filters, { budget: b.key })} active={filters.budget === b.key}>
              {b.label}
            </TagLink>
          ))}
        </FilterRow>
      </div>

      <div className="mt-5 mb-8 flex items-center justify-between gap-4">
        <p className="text-murekkep-soluk" aria-live="polite">
          {products.length} ürün
        </p>
        <SortSelect
          value={filters.sort}
          options={Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label, href: hrefWith(filters, { sort: value as SortKey }) }))}
        />
      </div>

      {products.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
          {products.map((p, i) => (
            <li key={p.id}>
              <ProductCard product={p} index={i} priority={i < 4} />
            </li>
          ))}
        </ul>
      ) : (
        <NotePaper className="max-w-md" lined>
          <p className="font-el text-2xl">Hmm, bu rafta şu an bir şey yok.</p>
          <p className="mt-2">
            {filtered ? "Bu filtrelere uyan ürün bulamadık. " : "Yakında yeni ürünler geliyor. "}
            {filtered && (
              <Link href="/" className="link-el font-semibold">
                Filtreleri temizle
              </Link>
            )}
          </p>
        </NotePaper>
      )}
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-20 shrink-0 font-el text-xl text-kiremit-koyu">{label}</span>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">{children}</div>
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div aria-hidden className="mt-8">
      <div className="h-28 border-y-2 border-dashed border-kraft-koyu" />
      <ul className="mt-16 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="kagit p-2">
            <div className="aspect-[4/5] animate-pulse bg-krem-koyu" />
            <div className="mt-3 h-5 w-3/4 bg-krem-koyu" />
            <div className="mt-2 h-6 w-1/3 bg-kraft/60" />
          </li>
        ))}
      </ul>
    </div>
  );
}
