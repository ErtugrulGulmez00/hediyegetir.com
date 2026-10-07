"use client";

import { useActionState, useTransition } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type CategoryState,
} from "../../actions";
import { inputClass } from "../ui";

function Message({ state }: { state: CategoryState }) {
  if (state.error) return <p role="alert" className="text-sm font-semibold text-kiremit-koyu">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm font-semibold text-zeytin">{state.ok}</p>;
  return null;
}

export function CategoryCreateForm() {
  const [state, action, pending] = useActionState<CategoryState, FormData>(createCategoryAction, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-1 flex-col gap-1 text-sm font-bold">
        Ad
        <input name="name" required className={inputClass} placeholder="Ör. Takı" />
      </label>
      <label className="flex w-24 flex-col gap-1 text-sm font-bold">
        Sıra
        <input name="sortOrder" type="number" min={0} max={999} defaultValue={0} className={inputClass} />
      </label>
      <button type="submit" className="btn btn-ana" disabled={pending}>
        Ekle
      </button>
      <div className="w-full">
        <Message state={state} />
      </div>
    </form>
  );
}

export function CategoryRow({
  category,
}: {
  category: { id: string; name: string; slug: string; sortOrder: number; count: number };
}) {
  const [state, action, pending] = useActionState<CategoryState, FormData>(
    updateCategoryAction.bind(null, category.id),
    {},
  );
  const [deleting, startDelete] = useTransition();
  return (
    <li className="py-3">
      <form action={action} className="flex flex-wrap items-center gap-3">
        <input name="name" defaultValue={category.name} aria-label="Kategori adı" className={`${inputClass} max-w-xs flex-1`} />
        <input name="sortOrder" type="number" min={0} max={999} defaultValue={category.sortOrder} aria-label="Sıra" className={`${inputClass} w-20`} />
        <span className="text-sm text-murekkep-soluk">
          /{category.slug} · {category.count} ürün
        </span>
        <button type="submit" className="btn btn-ikincil min-h-9 py-1" disabled={pending}>
          Kaydet
        </button>
        <button
          type="button"
          className="text-sm font-semibold text-kiremit-koyu hover:underline"
          disabled={deleting}
          onClick={() => {
            const note = category.count > 0 ? ` ${category.count} ürün kategorisiz kalacak.` : "";
            if (confirm(`"${category.name}" silinsin mi?${note}`)) startDelete(() => deleteCategoryAction(category.id));
          }}
        >
          Sil
        </button>
      </form>
      <Message state={state} />
    </li>
  );
}
