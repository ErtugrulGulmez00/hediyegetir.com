import { Tape } from "./Tape";

/** Bantla tutturulmuş not kağıdı (Hediş mesajları, bilgilendirme kutuları). */
export function NotePaper({
  children,
  className = "",
  tilt = -0.6,
  tape = "gul",
  lined = false,
}: {
  children: React.ReactNode;
  className?: string;
  tilt?: number;
  tape?: "hardal" | "gul" | "zeytin" | "kraft" | null;
  lined?: boolean;
}) {
  return (
    <div
      className={`kagit relative px-5 pt-6 pb-5 ${className}`}
      style={{
        rotate: `${tilt}deg`,
        backgroundImage: lined
          ? "repeating-linear-gradient(transparent 0 27px, rgb(181 82 59 / 0.13) 27px 28px)"
          : undefined,
        backgroundPositionY: lined ? "14px" : undefined,
      }}
    >
      {tape && <Tape color={tape} rotate={-3} className="-top-3 left-6" />}
      {children}
    </div>
  );
}
