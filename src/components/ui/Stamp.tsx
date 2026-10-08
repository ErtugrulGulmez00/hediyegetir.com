/** Mürekkep damgası: "El yapımı" gibi kısa rozetler. Uzun yazıda yazı küçülür, damga biraz büyür. */
export function Stamp({
  children = "El yapımı",
  className = "",
  rotate = -10,
}: {
  children?: React.ReactNode;
  className?: string;
  rotate?: number;
}) {
  const length = typeof children === "string" ? children.length : 0;
  const size = length > 14 ? "size-24 text-base" : length > 10 ? "size-[5.5rem] text-[1.05rem]" : "size-20 text-lg";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border-2 border-kiremit-koyu p-1 text-center font-el leading-none break-words text-kiremit-koyu ${size} ${className}`}
      style={{ rotate: `${rotate}deg` }}
    >
      <span className="flex size-full items-center justify-center rounded-full border border-dashed border-kiremit-koyu/70 px-1.5">
        {children}
      </span>
    </span>
  );
}
