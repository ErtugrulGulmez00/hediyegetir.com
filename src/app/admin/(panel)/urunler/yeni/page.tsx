import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageTitle } from "../../ui";
import { ProductForm } from "../ProductForm";

export const metadata: Metadata = { title: "Yeni ürün" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <>
      <Link href="/admin/urunler" className="text-sm text-murekkep-soluk hover:underline">
        ← Ürünler
      </Link>
      <PageTitle>Yeni ürün</PageTitle>
      <ProductForm
        initial={{
          id: null,
          name: "",
          slug: "",
          description: "",
          price: "",
          compareAtPrice: "",
          stock: "",
          categoryId: "",
          isActive: true,
          isFeatured: false,
          recipients: [],
          gender: "UNISEX",
          hobbies: [],
          hedisReviewed: true,
          images: [],
          source: "MANUAL",
          lockedFields: [],
          ikasUrl: null,
        }}
        categories={categories}
        blobEnabled={!!process.env.BLOB_READ_WRITE_TOKEN}
      />
    </>
  );
}
