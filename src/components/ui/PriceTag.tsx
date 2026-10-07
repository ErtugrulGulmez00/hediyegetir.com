import { formatPrice } from "@/lib/money";

/** Delikli hediye etiketi biçiminde fiyat. */
export function PriceTag({
  priceKurus,
  compareAtPriceKurus,
  size = "md",
  className = "",
}: {
  priceKurus: number;
  compareAtPriceKurus?: number | null;
  size?: "md" | "lg";
  className?: string;
}) {
  const discounted = compareAtPriceKurus != null && compareAtPriceKurus > priceKurus;
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`relative inline-flex items-center bg-kraft font-baslik font-semibold text-murekkep ${
          size === "lg" ? "py-1.5 pr-4 pl-8 text-2xl" : "py-0.5 pr-3 pl-6 text-base"
        }`}
        style={{
          clipPath: size === "lg" ? "polygon(18px 0, 100% 0, 100% 100%, 18px 100%, 0 50%)" : "polygon(13px 0, 100% 0, 100% 100%, 13px 100%, 0 50%)",
        }}
      >
        <span
          aria-hidden
          className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-krem shadow-[inset_1px_1px_0_rgb(43_36_32/0.35)] ${
            size === "lg" ? "left-3 size-2.5" : "left-2 size-2"
          }`}
        />
        <span className="sr-only">Fiyat: </span>
        {formatPrice(priceKurus)}
      </span>
      {discounted && (
        <s className={`text-murekkep-soluk decoration-kiremit decoration-2 ${size === "lg" ? "text-lg" : "text-sm"}`}>
          <span className="sr-only">Eski fiyat: </span>
          {formatPrice(compareAtPriceKurus)}
        </s>
      )}
    </span>
  );
}
