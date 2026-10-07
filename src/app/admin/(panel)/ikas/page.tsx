import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, PageTitle, Panel } from "../ui";
import { SyncButton } from "./SyncButton";

export const metadata: Metadata = { title: "ikas senkronu" };

const STATUS_TONE = { SUCCESS: "zeytin", PARTIAL: "hardal", FAILED: "kiremit", RUNNING: "soluk" } as const;

export default async function IkasPage() {
  await requireAdmin();
  const logs = await db.ikasSyncLog.findMany({ orderBy: { startedAt: "desc" }, take: 10 });
  const base = process.env.IKAS_BASE_URL || "https://hediyeyolla.ikas.shop";

  return (
    <>
      <PageTitle>ikas senkronu</PageTitle>
      <Panel className="mb-6">
        <p className="text-[0.95rem]">
          <a href={base} target="_blank" rel="noopener" className="link-el">
            {base.replace(/^https?:\/\//, "")}
          </a>{" "}
          mağazasındaki ürünleri çeker: yeni ürünleri ekler, var olanları günceller (kilitli alanlara dokunmaz), ikas&apos;tan
          kalkanları pasife alır. Yeni ürünlerin Hediş etiketleri tahminidir; kontrol etmeyi unutma.
        </p>
        <SyncButton />
      </Panel>

      <Panel title="Son senkronlar">
        {logs.length === 0 ? (
          <p className="text-murekkep-soluk">Henüz senkron yapılmadı.</p>
        ) : (
          <ul className="divide-y divide-kraft">
            {logs.map((log) => (
              <li key={log.id} className="py-3">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONE[log.status as keyof typeof STATUS_TONE] ?? "soluk"}>{log.status}</Badge>
                    <span className="font-semibold">
                      {log.startedAt.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" })}
                    </span>
                    <span className="text-sm text-murekkep-soluk">
                      {log.added} yeni · {log.updated} güncellendi · {log.deactivated} pasife alındı · {log.failed} hata
                    </span>
                  </summary>
                  {log.messages.length > 0 && (
                    <ul className="mt-2 list-disc space-y-0.5 pl-6 text-sm text-murekkep-soluk">
                      {log.messages.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  )}
                </details>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
