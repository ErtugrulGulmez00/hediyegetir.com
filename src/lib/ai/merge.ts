import type { GenderKey } from "../hedis/config";
import type { AiSuggestion } from "./product-vision";

type FormFields = {
  name: string;
  description: string;
  categoryId: string;
  recipients: string[];
  hobbies: string[];
  gender: GenderKey;
  occasions: string[];
  tags: string[];
  features: string[];
  hedisReviewed: boolean;
};

/** AI'ın doldurduğu alanlar (formda "AI" rozeti gösterilir, admin değiştirince kalkar) */
export type AiField = "name" | "description" | "category" | "audience" | "occasions" | "tags" | "features";

export const AI_FIELD_LABELS: Record<AiField, string> = {
  name: "ürün adı",
  description: "açıklama",
  category: "kategori",
  audience: "kime uygun",
  occasions: "özel günler",
  tags: "etiketler",
  features: "ürün özellikleri",
};

/**
 * AI önerisini forma uygular: yalnızca boş alanları doldurur, admin'in yazdıklarına dokunmaz.
 * `overwrite`: daha önce AI'ın doldurduğu ve admin'in henüz dokunmadığı alanlar; yeniden analizde
 * (ör. fotoğraf sonradan eklendiğinde) daha iyi öneriyle değiştirilebilir.
 * Kime uygun + ilgi alanı birlikte doldurulur; Hediş verisi değişirse "kontrol ettim" işareti kalkar.
 */
export function mergeSuggestion<T extends FormFields>(
  form: T,
  s: AiSuggestion,
  overwrite: readonly AiField[] = [],
): { next: T; filled: AiField[] } {
  const next = { ...form };
  const filled: AiField[] = [];
  const free = (field: AiField, empty: boolean) => empty || overwrite.includes(field);
  if (free("name", !form.name.trim()) && s.name) {
    next.name = s.name;
    filled.push("name");
  }
  if (free("description", !form.description.trim()) && s.description) {
    next.description = s.description;
    filled.push("description");
  }
  if (free("category", !form.categoryId) && s.categoryId) {
    next.categoryId = s.categoryId;
    filled.push("category");
  }
  if (free("audience", form.recipients.length === 0 && form.hobbies.length === 0) && (s.recipients.length > 0 || s.hobbies.length > 0)) {
    next.recipients = s.recipients;
    next.hobbies = s.hobbies;
    if (s.gender) next.gender = s.gender;
    filled.push("audience");
  }
  if (free("occasions", form.occasions.length === 0) && s.occasions.length > 0) {
    next.occasions = s.occasions;
    filled.push("occasions");
  }
  if (free("tags", form.tags.length === 0) && s.tags.length > 0) {
    next.tags = s.tags;
    filled.push("tags");
  }
  if (free("features", form.features.length === 0) && s.features.length > 0) {
    next.features = s.features;
    filled.push("features");
  }
  if (filled.some((f) => f === "audience" || f === "occasions" || f === "tags")) next.hedisReviewed = false;
  return { next, filled };
}
