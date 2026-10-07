import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HedisAutoOpen, HedisOpenButton } from "@/components/hedis/HedisDialog";
import { ProductCard } from "@/components/site/ProductCard";
import { ShopToolbar } from "@/components/site/ShopToolbar";
import { NotePaper } from "@/components/ui/NotePaper";
import { Scribble } from "@/components/ui/Scribble";
import { getCategories, getShopProducts } from "@/lib/catalog";
import { readFilters } from "@/lib/shop-filters";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage(props: PageProps<"/">) {
  return (
    <div className="sayfa pt-6">
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
      <ShopToolbar
        categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c._count.products }))}
        filters={filters}
        total={products.length}
      />

      {products.length > 0 ? (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 2xl:grid-cols-5">
          {products.map((p, i) => (
            <li key={p.id}>
              <ProductCard product={p} index={i} priority={i < 4} />
            </li>
          ))}
        </ul>
      ) : (
        <NotePaper className="mt-8 max-w-md" lined>
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

function ShopSkeleton() {
  return (
    <div aria-hidden className="mt-8">
      <div className="h-24 border-y-2 border-dashed border-kraft-koyu lg:h-16" />
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 2xl:grid-cols-5">
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
