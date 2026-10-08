import type { Metadata } from "next";
import { aiConfigured } from "@/lib/ai/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_STAMPS } from "@/lib/product-display";
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
          occasions: [],
          tags: [],
          features: [],
          images: [],
          galleryLayout: "TEK",
          stamps: DEFAULT_STAMPS,
        }}
        categories={categories}
        blobEnabled={!!process.env.BLOB_READ_WRITE_TOKEN}
        aiEnabled={aiConfigured()}
      />
    </>
  );
}
