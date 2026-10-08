"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Tape } from "@/components/ui/Tape";

type Img = { id: string; url: string; alt: string };

/** Parmakla kaydırılan, fotoğrafların tek tek oturduğu şerit (kaydırma çubuğu gizli) */
const track = "flex snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const clamp = (i: number, n: number) => Math.max(0, Math.min(n - 1, i));

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const many = images.length > 1;

  // Parmakla kaydırınca etkin fotoğraf (ve küçük resim) güncellenir
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !many) return;
    const onScroll = () => setActive(clamp(Math.round(el.scrollLeft / el.clientWidth), images.length));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [many, images.length]);

  const goTo = (i: number, smooth = true) => {
    const next = clamp(i, images.length);
    const el = trackRef.current;
    el?.scrollTo({ left: next * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
    setActive(next);
  };

  return (
    <div>
      <div className="kagit relative -rotate-[0.6deg] p-2.5">
        <Tape color="hardal" rotate={-6} className="-top-3 left-8 z-10" />
        <Tape color="gul" rotate={8} className="-right-4 -bottom-2 z-10" />
        <div className="relative aspect-[4/5] overflow-hidden bg-krem-koyu">
          {images.length === 0 ? (
            <span className="absolute inset-0 flex items-center justify-center font-el text-2xl text-murekkep-soluk">
              fotoğraf yolda
            </span>
          ) : (
            <div ref={trackRef} className={`${track} absolute inset-0 overflow-x-auto`}>
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setViewerOpen(true)}
                  aria-label={`${i + 1}. fotoğrafı büyüt`}
                  className="relative h-full w-full shrink-0 cursor-zoom-in snap-center"
                >
                  <Image
                    src={img.url}
                    alt={img.alt || name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                  />
                </button>
              ))}
            </div>
          )}
          {images.length > 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-2 left-2 flex size-9 items-center justify-center rounded-full bg-kagit/90 text-murekkep shadow-baski-sm"
            >
              <ZoomIcon />
            </span>
          )}
          {many && (
            <>
              <SlideArrow side="left" disabled={active === 0} onClick={() => goTo(active - 1)} className="hidden md:flex" />
              <SlideArrow side="right" disabled={active === images.length - 1} onClick={() => goTo(active + 1)} className="hidden md:flex" />
              <span className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-murekkep/75 px-2.5 py-0.5 text-xs font-bold text-kagit">
                {active + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      </div>
      {many && (
        <ul className="mt-5 flex gap-3 overflow-x-auto pb-1" aria-label="Diğer fotoğraflar">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${i + 1}. fotoğrafı göster`}
                aria-pressed={i === active}
                className={`relative block size-20 overflow-hidden border-2 bg-kagit p-0.5 transition-transform ${
                  i === active ? "border-murekkep shadow-baski-sm" : "border-transparent opacity-75 hover:opacity-100"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {viewerOpen && (
        <ImageViewer
          images={images}
          name={name}
          start={active}
          onClose={(last) => {
            setViewerOpen(false);
            goTo(last, false);
          }}
        />
      )}
    </div>
  );
}

/**
 * Tam ekran fotoğraf görüntüleyici. Kaydırarak ya da oklarla geçilir; fotoğrafa tıklayınca/dokununca
 * 2 kat büyür. Büyükken masaüstünde fareyle, mobilde parmakla gezilir. Esc kapatır.
 */
function ImageViewer({
  images,
  name,
  start,
  onClose,
}: {
  images: Img[];
  name: string;
  start: number;
  onClose: (lastIndex: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const indexRef = useRef(start);

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
    // Açılışta seçili fotoğrafa animasyonsuz git
    const el = trackRef.current;
    if (el) el.scrollLeft = start * el.clientWidth;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, [start]);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = clamp(Math.round(el.scrollLeft / el.clientWidth), images.length);
    if (i !== indexRef.current) {
      indexRef.current = i;
      setIndex(i);
      setZoomed(false);
    }
  };

  const go = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    setZoomed(false);
    el.scrollTo({ left: clamp(i, images.length) * el.clientWidth, behavior: "smooth" });
  };

  // Büyütürken tıklanan noktayı ortala; büyükken fare hareketiyle gez
  const panTo = (box: HTMLElement, clientX: number, clientY: number) => {
    const r = box.getBoundingClientRect();
    box.scrollLeft = ((clientX - r.left) / r.width) * (box.scrollWidth - box.clientWidth);
    box.scrollTop = ((clientY - r.top) / r.height) * (box.scrollHeight - box.clientHeight);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={`${name} fotoğrafları`}
      onClose={() => onClose(indexRef.current)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(indexRef.current - 1);
        if (e.key === "ArrowRight") go(indexRef.current + 1);
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none border-0 bg-murekkep p-0 text-kagit backdrop:bg-murekkep"
    >
      <div className="relative h-full w-full">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className={`${track} h-full w-full ${zoomed ? "overflow-x-hidden" : "overflow-x-auto"}`}
        >
          {images.map((img, i) => {
            const isZoomed = zoomed && i === index;
            return (
              <div key={img.id} className="relative h-full w-full shrink-0 snap-center">
                <div
                  className={`absolute inset-0 overscroll-contain ${isZoomed ? "cursor-zoom-out overflow-auto" : "cursor-zoom-in overflow-hidden"}`}
                  onClick={(e) => {
                    if (i !== index) return;
                    const box = e.currentTarget;
                    const { clientX, clientY } = e;
                    setZoomed((z) => !z);
                    if (!isZoomed) requestAnimationFrame(() => panTo(box, clientX, clientY));
                  }}
                  onMouseMove={isZoomed ? (e) => panTo(e.currentTarget, e.clientX, e.clientY) : undefined}
                >
                  <div className={`relative ${isZoomed ? "h-[200%] w-[200%]" : "h-full w-full"}`}>
                    <Image
                      src={img.url}
                      alt={img.alt || name}
                      fill
                      sizes={isZoomed ? "200vw" : "100vw"}
                      className="object-contain"
                      loading={Math.abs(i - start) <= 1 ? "eager" : "lazy"}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-3 sm:p-4">
          <span className="rounded-full bg-murekkep/70 px-3 py-1 text-sm font-bold">
            {index + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="pointer-events-auto rounded-md border-2 border-kagit bg-murekkep/70 px-3 py-1.5 text-sm font-bold hover:bg-murekkep"
          >
            Kapat <span aria-hidden>✕</span>
          </button>
        </div>
        {images.length > 1 && !zoomed && (
          <>
            <SlideArrow side="left" disabled={index === 0} onClick={() => go(index - 1)} className="flex" dark />
            <SlideArrow side="right" disabled={index === images.length - 1} onClick={() => go(index + 1)} className="flex" dark />
          </>
        )}
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-kagit/80">
          {zoomed ? "Gezmek için kaydır · küçültmek için dokun" : "Büyütmek için fotoğrafa dokun"}
        </p>
      </div>
    </dialog>
  );
}

function SlideArrow({
  side,
  disabled,
  onClick,
  className = "",
  dark = false,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
  className?: string;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Önceki fotoğraf" : "Sonraki fotoğraf"}
      className={`absolute top-1/2 size-10 -translate-y-1/2 items-center justify-center rounded-full border-2 transition-opacity disabled:opacity-0 ${
        dark ? "border-kagit bg-murekkep/70 text-kagit" : "border-murekkep bg-kagit/90 text-murekkep shadow-baski-sm"
      } ${side === "left" ? "left-2 sm:left-3" : "right-2 sm:right-3"} ${className}`}
    >
      <svg viewBox="0 0 16 16" className={`size-4 ${side === "left" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="m6 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function ZoomIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5M10.5 8v5M8 10.5h5" />
    </svg>
  );
}
