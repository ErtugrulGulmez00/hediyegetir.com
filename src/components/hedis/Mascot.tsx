"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export type MascotMood = "idle" | "talking" | "thinking" | "happy";

/** Robotun dört karesi (public/hedis): aralarında yumuşak geçişle değişir */
const FACES = ["idle", "wink", "thinking", "celebrate"] as const;
type Face = (typeof FACES)[number];

/** Zengin modda sağ alttaki durum rozeti */
const BADGE: Record<Face, string> = { idle: "✨", wink: "😉", thinking: "⚙️", celebrate: "🎁" };

/**
 * Hediş: elinde hediye kutusu tutan sevimli robot. Parlak çerçeveli dairede havada süzülür, ara ara göz kırpar;
 * düşünürken etrafında halka döner ve üstünden tarama ışığı geçer; öneri bulunca kutuyu açıp zıplar, kalpler uçuşur.
 * `rich` (büyük karşılama robotu): anten ışığı, durum rozeti ve fareyle 3B eğilme de eklenir.
 * Hareket azaltma tercihinde yalnızca kare değişir.
 */
export function Mascot({
  mood = "idle",
  className = "",
  bumpKey,
  decorative = false,
  rich = false,
}: {
  mood?: MascotMood;
  className?: string;
  /** Değişince robot küçük bir "konuşma" sıçraması yapar (yeni mesaj) */
  bumpKey?: string | number;
  /** Yanında zaten "Hediş" yazıyorsa ekran okuyucuya ikinci kez okunmasın */
  decorative?: boolean;
  /** Büyük gösterim: anten ışığı, durum rozeti, fareyle eğilme */
  rich?: boolean;
}) {
  const reduce = useReducedMotion();
  const tiltRef = useRef<HTMLSpanElement>(null);
  // İlk görünüşte göz kırparak karşılar
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setBlink(false), 1400);
    return () => clearTimeout(id);
  }, []);

  // Doğal göz kırpma: normal hâldeyken 3,5–6,5 saniyede bir
  useEffect(() => {
    if (reduce || mood === "thinking" || mood === "happy") return;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(() => {
        setBlink(true);
        timer = setTimeout(() => {
          setBlink(false);
          next();
        }, 380);
      }, 3500 + Math.random() * 3000);
    };
    next();
    return () => clearTimeout(timer);
  }, [mood, reduce]);

  const face: Face = mood === "thinking" ? "thinking" : mood === "happy" ? "celebrate" : blink ? "wink" : "idle";
  const tilt = rich && !reduce;

  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Hediş, hediye asistanı robot"}
      aria-hidden={decorative || undefined}
      data-durum={mood}
      className={`hedis-robot relative inline-block shrink-0 ${className}`}
      // Fareyle üstüne gelince robot imlecin yönüne hafifçe döner (yeniden çizim olmadan)
      onMouseMove={
        tilt
          ? (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - r.left) / r.width - 0.5;
              const y = (e.clientY - r.top) / r.height - 0.5;
              if (tiltRef.current) tiltRef.current.style.transform = `perspective(800px) rotateX(${(-y * 20).toFixed(1)}deg) rotateY(${(x * 20).toFixed(1)}deg) scale(1.04)`;
            }
          : undefined
      }
      onMouseLeave={tilt ? () => tiltRef.current && (tiltRef.current.style.transform = "") : undefined}
    >
      <span aria-hidden className="hedis-robot-aura" />
      <span aria-hidden className="hedis-robot-halka" />
      {/* bumpKey değişince bu katman yeniden kurulur ve konuşma sıçraması bir kez oynar */}
      <span key={reduce ? undefined : bumpKey} className={`absolute inset-0 ${mood === "talking" ? "hedis-robot-konus" : ""}`}>
        <span ref={tiltRef} className="absolute inset-0 transition-transform duration-200 ease-out">
          <span className="hedis-robot-govde">
            <span className="relative block size-full overflow-hidden rounded-full">
              {FACES.map((f) => (
                <Image
                  key={f}
                  src={`/hedis/${f}.webp`}
                  alt=""
                  fill
                  sizes={rich ? "192px" : "128px"}
                  draggable={false}
                  className={`object-cover transition-[opacity,scale] duration-300 ${f === face ? "scale-100 opacity-100" : "scale-[0.97] opacity-0"}`}
                />
              ))}
              <span aria-hidden className="hedis-robot-tarama" />
            </span>
          </span>
        </span>
      </span>
      {rich && (
        <>
          <span aria-hidden className="hedis-robot-anten" />
          <span aria-hidden className="hedis-robot-rozet">
            {BADGE[face]}
          </span>
        </>
      )}
      {mood === "happy" && !reduce && (
        <span aria-hidden className="pointer-events-none absolute inset-0">
          {["left-[8%] text-[#f472b6]", "left-[46%] text-[#fbbf24] [animation-delay:.35s]", "right-[6%] text-[#9b72cf] [animation-delay:.7s]"].map((pos) => (
            <svg key={pos} viewBox="0 0 24 24" className={`hedis-robot-kalp absolute top-[18%] w-[18%] ${pos}`} fill="currentColor">
              <path d="M12 21s-7.5-4.6-7.5-10.2C4.5 7.6 6.9 5.5 9.4 5.5c1.3 0 2.2.6 2.6 1.4.4-.8 1.3-1.4 2.6-1.4 2.5 0 4.9 2.1 4.9 5.3C19.5 16.4 12 21 12 21Z" />
            </svg>
          ))}
        </span>
      )}
    </span>
  );
}
