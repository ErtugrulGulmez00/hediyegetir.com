"use client";

import Image from "next/image";
import { useState } from "react";
import { Tape } from "@/components/ui/Tape";

type Img = { id: string; url: string; alt: string };

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div>
      <div className="kagit relative -rotate-[0.6deg] p-2.5">
        <Tape color="hardal" rotate={-6} className="-top-3 left-8" />
        <Tape color="gul" rotate={8} className="-right-4 -bottom-2" />
        <div className="relative aspect-[4/5] overflow-hidden bg-krem-koyu">
          {current ? (
            <Image
              key={current.id}
              src={current.url}
              alt={current.alt || name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-el text-2xl text-murekkep-soluk">
              fotoğraf yolda
            </span>
          )}
        </div>
      </div>
      {images.length > 1 && (
        <ul className="mt-5 flex gap-3 overflow-x-auto pb-1" aria-label="Diğer fotoğraflar">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
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
    </div>
  );
}
