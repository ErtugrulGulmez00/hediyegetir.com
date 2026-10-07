"use client";

import { useState } from "react";

export type DayStat = { date: string; visits: number; uniqueVisitors: number; pageViews: number };

const fmtDay = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("tr-TR", { ...opts, timeZone: "UTC" });
const fmtNum = (n: number) => n.toLocaleString("tr-TR");

/** 0'dan başlayan, "temiz" adımlı üst sınır: 7 -> 10, 23 -> 25, 140 -> 150 */
function niceMax(max: number) {
  if (max <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * pow).find((s) => s * 4 >= max)!;
  return step * 4;
}

const W = 720;
const H = 200;
const PAD = { top: 12, right: 8, bottom: 26, left: 36 };

/** Son 30 günün günlük ziyaretleri: tek seri sütun grafik, sütun başına ipucu ve tablo görünümü. */
export function VisitsChart({ days }: { days: DayStat[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...days.map((d) => d.visits), 0));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / days.length;
  const barW = Math.min(18, slot - 2);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  const h = hover != null ? days[hover] : null;

  return (
    <figure>
      <figcaption className="mb-3 text-sm text-murekkep-soluk">Günlük ziyaret, son {days.length} gün</figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Son ${days.length} günün günlük ziyaret grafiği; değerler aşağıdaki tabloda`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--color-krem-koyu)" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--color-murekkep-soluk)">
                {fmtNum(t)}
              </text>
            </g>
          ))}
          {days.map((d, i) => {
            const x = PAD.left + i * slot + (slot - barW) / 2;
            const top = y(d.visits);
            const height = PAD.top + innerH - top;
            const r = Math.min(4, height / 2, barW / 2);
            return (
              <g key={d.date}>
                {height > 0 && (
                  // Üstte 4px yuvarlak, tabanda kare
                  <path
                    d={`M${x},${top + height} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + height} Z`}
                    fill="var(--color-kiremit)"
                    opacity={hover == null || hover === i ? 1 : 0.45}
                  />
                )}
                {(i % 7 === (days.length - 1) % 7) && (
                  <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--color-murekkep-soluk)">
                    {fmtDay(d.date, { day: "numeric", month: "short" })}
                  </text>
                )}
                {/* İsabet alanı sütundan geniş */}
                <rect
                  x={PAD.left + i * slot}
                  y={PAD.top}
                  width={slot}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}
          <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="var(--color-kraft-koyu)" strokeWidth="1" />
        </svg>
        {h && hover != null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 border-2 border-murekkep bg-kagit px-3 py-2 text-sm shadow-baski-sm"
            // Kenardaki sütunlarda kutu grafikten taşmasın
            style={{ left: `${Math.min(86, Math.max(14, ((PAD.left + hover * slot + slot / 2) / W) * 100))}%` }}
          >
            <p className="font-bold">{fmtDay(h.date, { day: "numeric", month: "long", weekday: "short" })}</p>
            <p>
              <span className="mr-1.5 inline-block size-2 rounded-full bg-kiremit" />
              {fmtNum(h.visits)} ziyaret
            </p>
            <p className="text-murekkep-soluk">{fmtNum(h.uniqueVisitors)} tekil · {fmtNum(h.pageViews)} sayfa</p>
          </div>
        )}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-murekkep-soluk hover:text-murekkep">Tablo olarak gör</summary>
        <div className="mt-2 max-h-72 overflow-auto">
          <table className="w-full text-left tabular-nums">
            <thead className="sticky top-0 bg-kagit">
              <tr className="border-b border-kraft">
                <th className="py-1 pr-4 font-bold">Gün</th>
                <th className="py-1 pr-4 text-right font-bold">Ziyaret</th>
                <th className="py-1 pr-4 text-right font-bold">Tekil ziyaretçi</th>
                <th className="py-1 text-right font-bold">Sayfa görüntüleme</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d) => (
                <tr key={d.date} className="border-b border-krem-koyu">
                  <td className="py-1 pr-4">{fmtDay(d.date, { day: "numeric", month: "long" })}</td>
                  <td className="py-1 pr-4 text-right">{fmtNum(d.visits)}</td>
                  <td className="py-1 pr-4 text-right">{fmtNum(d.uniqueVisitors)}</td>
                  <td className="py-1 text-right">{fmtNum(d.pageViews)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
