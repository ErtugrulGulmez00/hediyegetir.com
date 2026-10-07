import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { Badge, Flash, inputClass, PageTitle } from "../ui";
import { ActiveToggle } from "./ActiveToggle";

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
        <ul className="kagit divide-y divide-kraft rounded-sm">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-4 py-3">
              <div className="relative size-14 shrink-0 overflow-hidden bg-krem-koyu">
                {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/urunler/${p.id}`} className="font-semibold hover:underline">
                  {p.name}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-murekkep-soluk">
                  <span>{formatPrice(p.priceKurus)}</span>
                  {p.category && <span>· {p.category.name}</span>}
                  <span>· {p.stock == null ? "sipariş üzerine" : `stok ${p.stock}`}</span>
                  {!p.hedisReviewed && <Badge tone="hardal">etiket onaysız</Badge>}
                </div>
              </div>
              <ActiveToggle productId={p.id} active={p.isActive} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
