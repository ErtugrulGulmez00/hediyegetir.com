import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { Badge, Flash, inputClass, PageTitle } from "../ui";
import { aiConfigured } from "@/lib/ai/client";
import { ActiveToggle } from "./ActiveToggle";
import { EnrichButton } from "./EnrichButton";

export const metadata: Metadata = { title: "Ürünler" };

const FILTERS = {
  hepsi: { label: "Hepsi", where: {} },
  aktif: { label: "Yayında", where: { isActive: true } },
  pasif: { label: "Pasif", where: { isActive: false } },
  etiketsiz: { label: "Etiketi onaysız", where: { hedisReviewed: false } },
} satisfies Record<string, { label: string; where: Prisma.ProductWhereInput }>;
type FilterKey = keyof typeof FILTERS;

export default async function AdminProducts(props: PageProps<"/admin/urunler">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(sp.q).trim();
  const durum: FilterKey = one(sp.durum) in FILTERS ? (one(sp.durum) as FilterKey) : "hepsi";

  const missingAi = aiConfigured()
    ? await db.product.count({ where: { OR: [{ occasions: { isEmpty: true } }, { tags: { isEmpty: true } }, { features: { isEmpty: true } }] } })
    : 0;
  const products = await db.product.findMany({
    where: {
      ...FILTERS[durum].where,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    include: {
      category: { select: { name: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  });

  const href = (patch: { q?: string; durum?: string }) => {
    const params = new URLSearchParams();
    const nq = patch.q ?? q;
    const nd = patch.durum ?? durum;
    if (nq) params.set("q", nq);
    if (nd !== "hepsi") params.set("durum", nd);
    const s = params.toString();
    return s ? `/admin/urunler?${s}` : "/admin/urunler";
  };

  return (
    <>
      <PageTitle
        action={
          <Link href="/admin/urunler/yeni" className="btn btn-ana">
            + Yeni ürün
          </Link>
        }
      >
        Ürünler
      </PageTitle>
      {one(sp.silindi) && <Flash>Ürün silindi.</Flash>}
      <EnrichButton missing={missingAi} />

      <form className="mb-4 flex gap-2" role="search">
        <input type="search" name="q" defaultValue={q} placeholder="Ürün adıyla ara…" className={`${inputClass} max-w-sm`} />
        {durum !== "hepsi" && <input type="hidden" name="durum" value={durum} />}
        <button type="submit" className="btn btn-ikincil">
          Ara
        </button>
      </form>
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(FILTERS).map(([key, f]) => (
          <Link
            key={key}
            href={href({ durum: key })}
            aria-current={durum === key ? "true" : undefined}
            className={`rounded-sm border-2 border-murekkep px-3 py-1 text-sm font-semibold ${
              durum === key ? "bg-murekkep text-kagit" : "bg-kagit hover:bg-krem-koyu"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="font-el text-2xl text-murekkep-soluk">Bu filtrede ürün yok.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5" aria-label="Ürünler">
          {products.map((p) => (
            <li
              key={p.id}
              className={`kagit group relative flex flex-col overflow-hidden rounded-lg transition-transform hover:-translate-y-0.5 ${p.isActive ? "" : "opacity-75"}`}
            >
              <div className="relative aspect-[4/5] bg-krem-koyu">
                {p.images[0] ? (
                  <Image src={p.images[0].url} alt="" fill sizes="(min-width: 1536px) 16vw, (min-width: 1024px) 20vw, (min-width: 640px) 30vw, 50vw" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center font-el text-xl text-murekkep-soluk">fotoğraf yok</span>
                )}
                <div className="absolute inset-x-2 top-2 flex flex-wrap gap-1">
                  {p.isFeatured && <Badge tone="kiremit">öne çıkan</Badge>}
                  {!p.hedisReviewed && <Badge tone="hardal">etiket onaysız</Badge>}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                {/* Bağlantı bütün kartı kaplar; yayın anahtarı onun üstünde kalır */}
                <Link href={`/admin/urunler/${p.id}`} className="line-clamp-2 font-semibold leading-snug after:absolute after:inset-0 group-hover:underline">
                  {p.name}
                </Link>
                <p className="text-sm">
                  <span className="font-bold">{formatPrice(p.priceKurus)}</span>
                  {p.compareAtPriceKurus && <span className="ml-1.5 text-murekkep-soluk line-through">{formatPrice(p.compareAtPriceKurus)}</span>}
                </p>
                <p className="truncate text-xs text-murekkep-soluk">
                  {[p.category?.name ?? "Kategorisiz", p.stock == null ? "sipariş üzerine" : `stok ${p.stock}`].join(" · ")}
                </p>
                <div className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-2">
                  <ActiveToggle productId={p.id} active={p.isActive} />
                  <span aria-hidden className="pointer-events-none text-sm font-semibold text-murekkep-soluk group-hover:text-murekkep">
                    Düzenle →
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
