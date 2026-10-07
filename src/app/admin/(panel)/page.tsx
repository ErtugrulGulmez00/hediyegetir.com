import type { Metadata } from "next";
import Link from "next/link";
import { istanbulDay, lastDays } from "@/lib/analytics";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageTitle, Panel } from "./ui";
import { VisitsChart, type DayStat } from "./VisitsChart";

export const metadata: Metadata = { title: "Özet" };

/** Aralıktaki gerçek tekil ziyaretçi (günlük tekillerin toplamı değil) */
async function distinctVisitors(fromDay: string): Promise<number> {
  const rows = await db.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(DISTINCT "visitorHash") AS n FROM "VisitorDay" WHERE "date" >= ${fromDay}`;
  return Number(rows[0]?.n ?? 0);
}

export default async function AdminHome() {
  await requireAdmin();
  const days30 = lastDays(new Date(), 30);
  const from7 = days30[days30.length - 7];

  const [active, inactive, unreviewed, lastSync, stats, unique7, unique30] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.product.count({ where: { isActive: false } }),
    db.product.count({ where: { hedisReviewed: false, isActive: true } }),
    db.ikasSyncLog.findFirst({ orderBy: { startedAt: "desc" } }),
    db.dailyStat.findMany({ where: { date: { gte: days30[0] } } }),
    distinctVisitors(from7),
    distinctVisitors(days30[0]),
  ]);

  const byDay = new Map(stats.map((s) => [s.date, s]));
  const series: DayStat[] = days30.map((date) => {
    const s = byDay.get(date);
    return { date, visits: s?.visits ?? 0, uniqueVisitors: s?.uniqueVisitors ?? 0, pageViews: s?.pageViews ?? 0 };
  });
  const sum = (from: string, key: "visits" | "pageViews") =>
    series.filter((d) => d.date >= from).reduce((n, d) => n + d[key], 0);
  const todayStat = series[series.length - 1];

  return (
    <>
      <PageTitle>Merhaba</PageTitle>

      {unreviewed > 0 && (
        <Link
          href="/admin/urunler?durum=etiketsiz"
          className="mb-6 block border-l-4 border-hardal bg-kagit px-4 py-3 font-semibold hover:bg-krem-koyu"
        >
          {unreviewed} ürünün Hediş etiketleri henüz onaylanmadı. Hediş bu ürünleri tahmini etiketlerle öneriyor →
        </Link>
      )}

      <h2 className="mb-3 font-el text-2xl text-kiremit-koyu">Ziyaretler</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <VisitTile label="Bugün" visits={todayStat.visits} unique={todayStat.uniqueVisitors} pages={todayStat.pageViews} />
        <VisitTile label="Son 7 gün" visits={sum(from7, "visits")} unique={unique7} pages={sum(from7, "pageViews")} />
        <VisitTile label="Son 30 gün" visits={sum(days30[0], "visits")} unique={unique30} pages={sum(days30[0], "pageViews")} />
      </div>
      <Panel className="mt-4">
        {series.some((d) => d.pageViews > 0) ? (
          <VisitsChart days={series} />
        ) : (
          <p className="text-murekkep-soluk">
            Henüz ziyaret kaydı yok. Site yayına alınınca ziyaretler burada görünür. (Senin admin oturumundaki gezintilerin
            sayılmaz.)
          </p>
        )}
      </Panel>
      <p className="mt-2 text-xs text-murekkep-soluk">
        Ziyaret: yeni bir oturum (sekme) açılışı. Tekil ziyaretçi: o dönemde siteye gelen farklı tarayıcı sayısı. Botlar sayılmaz.
        Gün sınırı İstanbul saatine göredir ({istanbulDay(new Date())}).
      </p>

      <h2 className="mt-10 mb-3 font-el text-2xl text-kiremit-koyu">Mağaza</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Yayındaki ürün" value={active} href="/admin/urunler?durum=aktif" />
        <Stat label="Pasif ürün" value={inactive} href="/admin/urunler?durum=pasif" />
        <Panel>
          <p className="text-sm font-bold">Son ikas senkronu</p>
          {lastSync ? (
            <p className="mt-1">
              <span className="text-lg font-semibold">
                {lastSync.startedAt.toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" })}
              </span>
              <br />
              <span className="text-sm text-murekkep-soluk">
                {lastSync.status} · {lastSync.added} yeni, {lastSync.updated} güncel
              </span>
            </p>
          ) : (
            <p className="mt-1 text-murekkep-soluk">Henüz yapılmadı</p>
          )}
          <Link href="/admin/ikas" className="link-el mt-2 inline-block text-sm font-semibold">
            Senkron sayfası
          </Link>
        </Panel>
      </div>
    </>
  );
}

const fmt = (n: number) => n.toLocaleString("tr-TR");

function VisitTile({ label, visits, unique, pages }: { label: string; visits: number; unique: number; pages: number }) {
  return (
    <div className="kagit rounded-sm p-5">
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-1 text-4xl font-semibold tabular-nums">{fmt(visits)}</p>
      <p className="text-sm text-murekkep-soluk">ziyaret</p>
      <p className="mt-2 text-sm">
        {fmt(unique)} tekil ziyaretçi · {fmt(pages)} sayfa
      </p>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="kagit block rounded-sm p-5 transition-transform hover:-translate-y-0.5">
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-1 text-4xl font-semibold tabular-nums">{fmt(value)}</p>
    </Link>
  );
}
