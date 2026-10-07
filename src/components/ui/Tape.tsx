type TapeColor = "hardal" | "gul" | "zeytin" | "kraft";

const COLORS: Record<TapeColor, string> = {
  hardal: "rgb(217 164 65 / 0.72)",
  gul: "rgb(201 139 131 / 0.7)",
  zeytin: "rgb(107 115 68 / 0.55)",
  kraft: "rgb(217 195 160 / 0.85)",
};

/** Kağıda yapıştırılmış washi bant şeridi. Ebeveyn `relative` olmalı. */
export function Tape({
  color = "hardal",
  rotate = -4,
  className = "",
}: {
  color?: TapeColor;
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute z-10 block h-6 w-20 ${className}`}
      style={{
        rotate: `${rotate}deg`,
        backgroundColor: COLORS[color],
        backgroundImage:
          "repeating-linear-gradient(90deg, rgb(255 255 255 / 0.18) 0 6px, transparent 6px 12px)",
        // Elle koparılmış uçlar
        clipPath:
          "polygon(0 8%, 4% 0, 7% 10%, 10% 2%, 90% 0, 93% 9%, 96% 1%, 100% 10%, 100% 90%, 96% 100%, 93% 91%, 90% 99%, 10% 100%, 7% 92%, 4% 100%, 0 92%)",
      }}
    />
  );
}
