import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  hashVisitor,
  isBot,
  isTrackablePath,
  isValidVisitorId,
  istanbulDay,
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
} from "@/lib/analytics";
import { SESSION_COOKIE, verifySession } from "@/lib/auth-token";
import { db } from "@/lib/db";

const Body = z.object({ path: z.string().max(300), newVisit: z.boolean() });

const noContent = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  if (isBot(request.headers.get("user-agent"))) return noContent();

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isTrackablePath(parsed.data.path)) return noContent();

  const jar = await cookies();
  // Admin'in kendi gezintisi sayılmasın
  if (await verifySession(jar.get(SESSION_COOKIE)?.value)) return noContent();

  let visitorId = jar.get(VISITOR_COOKIE)?.value;
  if (!isValidVisitorId(visitorId)) {
    visitorId = randomUUID();
    jar.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE,
    });
  }

  const day = istanbulDay(new Date());
  const visitorHash = hashVisitor(visitorId, process.env.VISITOR_SALT || "hediyegetir");

  // Bu ziyaretçi bugün ilk kez mi görülüyor? (eşzamanlı isteklerde çakışmayı DB çözer)
  const firstToday =
    (
      await db.visitorDay.createMany({
        data: [{ date: day, visitorHash }],
        skipDuplicates: true,
      })
    ).count === 1;

  const visits = parsed.data.newVisit || firstToday ? 1 : 0;
  const uniqueVisitors = firstToday ? 1 : 0;
  await db.dailyStat.upsert({
    where: { date: day },
    create: { date: day, pageViews: 1, visits, uniqueVisitors },
    update: {
      pageViews: { increment: 1 },
      visits: { increment: visits },
      uniqueVisitors: { increment: uniqueVisitors },
    },
  });

  // Tekil ziyaretçi hash'lerini 90 günden fazla tutma
  if (Math.random() < 0.02) {
    await db.visitorDay.deleteMany({ where: { date: { lt: istanbulDay(new Date(Date.now() - 90 * 86_400_000)) } } });
  }

  return noContent();
}
