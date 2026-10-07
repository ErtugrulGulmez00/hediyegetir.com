// İçe aktarılan ürüne anahtar kelimelerle *öneri* Hediş etiketleri atar.
// Sonuç kesin değildir: ürün hedisReviewed=false kalır, admin onaylar.
import { RECIPIENTS, type GenderKey } from "../hedis/config";

export type TagSuggestion = { recipients: string[]; gender: GenderKey; hobbies: string[] };

const KADIN_WORDS = ["elbise", "etek", "bluz", "çanta", "kolye", "küpe", "bileklik", "yüzük", "takı", "şal", "eşarp", "makyaj", "ruj", "tunik", "kadın"];
const ERKEK_WORDS = ["erkek", "kravat", "kol düğmesi", "tıraş", "sakal", "cüzdan"];

const HOBBY_WORDS: Record<string, string[]> = {
  okuma: ["kitap", "ayraç", "okuma"],
  mutfak: ["mutfak", "önlük", "tencere", "nihale", "tabak", "kase"],
  "kahve-cay": ["kahve", "çay", "kupa", "fincan", "termos", "bardak altı", "demlik"],
  bahce: ["saksı", "bitki", "çiçek", "bahçe", "teraryum"],
  "el-isi": ["örgü şişi", "yumak", "tığ", "nakış kiti"],
  moda: ["çanta", "elbise", "süveter", "hırka", "kolye", "küpe", "bileklik", "şal", "atkı", "bere", "giyim", "takı"],
  seyahat: ["plaj", "hasır", "seyahat", "valiz", "bavul", "pasaport"],
  "spor-doga": ["kamp", "spor", "yoga", "doğa", "matara"],
  muzik: ["müzik", "plak", "gitar", "kulaklık"],
  sanat: ["tablo", "resim", "boya", "tuval", "sanat", "çizim"],
  dekorasyon: ["mum", "dekor", "vazo", "yastık", "makrome", "duvar", "çerçeve", "örtü", "sepet"],
  teknoloji: ["telefon", "tablet", "laptop", "kılıf", "şarj"],
  oyun: ["oyun", "bulmaca", "puzzle", "zeka"],
  fotograf: ["fotoğraf", "albüm", "kamera", "polaroid"],
  bakim: ["sabun", "el kremi", "yüz kremi", "bakım", "parfüm", "kese", "havlu"],
  hayvanlar: ["kedi", "köpek", "tasma", "mama kabı", "evcil"],
};

const CHILD_WORDS = ["çocuk", "bebek", "oyuncak"];

// Hobi sanılan ama başka anlamdaki kalıplar ("kahverengi" renk, "doğal" malzeme, "sanatsal" sıfat)
const FALSE_FRIENDS = /kahve\s?reng\S*|doğal\S*|sanatsal\S*/g;

/** Kelime başından eşleşir; Türkçe ekleri (çantası, kupalar) yakalar, kelime ortasını yakalamaz. */
function containsWord(text: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-zçğıöşüâîû])${escaped}`).test(text);
}

export function suggestTags(input: { name: string; description: string; categories: string[] }): TagSuggestion {
  const text = [input.name, input.categories.join(" "), input.description]
    .join(" ")
    .toLocaleLowerCase("tr-TR")
    .replace(FALSE_FRIENDS, " ");
  // Ad ve kategori açıklamadan daha güvenilir; cinsiyeti onlardan çıkar
  const strongText = [input.name, input.categories.join(" ")].join(" ").toLocaleLowerCase("tr-TR");

  const kadin = KADIN_WORDS.some((w) => containsWord(strongText, w));
  const erkek = ERKEK_WORDS.some((w) => containsWord(strongText, w));
  const gender: GenderKey = kadin && !erkek ? "KADIN" : erkek && !kadin ? "ERKEK" : "UNISEX";

  const hobbies = Object.entries(HOBBY_WORDS)
    .map(([key, words]) => ({ key, hits: words.filter((w) => containsWord(text, w)).length }))
    .filter((h) => h.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
    .map((h) => h.key);

  const forChild = CHILD_WORDS.some((w) => containsWord(strongText, w));
  const recipients = RECIPIENTS.filter((r) => {
    if (r.key === "cocuk") return forChild;
    if (forChild) return false;
    if (r.gender === null) return true;
    return gender === "UNISEX" || r.gender === gender;
  }).map((r) => r.key);

  return { recipients, gender, hobbies };
}
