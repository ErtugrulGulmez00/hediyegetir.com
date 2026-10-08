import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShopContent, ShopSkeleton } from "@/components/site/ShopSection";
import { Scribble } from "@/components/ui/Scribble";
import { getCategories, getCategoryBySlug } from "@/lib/catalog";
import { ORDER_INFO } from "@/lib/site";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/kategori/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Kategori bulunamadı" };
  const lower = category.name.toLocaleLowerCase("tr-TR");
  return {
    title: `El yapımı ${lower}`,
    description: `Elde, istediğin renkte örülen ${lower} modelleri. ${ORDER_INFO.leadTimeDays} iş gününde kargoda; sipariş WhatsApp'tan.`,
    alternates: { canonical: `/kategori/${category.slug}` },
  };
}

export default function CategoryPage(props: PageProps<"/kategori/[slug]">) {
  return (
    <div className="sayfa pt-4">
      <Suspense fallback={<CategorySkeleton />}>
        <CategoryContent params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function CategoryContent({ params, searchParams }: Pick<PageProps<"/kategori/[slug]">, "params" | "searchParams">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <>
      <nav aria-label="Sayfa yolu" className="mb-4 text-sm text-murekkep-soluk">
        <Link href="/" className="hover:text-murekkep hover:underline">
          Mağaza
        </Link>
        <span aria-hidden className="mx-2">
          /
        </span>
        <span aria-current="page">{category.name}</span>
      </nav>
      <h1 className="text-4xl sm:text-5xl">
        <Scribble>{category.name}</Scribble>
      </h1>
      <p className="mt-3 font-el text-2xl text-murekkep-soluk">elde, istediğin renkte örülür</p>
      <ShopContent searchParams={searchParams} category={category.slug} />
    </>
  );
}

function CategorySkeleton() {
  return (
    <div aria-hidden>
      <div className="h-5 w-40 bg-krem-koyu" />
      <div className="mt-4 h-12 w-56 bg-krem-koyu" />
      <ShopSkeleton />
    </div>
  );
}
