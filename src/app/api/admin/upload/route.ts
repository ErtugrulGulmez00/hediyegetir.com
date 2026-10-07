import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { adminOrNull } from "@/lib/auth";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/admin/images";

// Tarayıcı dosyayı doğrudan Vercel Blob'a yükler; bu route yalnızca kısa ömürlü
// yükleme anahtarı üretir (Vercel'in 4.5 MB istek sınırına takılmamak için).
export async function POST(request: Request) {
  if (!(await adminOrNull())) return Response.json({ error: "Oturum gerekli" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "BLOB_READ_WRITE_TOKEN tanımlı değil" }, { status: 503 });
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("urunler/")) throw new Error("Geçersiz yol");
        return {
          allowedContentTypes: [...ALLOWED_IMAGE_TYPES],
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Yükleme başarısız" }, { status: 400 });
  }
}
