"use client";

import { useEffect, useRef, useState } from "react";
import { Tape } from "@/components/ui/Tape";

/**
 * Hakkımızda sayfasındaki atölye videosu: bantlı kağıt çerçevede, sessiz ve döngüde. Yalnızca ekrana
 * girince oynar (mobilde boşuna indirilmesin); "hareketi azalt" açıksa kendiliğinden başlamaz.
 */
export function AtolyeVideo({ src, poster, label, caption }: { src: string; poster: string; label: string; caption: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const togglePlay = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  };

  return (
    <figure>
      <div className="kagit relative -rotate-[0.5deg] p-2.5 sm:p-3">
        <Tape color="hardal" rotate={-5} className="-top-3 left-10" />
        <Tape color="gul" rotate={6} className="-right-4 -bottom-2" />
        <div className="relative aspect-video overflow-hidden bg-krem-koyu">
          <video
            ref={ref}
            src={src}
            poster={poster}
            muted={muted}
            loop
            playsInline
            preload="none"
            aria-label={label}
            onClick={togglePlay}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="size-full cursor-pointer object-cover"
          />
          {!playing && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label="Videoyu oynat"
              className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full border-2 border-murekkep bg-kagit/95 shadow-baski transition-transform hover:scale-105"
            >
              <svg viewBox="0 0 24 24" className="ml-1 size-7 text-kiremit" fill="currentColor" aria-hidden>
                <path d="M7 4.5v15l12.5-7.5L7 4.5Z" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const v = ref.current;
              if (!v) return;
              v.muted = !muted;
              setMuted(!muted);
              if (v.paused) void v.play().catch(() => {});
            }}
            className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-murekkep/80 px-3 py-1.5 text-sm font-bold text-kagit hover:bg-murekkep"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5Z" fill="currentColor" />
              {muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M16 9a4 4 0 0 1 0 6m2.5-8.5a7.5 7.5 0 0 1 0 11" />}
            </svg>
            {muted ? "Sesi aç" : "Sesi kapat"}
          </button>
        </div>
      </div>
      <figcaption className="mt-3 text-center font-el text-xl text-murekkep-soluk">{caption}</figcaption>
    </figure>
  );
}
