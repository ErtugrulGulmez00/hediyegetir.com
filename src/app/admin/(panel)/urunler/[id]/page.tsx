import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { aiConfigured } from "@/lib/ai/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Flash } from "../../ui";
import { ProductForm, type ProductFormInitial } from "../ProductForm";

export const metadata: Metadata = { title: "Ürünü düzenle" };

/** Kuruşu formdaki düz yazıya çevirir: 125050 -> "1250,50", 125000 -> "1250" */
const kurusToInput = (k: number | null) =>
  k == null ? "" : k % 100 === 0 ? String(k / 100) : (k / 100).toFixed(2).replace(".", ",");

export default async function EditProductPage(props: PageProps<"/admin/urunler/[id]">) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  const initial: ProductFormInitial = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: kurusToInput(product.priceKurus),
    compareAtPrice: kurusToInput(product.compareAtPriceKurus),
    stock: product.stock == null ? "" : String(product.stock),
    categoryId: product.categoryId ?? "",
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    recipients: product.recipients,
    gender: product.gender,
    hobbies: product.hobbies,
    hedisReviewed: product.hedisReviewed,
    occasions: product.occasions,
    tags: product.tags,
    features: product.features,
    images: product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, isBlob: i.isBlob })),
    galleryLayout: product.galleryLayout,
    stamps: product.stamps,
  };

  return (
    <>
      {sp.kaydedildi && <Flash>Kaydedildi. Değişiklikler sitede hemen görünür.</Flash>}
      {/* key: kayıttan sonra form sunucudaki güncel değerlerle yeniden kurulsun */}
      <ProductForm
        key={product.updatedAt.toISOString()}
        initial={initial}
        categories={categories}
        blobEnabled={!!process.env.BLOB_READ_WRITE_TOKEN}
        aiEnabled={aiConfigured()}
      />
    </>
  );
}
