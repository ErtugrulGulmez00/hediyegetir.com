"use client";

import { motion, useReducedMotion } from "motion/react";

export type MascotMood = "idle" | "talking" | "thinking" | "happy";

/** Hediş: yüzü olan, kapağı açılıp kapanan bir hediye kutusu. */
export function Mascot({
  mood = "idle",
  className = "",
  bumpKey,
  decorative = false,
}: {
  mood?: MascotMood;
  className?: string;
  bumpKey?: string | number;
  /** Yanında zaten "Hediş" yazıyorsa ekran okuyucuya ikinci kez okunmasın */
  decorative?: boolean;
}) {
  const reduce = useReducedMotion();

  const lid = reduce
    ? { rotate: mood === "happy" ? -24 : 0, y: mood === "happy" ? -8 : 0 }
    : mood === "thinking"
      ? { rotate: [0, -10, 0, -6, 0], y: [0, -9, 0, -5, 0] }
      : mood === "happy"
        ? { rotate: -26, y: -10, x: -3 }
        : { rotate: 0, y: 0, x: 0 };

  const lidTransition =
    mood === "thinking" && !reduce
      ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" as const }
      : { type: "spring" as const, stiffness: 260, damping: 14 };

  return (
    <motion.svg
      key={reduce ? undefined : bumpKey}
      viewBox="0 0 120 120"
      className={className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Hediş, hediye kutusu maskotu"}
      aria-hidden={decorative || undefined}
      initial={reduce || mood !== "talking" ? false : { y: 0 }}
      animate={reduce || mood !== "talking" ? undefined : { y: [0, -6, 0, -2, 0] }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      {/* gölge */}
      <ellipse cx="60" cy="112" rx="38" ry="4.5" fill="var(--color-murekkep)" opacity=".12" />

      {/* gövde */}
      <rect x="22" y="54" width="76" height="54" rx="3" fill="var(--color-kraft)" stroke="var(--color-murekkep)" strokeWidth="3" />
      <rect x="55" y="54" width="10" height="54" fill="var(--color-kiremit)" />
      <path d="M55 54v54M65 54v54" stroke="var(--color-murekkep)" strokeWidth="1.5" opacity=".35" />

      {/* yanaklar */}
      <circle cx="35" cy="89" r="5" fill="var(--color-gul)" opacity=".55" />
      <circle cx="85" cy="89" r="5" fill="var(--color-gul)" opacity=".55" />

      {/* gözler */}
      {mood === "happy" ? (
        <g stroke="var(--color-murekkep)" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M36 80q5-6 10 0" />
          <path d="M74 80q5-6 10 0" />
        </g>
      ) : (
        <g className={reduce ? undefined : "hedis-goz"} style={{ transformOrigin: "60px 79px", transformBox: "view-box" }}>
          <ellipse cx="41" cy={mood === "thinking" ? 76 : 79} rx="3.6" ry="4.6" fill="var(--color-murekkep)" />
          <ellipse cx="79" cy={mood === "thinking" ? 76 : 79} rx="3.6" ry="4.6" fill="var(--color-murekkep)" />
          <circle cx="42.3" cy={mood === "thinking" ? 74.4 : 77.4} r="1.2" fill="var(--color-kagit)" />
          <circle cx="80.3" cy={mood === "thinking" ? 74.4 : 77.4} r="1.2" fill="var(--color-kagit)" />
        </g>
      )}

      {/* ağız (kurdelenin üstünde) */}
      {mood === "thinking" ? (
        <path d="M54 95h12" stroke="var(--color-murekkep)" strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path
          d={mood === "happy" ? "M51 92q9 9 18 0" : "M53 93q7 5 14 0"}
          fill={mood === "happy" ? "var(--color-murekkep)" : "none"}
          stroke="var(--color-murekkep)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* kapak: sol alt köşeden menteşeli */}
      <motion.g
        style={{ transformOrigin: "16px 56px", transformBox: "view-box" }}
        initial={false}
        animate={lid}
        transition={lidTransition}
      >
        <rect x="16" y="41" width="88" height="15" rx="2.5" fill="var(--color-kraft)" stroke="var(--color-murekkep)" strokeWidth="3" />
        <rect x="55" y="41" width="10" height="15" fill="var(--color-kiremit)" />
        {/* fiyonk */}
        <g stroke="var(--color-murekkep)" strokeWidth="2.5" strokeLinejoin="round" fill="var(--color-kiremit)">
          <path d="M60 41c-6-11-20-15-22-8-2 6 10 9 22 8Z" />
          <path d="M60 41c6-11 20-15 22-8 2 6-10 9-22 8Z" />
          <circle cx="60" cy="40" r="4" />
        </g>
      </motion.g>

      {/* mutluyken kutudan yükselen küçük kalpler */}
      {mood === "happy" && !reduce && (
        <motion.g initial={{ opacity: 0, y: 6 }} animate={{ opacity: [0, 1, 0], y: [6, -10, -18] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.6 }}>
          <path d="M70 34c0-3 4-4 5-1 1-3 5-2 5 1 0 3-5 6-5 6s-5-3-5-6Z" fill="var(--color-kiremit)" />
          <path d="M46 30c0-2 3-3 3.6-.8.7-2.2 3.6-1.4 3.6.8 0 2.2-3.6 4.3-3.6 4.3S46 32.2 46 30Z" fill="var(--color-hardal)" />
        </motion.g>
      )}
    </motion.svg>
  );
}
