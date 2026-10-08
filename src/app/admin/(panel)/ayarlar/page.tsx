import type { Metadata } from "next";
import { aiConfigured, DEFAULT_AI_MODEL } from "@/lib/ai/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageTitle, Panel } from "../ui";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  await requireAdmin();
  const s = await db.settings.findUnique({ where: { id: 1 } });
  return (
    <>
      <PageTitle>Ayarlar</PageTitle>
      <Panel className="max-w-2xl">
        <SettingsForm
          initial={{
            whatsappNumber: s?.whatsappNumber ?? "",
            whatsappGreeting: s?.whatsappGreeting ?? "Merhaba! hediyegetir üzerinden şu ürünlerle ilgileniyorum:",
            instagramUrl: s?.instagramUrl ?? "",
            aiModel: s?.aiModel ?? DEFAULT_AI_MODEL,
          }}
          aiEnabled={aiConfigured()}
        />
      </Panel>
    </>
  );
}
