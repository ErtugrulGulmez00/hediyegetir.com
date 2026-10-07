/** Mürekkep damgası: "El yapımı" gibi kısa rozetler. */
export function Stamp({
  children = "El yapımı",
  className = "",
  rotate = -10,
}: {
  children?: React.ReactNode;
  className?: string;
  rotate?: number;
}) {
  return (
    <span
      className={`inline-flex size-20 items-center justify-center rounded-full border-2 border-kiremit-koyu p-1 text-center font-el text-lg leading-none text-kiremit-koyu ${className}`}
      style={{ rotate: `${rotate}deg` }}
    >
      <span className="flex size-full items-center justify-center rounded-full border border-dashed border-kiremit-koyu/70 px-1">
        {children}
      </span>
    </span>
  );
}
