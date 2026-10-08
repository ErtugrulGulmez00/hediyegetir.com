import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageTitle, Panel } from "../ui";
import { CategoryCard, CategoryCreateForm } from "./CategoryForms";

export const metadata: Metadata = { title: "Kategoriler" };

export default async function CategoriesPage() {
  await requireAdmin();
  const [categories, activeCounts] = await Promise.all([
    db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { products: true } },
        products: {
          take: 4,
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          select: { id: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } } },
        },
      },
    }),
    db.product.groupBy({ by: ["categoryId"], where: { isActive: true }, _count: true }),
  ]);
  const active = new Map(activeCounts.map((r) => [r.categoryId, r._count]));

  return (
    <>
      <PageTitle>Kategoriler</PageTitle>
      <p className="-mt-3 mb-6 max-w-2xl text-murekkep-soluk">
        Mağazadaki raflar. Sıra numarası küçük olan önce görünür. Yayında ürünü olmayan kategori mağazada gösterilmez; silinen
        kategorinin ürünleri silinmez, kategorisiz kalır.
      </p>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <aside className="xl:sticky xl:top-6 xl:order-2">
          <Panel title="Yeni kategori">
            <CategoryCreateForm nextSortOrder={(categories.at(-1)?.sortOrder ?? 0) + 1} />
          </Panel>
        </aside>

        <section aria-label="Mevcut kategoriler" className="xl:order-1">
          {categories.length === 0 ? (
            <div className="kagit rounded-sm p-8 text-center">
              <p className="font-el text-2xl text-murekkep-soluk">Henüz kategori yok.</p>
              <p className="mt-1 text-sm text-murekkep-soluk">Sağdaki formdan ilk rafını ekleyebilirsin.</p>
            </div>
          ) : (
            <ul className="grid gap-5 lg:grid-cols-2">
              {categories.map((c) => (
                <CategoryCard
                  key={c.id}
                  category={{
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    sortOrder: c.sortOrder,
                    count: c._count.products,
                    activeCount: active.get(c.id) ?? 0,
                    thumbs: c.products.flatMap((p) => (p.images[0] ? [p.images[0].url] : [])),
                  }}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
