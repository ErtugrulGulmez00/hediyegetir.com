"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Tape } from "@/components/ui/Tape";
import { effectiveLayout, GRID_COLS, gridCellClass, type GalleryLayoutKey } from "@/lib/product-display";

type Img = { id: string; url: string; alt: string };

/** Parmakla kaydırılan, fotoğrafların tek tek oturduğu şerit (kaydırma çubuğu gizli) */
const track = "flex snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const clamp = (i: number, n: number) => Math.max(0, Math.min(n - 1, i));

/** Ürün fotoğrafları, admin'de seçilen düzende. Fotoğraf sayısı yetmezse tek fotoğraf düzenine düşer. */
export function ProductGallery({ images, name, layout = "TEK" }: { images: Img[]; name: string; layout?: GalleryLayoutKey }) {
  const mode = effectiveLayout(layout, images.length);
  return mode === "TEK" ? <Carousel images={images} name={name} /> : <GridGallery images={images} name={name} layout={mode} />;
}

const GRID_SIZES = {
  IKILI: ["(min-width: 768px) 15rem, 50vw"],
  UCLU: ["(min-width: 768px) 20rem, 66vw", "(min-width: 768px) 10rem, 33vw"],
} as const;

/** İkili / üçlü ızgara: bütün fotoğraflar bir bakışta; dokununca tam ekran görüntüleyici açılır */
function GridGallery({ images, name, layout }: { images: Img[]; name: string; layout: Exclude<GalleryLayoutKey, "TEK"> }) {
  const [viewerAt, setViewerAt] = useState<number | null>(null);
  const sizes = GRID_SIZES[layout];

  return (
    <div>
      <div className="kagit relative -rotate-[0.6deg] p-2.5">
        <Tape color="hardal" rotate={-6} className="-top-3 left-8 z-10" />
        <Tape color="gul" rotate={8} className="-right-4 -bottom-2 z-10" />
        <ul className={`grid gap-2 ${GRID_COLS[layout]}`} aria-label="Ürün fotoğrafları">
          {images.map((img, i) => (
            <li key={img.id} className={`relative overflow-hidden bg-krem-koyu ${gridCellClass(layout, i, images.length)}`}>
              <button
                type="button"
                onClick={() => setViewerAt(i)}
                aria-label={`${i + 1}. fotoğrafı büyüt`}
                className="group absolute inset-0 cursor-zoom-in"
              >
                <Image
                  src={img.url}
                  alt={img.alt || name}
                  fill
                  sizes={sizes[Math.min(i, sizes.length - 1)]}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                  loading={i < 3 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
      {viewerAt !== null && <ImageViewer images={images} name={name} start={viewerAt} onClose={() => setViewerAt(null)} />}
    </div>
  );
}

/** Fareyle üstüne gelince büyütmenin merkezi imlecin olduğu yer olsun (yeniden çizim olmadan, CSS değişkeniyle) */
function followCursor(e: React.MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`);
  e.currentTarget.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`);
}

/** Tek büyük fotoğraf: parmakla / oklarla kaydırılır, altında küçük resimler */
function Carousel({ images, name }: { images: Img[]; name: string }) {
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
                  onMouseMove={followCursor}
                  aria-label={`${i + 1}. fotoğrafı büyüt`}
                  className="group/foto relative h-full w-full shrink-0 cursor-zoom-in snap-center overflow-hidden"
                >
                  <Image
                    src={img.url}
                    alt={img.alt || name}
                    fill
                    sizes="(min-width: 1024px) 30rem, (min-width: 768px) 26rem, 100vw"
                    className="origin-[var(--zx,50%)_var(--zy,50%)] object-cover transition-transform duration-200 [@media(hover:hover)]:group-hover/foto:scale-[1.9]"
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
        <ul className="mt-4 flex gap-2.5 overflow-x-auto pb-1" aria-label="Diğer fotoğraflar">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${i + 1}. fotoğrafı göster`}
                aria-pressed={i === active}
                className={`relative block size-16 overflow-hidden border-2 bg-kagit p-0.5 transition-transform ${
                  i === active ? "border-murekkep shadow-baski-sm" : "border-transparent opacity-75 hover:opacity-100"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
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

type Zoom = { s: number; x: number; y: number };
type Point = { x: number; y: number };
type Gesture =
  | { kind: "pinch"; dist: number; mid: Point; zoom: Zoom }
  | { kind: "pan" | "swipe"; start: Point; zoom: Zoom; moved: boolean };

const MAX_ZOOM = 4;
const TAP_ZOOM = 2.5;
const NO_ZOOM: Zoom = { s: 1, x: 0, y: 0 };

/**
 * Tam ekran fotoğraf görüntüleyici. Masaüstünde tıklayınca ya da tekerlekle yakınlaşır, sürükleyerek gezilir;
 * mobilde çift dokunuş ya da iki parmakla büyür, kaydırınca sonraki fotoğrafa geçer. Altta küçük resimler,
 * üstte +/− ve kapat düğmeleri var. Fotoğrafın dışına tıklamak ya da Esc kapatır.
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
  const stageRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);
  const [zoom, setZoom] = useState<Zoom>(NO_ZOOM);
  const [dragX, setDragX] = useState(0);
  const [gesturing, setGesturing] = useState(false);
  const indexRef = useRef(start);
  const zoomRef = useRef(zoom);
  const ratios = useRef<Record<number, number>>({});
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const lastTap = useRef(0);
  const many = images.length > 1;
  const img = images[index];

  useEffect(() => {
    indexRef.current = index;
    zoomRef.current = zoom;
  });

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, []);

  /** Sahnenin ortasına göre konum */
  const rel = (clientX: number, clientY: number): Point => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: clientX - r.left - r.width / 2, y: clientY - r.top - r.height / 2 };
  };

  /** Fotoğrafın sahneye sığdırılmış (1x) boyutu */
  const fitted = () => {
    const el = stageRef.current;
    if (!el) return { w: 0, h: 0, W: 0, H: 0 };
    const W = el.clientWidth;
    const H = el.clientHeight;
    const ratio = ratios.current[indexRef.current] ?? 0.8;
    return W / H > ratio ? { w: H * ratio, h: H, W, H } : { w: W, h: W / ratio, W, H };
  };

  // Yakınlık 1–4 arasında kalır; fotoğraf kenarı sahnenin içine kaçmaz
  const clampZoom = (z: Zoom): Zoom => {
    const s = Math.min(MAX_ZOOM, Math.max(1, z.s));
    if (s === 1) return NO_ZOOM;
    const { w, h, W, H } = fitted();
    const bx = Math.max(0, (w * s - W) / 2);
    const by = Math.max(0, (h * s - H) / 2);
    return { s, x: Math.min(bx, Math.max(-bx, z.x)), y: Math.min(by, Math.max(-by, z.y)) };
  };

  // Verilen noktanın altındaki yer sabit kalacak şekilde yakınlaş
  const zoomAround = (z: Zoom, s: number, p: Point): Zoom => {
    const next = Math.min(MAX_ZOOM, Math.max(1, s));
    return clampZoom({ s: next, x: p.x - (p.x - z.x) * (next / z.s), y: p.y - (p.y - z.y) * (next / z.s) });
  };

  const insideImage = (p: Point, z: Zoom) => {
    const { w, h } = fitted();
    return Math.abs(p.x - z.x) <= (w * z.s) / 2 && Math.abs(p.y - z.y) <= (h * z.s) / 2;
  };

  const go = (i: number) => {
    setIndex(clamp(i, images.length));
    setZoom(NO_ZOOM);
    setDragX(0);
  };
  const close = () => dialogRef.current?.close();
  const zoomBy = (f: number) => setZoom((z) => zoomAround(z, z.s * f, { x: z.x, y: z.y }));
  const toggleZoom = (p: Point) => setZoom((z) => (z.s > 1 ? NO_ZOOM : zoomAround(z, TAP_ZOOM, p)));

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Oklar kendi tıklamasını alsın
    if (e.button !== 0 || (e.target as Element).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      const [a, b] = pts;
      gesture.current = { kind: "pinch", dist: Math.hypot(a.x - b.x, a.y - b.y), mid: rel((a.x + b.x) / 2, (a.y + b.y) / 2), zoom: zoomRef.current };
      setDragX(0);
    } else if (pts.length === 1) {
      gesture.current = { kind: zoomRef.current.s > 1 ? "pan" : "swipe", start: pts[0], zoom: zoomRef.current, moved: false };
    }
    setGesturing(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pinch") {
      const [a, b] = [...pointers.current.values()];
      if (!b) return;
      setZoom(zoomAround(g.zoom, (g.zoom.s * Math.hypot(a.x - b.x, a.y - b.y)) / g.dist, g.mid));
      return;
    }
    const dx = e.clientX - g.start.x;
    const dy = e.clientY - g.start.y;
    if (Math.hypot(dx, dy) > 6) g.moved = true;
    if (g.kind === "pan") setZoom(clampZoom({ s: g.zoom.s, x: g.zoom.x + dx, y: g.zoom.y + dy }));
    else if (many) setDragX(dx);
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const g = gesture.current;
    if (g?.kind === "pinch") {
      // Bir parmak kalırsa onunla gezmeye devam
      const rest = [...pointers.current.values()][0];
      gesture.current = rest ? { kind: "pan", start: rest, zoom: zoomRef.current, moved: true } : null;
      setGesturing(!!rest);
      return;
    }
    gesture.current = null;
    setGesturing(false);
    if (!g || e.type === "pointercancel") return setDragX(0);

    const dx = e.clientX - g.start.x;
    if (g.kind === "swipe" && Math.abs(dx) > 60 && many) {
      go(index + (dx < 0 ? 1 : -1));
      return;
    }
    setDragX(0);
    if (g.moved) return;

    // Dokunuş / tıklama
    const p = rel(e.clientX, e.clientY);
    const z = zoomRef.current;
    if (e.pointerType === "mouse") {
      if (z.s === 1 && !insideImage(p, z)) close();
      else toggleZoom(p);
      return;
    }
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      toggleZoom(p);
    } else {
      lastTap.current = now;
      if (z.s === 1 && !insideImage(p, z)) close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={`${name} fotoğrafları`}
      onClose={() => onClose(indexRef.current)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        else if (e.key === "ArrowRight") go(index + 1);
        else if (e.key === "+" || e.key === "=") zoomBy(1.5);
        else if (e.key === "-") zoomBy(1 / 1.5);
        else if (e.key === "0") setZoom(NO_ZOOM);
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-kagit backdrop:bg-murekkep/95"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
          <span className="rounded-full bg-kagit/10 px-3 py-1 text-sm font-bold">
            {index + 1} / {images.length}
          </span>
          <div className="flex items-center gap-2">
            <ViewerButton label="Uzaklaştır" onClick={() => zoomBy(1 / 1.5)} disabled={zoom.s <= 1}>
              <path d="M5 10h10" />
            </ViewerButton>
            <ViewerButton label="Yakınlaştır" onClick={() => zoomBy(1.5)} disabled={zoom.s >= MAX_ZOOM}>
              <path d="M5 10h10M10 5v10" />
            </ViewerButton>
            <ViewerButton label="Kapat" onClick={close}>
              <path d="m5.5 5.5 9 9m0-9-9 9" />
            </ViewerButton>
          </div>
        </div>

        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onWheel={(e) => {
            const p = rel(e.clientX, e.clientY);
            setZoom((z) => zoomAround(z, z.s * (e.deltaY < 0 ? 1.25 : 1 / 1.25), p));
          }}
          className={`relative min-h-0 flex-1 touch-none overflow-hidden select-none ${
            zoom.s > 1 ? (gesturing ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
          }`}
        >
          <div
            className={`absolute inset-0 ${gesturing ? "" : "transition-transform duration-200 ease-out motion-reduce:transition-none"}`}
            style={{ transform: `translate3d(${zoom.x + dragX}px, ${zoom.y}px, 0) scale(${zoom.s})` }}
          >
            <Image
              key={img.id}
              src={img.url}
              alt={img.alt || name}
              fill
              sizes="100vw"
              quality={90}
              priority
              draggable={false}
              className="object-contain"
              onLoad={(e) => {
                const el = e.currentTarget;
                if (el.naturalHeight) ratios.current[index] = el.naturalWidth / el.naturalHeight;
              }}
            />
          </div>
          {many && zoom.s === 1 && (
            <>
              <SlideArrow side="left" disabled={index === 0} onClick={() => go(index - 1)} className="hidden sm:flex" dark />
              <SlideArrow side="right" disabled={index === images.length - 1} onClick={() => go(index + 1)} className="hidden sm:flex" dark />
            </>
          )}
        </div>

        {many && (
          <ul className="flex justify-start gap-2 overflow-x-auto px-3 pt-3 sm:justify-center" aria-label="Fotoğraflar">
            {images.map((t, i) => (
              <li key={t.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`${i + 1}. fotoğraf`}
                  aria-current={i === index}
                  className={`relative block size-14 overflow-hidden rounded-md border-2 transition-opacity sm:size-16 ${
                    i === index ? "border-kagit" : "border-transparent opacity-55 hover:opacity-100"
                  }`}
                >
                  <Image src={t.url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="px-3 py-2.5 text-center text-xs text-kagit/70">
          <span className="hidden [@media(hover:hover)]:inline">Tıklayarak ya da tekerlekle yakınlaştır · sürükleyerek gez · dışarı tıklayınca kapanır</span>
          <span className="[@media(hover:hover)]:hidden">Çift dokun ya da iki parmakla büyüt · kaydırarak geç</span>
        </p>
      </div>
    </dialog>
  );
}

function ViewerButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-10 items-center justify-center rounded-full border-2 border-kagit/70 bg-murekkep/60 transition-colors hover:bg-kagit hover:text-murekkep disabled:opacity-35 disabled:hover:bg-murekkep/60 disabled:hover:text-kagit"
    >
      <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        {children}
      </svg>
    </button>
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
