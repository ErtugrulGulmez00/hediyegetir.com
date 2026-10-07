"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CartProduct } from "@/app/api/sepet/urunler/route";
import { HedisOpenButton } from "@/components/hedis/HedisDialog";
import { QtyStepper } from "@/components/site/AddToCart";
import { NotePaper } from "@/components/ui/NotePaper";
import { Tape } from "@/components/ui/Tape";
import { formatPrice } from "@/lib/money";
import { buildCartMessage, cartSubtotal, waLink, type WaLine } from "@/lib/whatsapp";
import { useCart, useCartHydrated } from "@/store/cart";

type Fetched = { key: string; products: Map<string, CartProduct>; error: boolean };

export function CartView({
  whatsappNumber,
  greeting,
  siteUrl,
}: {
  whatsappNumber: string;
  greeting: string;
  siteUrl: string;
}) {
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);
  const { setQty, remove, keepOnly } = useCart.getState();
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const [droppedNames, setDroppedNames] = useState(0);

  const idsKey = useMemo(() => [...new Set(lines.map((l) => l.productId))].sort().join(","), [lines]);
  // Yalnızca bilgisi henüz çekilmemiş bir ürün varsa istek at (adet değişimi / çıkarma istek atmasın)
  const needsFetch = !fetched || lines.some((l) => !fetched.products.has(l.productId));
  const failedForThisCart = !!fetched?.error && fetched.key === idsKey;

  useEffect(() => {
    if (!hydrated || !idsKey || !needsFetch || failedForThisCart) return;
    const ids = idsKey.split(",");
    let cancelled = false;
    fetch("/api/sepet/urunler", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(({ products }: { products: CartProduct[] }) => {
        if (cancelled) return;
        const map = new Map(products.map((p) => [p.id, p]));
        const missing = ids.filter((id) => !map.has(id));
        if (missing.length > 0) {
          setDroppedNames((n) => n + missing.length);
          keepOnly(products.map((p) => p.id));
        }
        setFetched({ key: idsKey, products: map, error: false });
      })
      .catch(() => {
        if (!cancelled) setFetched({ key: idsKey, products: new Map(), error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, idsKey, needsFetch, failedForThisCart, keepOnly]);

  if (!hydrated || (lines.length > 0 && needsFetch && !failedForThisCart)) {
    return <CartSkeleton />;
  }

  if (lines.length === 0) {
    return (
      <>
        {droppedNames > 0 && <DroppedNotice count={droppedNames} />}
        <NotePaper className="mt-10 max-w-md" lined tilt={-0.8}>
          <p className="font-el text-2xl">Sepetin şimdilik boş.</p>
          <p className="mt-2">Ne alacağını bilmiyorsan Hediş yardım etsin, ya da rafları kendin gez.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <HedisOpenButton className="btn btn-ana">Hediş&apos;e sor</HedisOpenButton>
            <Link href="/" className="btn btn-ikincil">
              Mağazaya git
            </Link>
          </div>
        </NotePaper>
      </>
    );
  }

  if (failedForThisCart) {
    return (
      <NotePaper className="mt-10 max-w-md" tape="kraft">
        <p className="font-el text-2xl">Ürün bilgilerini şu an getiremedik.</p>
        <p className="mt-2">Bağlantını kontrol edip sayfayı yenilemeyi dener misin?</p>
      </NotePaper>
    );
  }

  const products = fetched!.products;
  const rows = lines.flatMap((l) => {
    const p = products.get(l.productId);
    return p ? [{ line: l, product: p }] : [];
  });
  const orderable = rows.filter((r) => r.product.stock !== 0);
  const soldOutCount = rows.length - orderable.length;
  const waLines: WaLine[] = orderable.map(({ line, product }) => ({
    name: product.name,
    qty: line.qty,
    unitPriceKurus: product.priceKurus,
    url: `${siteUrl}/urun/${product.slug}`,
  }));
  const subtotal = cartSubtotal(waLines);
  const href = whatsappNumber && waLines.length > 0 ? waLink(whatsappNumber, buildCartMessage(greeting, waLines)) : null;

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div>
        {droppedNames > 0 && <DroppedNotice count={droppedNames} />}
        <ul className="divide-y-2 divide-dashed divide-kraft-koyu border-y-2 border-dashed border-kraft-koyu">
          {rows.map(({ line, product }) => {
            const soldOut = product.stock === 0;
            return (
              <li key={product.id} className="flex gap-4 py-5">
                <Link href={`/urun/${product.slug}`} className="kagit relative block size-24 shrink-0 p-1 sm:size-28">
                  <span className="relative block size-full overflow-hidden bg-krem-koyu">
                    {product.image && (
                      <Image src={product.image.url} alt={product.image.alt || product.name} fill sizes="112px" className="object-cover" />
                    )}
                  </span>
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/urun/${product.slug}`} className="font-baslik text-lg leading-snug hover:text-kiremit-koyu">
                      {product.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(product.id)}
                      className="shrink-0 px-1 text-sm text-murekkep-soluk underline-offset-2 hover:text-kiremit-koyu hover:underline"
                      aria-label={`${product.name} ürününü sepetten çıkar`}
                    >
                      Çıkar
                    </button>
                  </div>
                  <p className="text-sm text-murekkep-soluk">Birim fiyat: {formatPrice(product.priceKurus)}</p>
                  {soldOut ? (
                    <p className="font-el text-xl text-kiremit-koyu">şu an tükendi, mesaja eklenmeyecek</p>
                  ) : (
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                      <QtyStepper
                        value={line.qty}
                        onChange={(n) => setQty(product.id, n)}
                        label={`${product.name} adedi`}
                      />
                      <span className="font-baslik text-lg font-semibold">
                        {formatPrice(line.qty * product.priceKurus)}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/" className="link-el mt-6 inline-block font-semibold">
          ← Alışverişe devam et
        </Link>
      </div>

      <aside aria-label="Sipariş özeti" className="kagit relative rotate-[0.6deg] px-5 pt-7 pb-6 lg:sticky lg:top-6">
        <Tape color="zeytin" rotate={3} className="-top-3 left-1/2 -translate-x-1/2" />
        <p className="font-el text-2xl text-kiremit-koyu">fiş</p>
        <dl className="mt-2 flex items-baseline justify-between border-b-2 border-dashed border-kraft-koyu pb-3">
          <dt>Ara toplam</dt>
          <dd className="font-baslik text-2xl font-semibold" aria-live="polite">
            {formatPrice(subtotal)}
          </dd>
        </dl>
        <p className="mt-3 text-[0.95rem] text-murekkep-soluk">
          Ödeme ve kargo detaylarını WhatsApp&apos;tan netleştiriyoruz. Butona basınca sepetin hazır bir mesaj olarak açılır,
          sen sadece gönderirsin.
        </p>
        {soldOutCount > 0 && (
          <p className="mt-3 text-sm text-kiremit-koyu">{soldOutCount} tükenmiş ürün mesaja eklenmeyecek.</p>
        )}
        {href ? (
          <a href={href} target="_blank" rel="noopener" className="btn btn-whatsapp mt-5 w-full">
            WhatsApp ile bilgi al
          </a>
        ) : (
          <p className="mt-5 text-sm text-kiremit-koyu">
            {waLines.length === 0
              ? "Sepetinde gönderilebilecek ürün yok."
              : "WhatsApp hattımız şu an ayarlanıyor; birazdan tekrar dener misin?"}
          </p>
        )}
      </aside>
    </div>
  );
}

function DroppedNotice({ count }: { count: number }) {
  return (
    <p role="status" className="mb-5 border-l-4 border-kiremit bg-kagit px-4 py-3 text-[0.95rem]">
      {count === 1 ? "Bir ürün" : `${count} ürün`} artık satışta olmadığı için sepetinden çıkarıldı.
    </p>
  );
}

function CartSkeleton() {
  return (
    <div aria-hidden className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-5 border-y-2 border-dashed border-kraft-koyu py-5">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="size-28 animate-pulse bg-krem-koyu" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-2/3 bg-krem-koyu" />
              <div className="h-4 w-1/3 bg-krem-koyu" />
            </div>
          </div>
        ))}
      </div>
      <div className="kagit h-56" />
    </div>
  );
}
