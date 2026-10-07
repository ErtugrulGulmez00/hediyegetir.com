import type { GenderKey } from "../hedis/config";
import type { AiSuggestion } from "./product-vision";

type FormFields = {
  name: string;
  description: string;
  categoryId: string;
  recipients: string[];
  hobbies: string[];
  gender: GenderKey;
  hedisReviewed: boolean;
};

/**
 * Yapay zeka önerisini forma uygular: yalnızca boş alanları doldurur, admin'in yazdıklarına dokunmaz.
 * Hediş etiketleri (kime + ilgi alanı) ikisi de boşsa birlikte doldurulur ve "kontrol ettim" işareti kalkar.
 */
export function mergeSuggestion<T extends FormFields>(form: T, s: AiSuggestion): { next: T; filled: string[] } {
  const next = { ...form };
  const filled: string[] = [];
  if (!form.name.trim() && s.name) {
    next.name = s.name;
    filled.push("ad");
  }
  if (!form.description.trim() && s.description) {
    next.description = s.description;
    filled.push("açıklama");
  }
  if (!form.categoryId && s.categoryId) {
    next.categoryId = s.categoryId;
    filled.push("kategori");
  }
  const tagsEmpty = form.recipients.length === 0 && form.hobbies.length === 0;
  if (tagsEmpty && (s.recipients.length > 0 || s.hobbies.length > 0)) {
    next.recipients = s.recipients;
    next.hobbies = s.hobbies;
    if (s.gender) next.gender = s.gender;
    next.hedisReviewed = false;
    filled.push("Hediş etiketleri");
  }
  return { next, filled };
}
