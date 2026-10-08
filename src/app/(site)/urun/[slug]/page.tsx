import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/components/site/AddToCart";
import { OrderInfo } from "@/components/site/OrderInfo";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductGallery } from "@/components/site/ProductGallery";
import { PriceTag } from "@/components/ui/PriceTag";
import { RibbonDivider } from "@/components/ui/RibbonDivider";
import { Stamp } from "@/components/ui/Stamp";
import { getActiveProductSlugs, getProductBySlug, getRelatedProducts, getSettings } from "@/lib/catalog";
import { occasionByKey } from "@/lib/hedis/config";
import { STAMP_ROTATIONS } from "@/lib/product-display";
import { absoluteUrl } from "@/lib/site";
import { buildProductQuestion, waLink } from "@/lib/whatsapp";

export async function generateStaticParams() {
  const products = await getActiveProductSlugs();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/urun/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Ürün bulunamadı" };
  const description = product.description.replace(/\s+/g, " ").slice(0, 155);
  const image = product.images[0]?.url;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/urun/${product.slug}` },
    openGraph: { title: product.name, description, images: image ? [image] : undefined },
  };
}

export default function ProductPage(props: PageProps<"/urun/[slug]">) {
  return (
    <div className="sayfa pt-4">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetails params={props.params} />
      </Suspense>
    </div>
  );
}

async function ProductDetails({ params }: Pick<PageProps<"/urun/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [settings, related] = await Promise.all([getSettings(), getRelatedProducts(product.id, product.category?.id ?? null)]);
  const url = absoluteUrl(`/urun/${product.slug}`);
  const soldOut = product.stock === 0;
  const askLink = settings.whatsappNumber
    ? waLink(settings.whatsappNumber, buildProductQuestion({ name: product.name, url, priceKurus: product.priceKurus }))
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    ...(product.category ? { category: product.category.name } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "TRY",
      price: (product.priceKurus / 100).toFixed(2),
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Sayfa yolu" className="mb-6 text-sm text-murekkep-soluk">
        <Link href="/" className="hover:text-murekkep hover:underline">
          Mağaza
        </Link>
        {product.category && (
          <>
            <span aria-hidden className="mx-2">/</span>
            <Link href={`/kategori/${product.category.slug}`} className="hover:text-murekkep hover:underline">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      {/*
        Masaüstünde fotoğraf ekran yüksekliğine göre boyutlanır; bilgiler iki sütuna bölünür
        (solda satın alma, sağda ayrıntılar) ve fotoğrafla aynı hizada biter. Mobilde alt alta.
      */}
      <div className="grid gap-10 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:gap-12 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-12">
        <div className="relative min-w-0 lg:w-[clamp(19rem,calc((100dvh-15rem)*0.8),30rem)]">
          <ProductGallery images={product.images} name={product.name} layout={product.galleryLayout} />
          {/* Damgalar polaroidin sağ üst köşesine basılmış gibi; mobilde biraz küçük */}
          {product.stamps.length > 0 && (
            <div className="pointer-events-none absolute -top-5 -right-3 z-20 flex origin-top-right scale-[0.85] -space-x-3 sm:-right-5 sm:scale-100">
              {product.stamps.map((t, i) => (
                <Stamp key={t} rotate={STAMP_ROTATIONS[i % STAMP_ROTATIONS.length]} className="bg-kagit/85 backdrop-blur-[1px]">
                  {t}
                </Stamp>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 md:pt-4 lg:pt-0 xl:grid xl:grid-cols-2 xl:gap-x-10">
          <div className="flex flex-col">
            <h1 className="text-3xl sm:text-4xl xl:text-[2.1rem]">{product.name}</h1>
            <PriceTag
              size="lg"
              className="mt-5"
              priceKurus={product.priceKurus}
              compareAtPriceKurus={product.compareAtPriceKurus}
            />

            <div className="mt-8 xl:mt-6">
              <AddToCart productId={product.id} soldOut={soldOut} name={product.name} priceKurus={product.priceKurus} />
            </div>

            {askLink && (
              <a href={askLink} target="_blank" rel="noopener" className="btn btn-whatsapp mt-1 self-start">
                <WhatsAppIcon /> WhatsApp&apos;tan sor
              </a>
            )}

            {/* Geniş ekranda sipariş bilgisi sütunun dibine oturur: fotoğrafla aynı hizada biter */}
            <div className="pt-6 xl:mt-auto">
              {/* El yapımı vurgusu yalnızca damgalı (el yapımı) ürünlerde */}
              <OrderInfo handmade={product.stamps.length > 0} />
            </div>
          </div>

          {(product.description || product.features.length > 0 || product.occasions.length > 0) && (
            <div className="mt-10 flex flex-col gap-8 xl:mt-0 xl:gap-6 xl:pt-1">
              {product.description && (
                <div>
                  <h2 className="font-el text-2xl font-normal text-kiremit-koyu">Bu parça hakkında</h2>
                  <div className="mt-2 max-w-prose whitespace-pre-line text-murekkep/90">{product.description}</div>
                </div>
              )}

              {product.features.length > 0 && (
                <div>
                  <h2 className="font-el text-2xl font-normal text-kiremit-koyu">Öne çıkanlar</h2>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {product.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span aria-hidden className="text-kiremit">
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.occasions.length > 0 && (
                <div>
                  <h2 className="font-el text-2xl font-normal text-kiremit-koyu">Şu günler için güzel bir hediye</h2>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {product.occasions.map((k) => {
                      const o = occasionByKey(k);
                      return o ? (
                        <li key={k} className="rounded-full border-[1.5px] border-kraft-koyu/70 bg-kagit px-3 py-1 text-sm font-semibold">
                          {o.label}
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="benzer">
          <RibbonDivider className="mt-16" />
          <h2 id="benzer" className="mb-8 text-2xl sm:text-3xl">
            Bunlar da hoşuna gidebilir
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4 sm:gap-x-6">
            {related.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} index={i + 1} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.3 4.8 4.9-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.6-.4Z" />
    </svg>
  );
}

function ProductSkeleton() {
  return (
    <div aria-hidden className="grid gap-10 pt-10 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:gap-12 lg:grid-cols-[clamp(19rem,calc((100dvh-15rem)*0.8),30rem)_minmax(0,1fr)] lg:gap-12">
      <div className="kagit aspect-[4/5] animate-pulse p-2.5">
        <div className="size-full bg-krem-koyu" />
      </div>
      <div className="pt-4">
        <div className="h-10 w-3/4 bg-krem-koyu" />
        <div className="mt-6 h-10 w-32 bg-kraft/60" />
        <div className="mt-10 h-12 w-56 bg-krem-koyu" />
      </div>
    </div>
  );
}
