"use client";

import { confirmDialog } from "@/store/confirm";
import Image from "next/image";
import { useActionState, useTransition } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type CategoryState,
} from "../../actions";
import { Badge, inputBase, inputClass } from "../ui";

function Message({ state }: { state: CategoryState }) {
  if (state.error) return <p role="alert" className="text-sm font-semibold text-kiremit-koyu">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm font-semibold text-zeytin">{state.ok}</p>;
  return null;
}

export function CategoryCreateForm({ nextSortOrder }: { nextSortOrder: number }) {
  const [state, action, pending] = useActionState<CategoryState, FormData>(createCategoryAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-bold">
          Ad
          <input name="name" required className={inputClass} placeholder="Ör. Takı" />
        </label>
        <label className="flex w-20 shrink-0 flex-col gap-1 text-sm font-bold">
          Sıra
          <input
            name="sortOrder"
            type="number"
            min={0}
            max={999}
            defaultValue={nextSortOrder}
            className={`${inputBase} w-full text-center`}
          />
        </label>
      </div>
      <button type="submit" className="btn btn-ana" disabled={pending}>
        {pending ? "Ekleniyor…" : "+ Kategori ekle"}
      </button>
      <Message state={state} />
    </form>
  );
}

type CardData = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  count: number;
  activeCount: number;
  thumbs: string[];
};

export function CategoryCard({ category }: { category: CardData }) {
  const [state, action, pending] = useActionState<CategoryState, FormData>(
    updateCategoryAction.bind(null, category.id),
    {},
  );
  const [deleting, startDelete] = useTransition();
  const hidden = category.activeCount === 0;

  return (
    <li className={`kagit flex flex-col gap-4 rounded-sm p-5 transition-opacity ${deleting ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        {category.thumbs.length > 0 ? (
          <div className="flex items-center">
            {category.thumbs.map((url, i) => (
              <span
                key={url}
                className="relative -ml-2 size-12 overflow-hidden rounded-sm border-2 border-kagit bg-krem-koyu shadow-kagit first:ml-0"
                style={{ rotate: `${[-4, 3, -2, 4][i % 4]}deg` }}
              >
                <Image src={url} alt="" fill sizes="48px" className="object-cover" />
              </span>
            ))}
            {category.count > category.thumbs.length && (
              <span className="ml-2 text-sm font-semibold text-murekkep-soluk">+{category.count - category.thumbs.length}</span>
            )}
          </div>
        ) : (
          <span className="flex h-12 items-center rounded-sm border-2 border-dashed border-kraft-koyu px-3 font-el text-lg text-murekkep-soluk">
            bu raf boş
          </span>
        )}
        {hidden ? (
          <Badge tone="hardal">mağazada gizli</Badge>
        ) : (
          <a
            href={`/kategori/${category.slug}`}
            target="_blank"
            rel="noopener"
            className="text-sm font-semibold text-murekkep-soluk underline-offset-2 hover:text-murekkep hover:underline"
          >
            Sitede gör ↗
          </a>
        )}
      </div>

      <form action={action} className="flex flex-col gap-3">
        <div className="flex items-end gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-bold">
            Ad
            <input name="name" defaultValue={category.name} required className={inputClass} />
          </label>
          <label className="flex w-20 shrink-0 flex-col gap-1 text-sm font-bold">
            Sıra
            <input
              name="sortOrder"
              type="number"
              min={0}
              max={999}
              defaultValue={category.sortOrder}
              className={`${inputBase} w-full text-center`}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-kraft pt-3">
          <p className="text-sm text-murekkep-soluk">
            <span className="font-mono">/{category.slug}</span> · {category.count} ürün
            {category.count > 0 && ` · ${category.activeCount} yayında`}
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-sm font-semibold text-kiremit-koyu underline-offset-2 hover:underline"
              disabled={deleting}
              onClick={async () => {
                const ok = await confirmDialog({
                  title: `"${category.name}" silinsin mi?`,
                  message: category.count > 0 ? `${category.count} ürün kategorisiz kalacak.` : undefined,
                  confirmLabel: "Evet, sil",
                  danger: true,
                });
                if (ok) startDelete(() => deleteCategoryAction(category.id));
              }}
            >
              Sil
            </button>
            <button type="submit" className="btn btn-ikincil min-h-9 py-1" disabled={pending}>
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </div>
        <Message state={state} />
      </form>
    </li>
  );
}
