import Link from "next/link";
import { NotePaper } from "@/components/ui/NotePaper";
import { getCategories, getPriceStats, getShopProducts } from "@/lib/catalog";
import { hrefWith, readFilters } from "@/lib/shop-filters";
import { ProductCard } from "./ProductCard";
import { ShopToolbar } from "./ShopToolbar";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Filtre çubuğu + ürün ızgarası. Ana sayfa ve kategori sayfaları (category ile) kullanır. */
export async function ShopContent({ searchParams, category }: { searchParams: SearchParams; category?: string }) {
  const filters = readFilters(await searchParams, category);
  const [categories, products, prices] = await Promise.all([getCategories(), getShopProducts(filters), getPriceStats(filters.category)]);
  const narrowed = !!(filters.price || filters.q);

  return (
    <>
      <ShopToolbar
        categories={categories.map((c) => ({ slug: c.slug, name: c.name, count: c._count.products }))}
        filters={filters}
        prices={prices}
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
          <p className="font-el text-2xl">
            {filters.q ? <>&ldquo;{filters.q}&rdquo; için rafta bir şey bulamadım.</> : "Hmm, bu rafta şu an bir şey yok."}
          </p>
          <p className="mt-2">
            {narrowed ? "Aramayı ya da fiyat aralığını değiştirip yeniden bakabilirsin. " : "Yakında yeni ürünler geliyor. "}
            {narrowed && (
              <Link href={hrefWith(filters, { price: undefined, q: undefined })} className="link-el font-semibold">
                {filters.q ? "Aramayı temizle" : "Filtreleri temizle"}
              </Link>
            )}
          </p>
        </NotePaper>
      )}
    </>
  );
}

export function ShopSkeleton() {
  return (
    <div aria-hidden className="mt-8">
      <div className="h-36 border-y-2 border-dashed border-kraft-koyu lg:h-16" />
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
