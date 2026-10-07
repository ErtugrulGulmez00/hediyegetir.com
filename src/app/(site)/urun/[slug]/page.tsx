import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/components/site/AddToCart";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductGallery } from "@/components/site/ProductGallery";
import { PriceTag } from "@/components/ui/PriceTag";
import { RibbonDivider } from "@/components/ui/RibbonDivider";
import { Stamp } from "@/components/ui/Stamp";
import { getActiveProductSlugs, getProductBySlug, getRelatedProducts, getSettings } from "@/lib/catalog";
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
            <Link href={`/?kategori=${product.category.slug}#urunler`} className="hover:text-murekkep hover:underline">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <ProductGallery images={product.images} name={product.name} />

        <div className="relative md:pt-4">
          <div className="absolute -top-4 right-0 hidden sm:block">
            <Stamp />
          </div>
          <h1 className="pr-0 text-3xl sm:pr-24 sm:text-4xl">{product.name}</h1>
          <PriceTag
            size="lg"
            className="mt-5"
            priceKurus={product.priceKurus}
            compareAtPriceKurus={product.compareAtPriceKurus}
          />

          <div className="mt-8">
            <AddToCart productId={product.id} soldOut={soldOut} />
          </div>

          {askLink && (
            <a href={askLink} target="_blank" rel="noopener" className="btn btn-whatsapp mt-1">
              <WhatsAppIcon /> WhatsApp&apos;tan sor
            </a>
          )}

          {product.description && (
            <div className="mt-10">
              <h2 className="font-el text-2xl font-normal text-kiremit-koyu">Bu parça hakkında</h2>
              <div className="mt-2 max-w-prose whitespace-pre-line text-murekkep/90">{product.description}</div>
            </div>
          )}

          <p className="mt-8 border-l-4 border-hardal bg-kagit/70 px-4 py-3 text-[0.95rem]">
            Online ödeme yok. Sepetini WhatsApp&apos;tan gönderirsin; renk, ödeme ve kargoyu birlikte netleştiririz.
          </p>
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
    <div aria-hidden className="grid gap-10 pt-10 md:grid-cols-2 md:gap-14">
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
