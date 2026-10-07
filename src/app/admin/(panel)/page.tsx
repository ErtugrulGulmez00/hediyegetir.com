import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageTitle, Panel } from "./ui";

export const metadata: Metadata = { title: "Özet" };

export default async function AdminHome() {
  await requireAdmin();
  const [active, inactive, unreviewed, lastSync] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.product.count({ where: { isActive: false } }),
    db.product.count({ where: { hedisReviewed: false, isActive: true } }),
    db.ikasSyncLog.findFirst({ orderBy: { startedAt: "desc" } }),
  ]);

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

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Yayındaki ürün" value={active} href="/admin/urunler?durum=aktif" />
        <Stat label="Pasif ürün" value={inactive} href="/admin/urunler?durum=pasif" />
        <Panel>
          <p className="text-sm font-bold">Son ikas senkronu</p>
          {lastSync ? (
            <p className="mt-1">
              <span className="font-baslik text-xl">{lastSync.startedAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" })}</span>
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

      <p className="mt-10 font-el text-xl text-murekkep-soluk">Ziyaret istatistikleri yakında burada.</p>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="kagit block rounded-sm p-5 transition-transform hover:-translate-y-0.5">
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-1 font-baslik text-4xl">{value}</p>
    </Link>
  );
}
