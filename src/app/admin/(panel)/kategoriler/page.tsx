import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageTitle, Panel } from "../ui";
import { CategoryCreateForm, CategoryRow } from "./CategoryForms";

export const metadata: Metadata = { title: "Kategoriler" };

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <>
      <PageTitle>Kategoriler</PageTitle>
      <Panel title="Yeni kategori" className="mb-6">
        <CategoryCreateForm />
      </Panel>
      <Panel>
        <p className="mb-3 text-sm text-murekkep-soluk">
          Sıra numarası küçük olan mağazada önce görünür. Silinen kategorinin ürünleri kategorisiz kalır, silinmez.
        </p>
        {categories.length === 0 ? (
          <p className="font-el text-xl text-murekkep-soluk">Henüz kategori yok.</p>
        ) : (
          <ul className="divide-y divide-kraft">
            {categories.map((c) => (
              <CategoryRow key={c.id} category={{ id: c.id, name: c.name, slug: c.slug, sortOrder: c.sortOrder, count: c._count.products }} />
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
