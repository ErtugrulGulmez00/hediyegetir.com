import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { adminOrNull } from "@/lib/auth";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/admin/images";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Yalnızca yerel geliştirme: Blob anahtarı yokken fotoğrafları public/uploads'a yazar.
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Yayında yerel yükleme kapalı" }, { status: 404 });
  }
  if (!(await adminOrNull())) return Response.json({ error: "Oturum gerekli" }, { status: 401 });

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "Dosya yok" }, { status: 400 });
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return Response.json({ error: "Yalnızca JPEG, PNG ve WebP" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) return Response.json({ error: "Dosya 5 MB'tan büyük" }, { status: 400 });

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${EXT[file.type]}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return Response.json({ url: `/uploads/${name}` });
}
