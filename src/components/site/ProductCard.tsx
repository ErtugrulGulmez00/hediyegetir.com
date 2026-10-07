import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { PriceTag } from "@/components/ui/PriceTag";
import { Tape } from "@/components/ui/Tape";

// El yapımı hissi için kartlar hafif eğik; dizilişteki sıraya göre sabit
const TILTS = [-1, 0.7, -0.4, 1, -0.8, 0.5];
const TAPES = ["hardal", "gul", "zeytin", "kraft"] as const;

export function ProductCard({
  product,
  index = 0,
  priority = false,
  children,
}: {
  product: ProductCardData;
  index?: number;
  priority?: boolean;
  /** Kartın altına eklenecek içerik (ör. Hediş "neden" etiketleri) */
  children?: React.ReactNode;
}) {
  const img = product.images[0];
  const soldOut = product.stock === 0;
  return (
    <article className="group relative">
      <div
        className="kagit relative p-2 pb-3 transition-[rotate,translate] duration-200 group-hover:-translate-y-1 group-hover:rotate-0"
        style={{ rotate: `${TILTS[index % TILTS.length]}deg` }}
      >
        <Tape
          color={TAPES[index % TAPES.length]}
          rotate={index % 2 ? 5 : -5}
          className={index % 2 ? "-top-3 -right-3" : "-top-3 -left-3"}
        />
        <Link href={`/urun/${product.slug}`} className="block" aria-label={product.name}>
          <div className="relative aspect-[4/5] overflow-hidden bg-krem-koyu">
            {img ? (
              <Image
                src={img.url}
                alt={img.alt || product.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center font-el text-xl text-murekkep-soluk">
                fotoğraf yolda
              </span>
            )}
            {soldOut && (
              <span className="absolute bottom-2 left-2 -rotate-3 bg-murekkep px-2 py-0.5 font-el text-lg text-krem">
                şu an tükendi
              </span>
            )}
          </div>
        </Link>
        <div className="px-1 pt-3">
          {product.category && (
            <p className="text-xs font-semibold tracking-wide text-murekkep-soluk uppercase">{product.category.name}</p>
          )}
          <h3 className="mt-0.5 font-baslik text-lg leading-snug">
            <Link href={`/urun/${product.slug}`} className="hover:text-kiremit-koyu">
              {product.name}
            </Link>
          </h3>
          <PriceTag
            className="mt-2"
            priceKurus={product.priceKurus}
            compareAtPriceKurus={product.compareAtPriceKurus}
          />
          {children}
        </div>
      </div>
    </article>
  );
}
