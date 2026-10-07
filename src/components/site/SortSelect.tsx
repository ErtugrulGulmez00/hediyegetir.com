"use client";

import { useRouter } from "next/navigation";

export function SortSelect({
  value,
  options,
}: {
  value: string;
  options: { value: string; label: string; href: string }[];
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-[0.95rem]">
      <span className="font-el text-xl text-kiremit-koyu">Sırala</span>
      <select
        value={value}
        onChange={(e) => {
          const opt = options.find((o) => o.value === e.target.value);
          if (opt) router.push(opt.href, { scroll: false });
        }}
        className="min-h-10 rounded-md border-2 border-murekkep bg-kagit px-2 py-1 font-semibold shadow-baski-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
