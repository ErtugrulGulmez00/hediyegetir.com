// Hediş'in sınıflandırması ve puanlama ağırlıkları.
// Anahtarlar (key) veritabanında Product.recipients / Product.hobbies içinde saklanır;
// değiştirirsen mevcut ürün etiketlerini de güncellemen gerekir.

export type GenderKey = "KADIN" | "ERKEK" | "UNISEX";

export type Recipient = {
  key: string;
  label: string;
  /** "Annen" — "Annen için..." */
  iyelik: string;
  /** "Annene" — "Annene özel 5 hediye" */
  yonelme: string;
  /** Kişinin cinsiyeti belliyse; null ise Hediş ayrıca sorar */
  gender: Exclude<GenderKey, "UNISEX"> | null;
};

export const RECIPIENTS: readonly Recipient[] = [
  { key: "anne", label: "Anne", iyelik: "Annen", yonelme: "Annene", gender: "KADIN" },
  { key: "baba", label: "Baba", iyelik: "Baban", yonelme: "Babana", gender: "ERKEK" },
  { key: "sevgili", label: "Sevgili", iyelik: "Sevgilin", yonelme: "Sevgiline", gender: null },
  { key: "es", label: "Eş", iyelik: "Eşin", yonelme: "Eşine", gender: null },
  { key: "kiz-kardes", label: "Kız kardeş", iyelik: "Kız kardeşin", yonelme: "Kız kardeşine", gender: "KADIN" },
  { key: "erkek-kardes", label: "Erkek kardeş", iyelik: "Erkek kardeşin", yonelme: "Erkek kardeşine", gender: "ERKEK" },
  { key: "arkadas", label: "Arkadaş", iyelik: "Arkadaşın", yonelme: "Arkadaşına", gender: null },
  { key: "teyze", label: "Teyze", iyelik: "Teyzen", yonelme: "Teyzene", gender: "KADIN" },
  { key: "hala", label: "Hala", iyelik: "Halan", yonelme: "Halana", gender: "KADIN" },
  { key: "dayi", label: "Dayı", iyelik: "Dayın", yonelme: "Dayına", gender: "ERKEK" },
  { key: "amca", label: "Amca", iyelik: "Amcan", yonelme: "Amcana", gender: "ERKEK" },
  { key: "eniste", label: "Enişte", iyelik: "Enişten", yonelme: "Eniştene", gender: "ERKEK" },
  { key: "yenge", label: "Yenge", iyelik: "Yengen", yonelme: "Yengene", gender: "KADIN" },
  { key: "kuzen", label: "Kuzen", iyelik: "Kuzenin", yonelme: "Kuzenine", gender: null },
  { key: "buyukanne", label: "Büyükanne", iyelik: "Büyükannen", yonelme: "Büyükannene", gender: "KADIN" },
  { key: "buyukbaba", label: "Büyükbaba", iyelik: "Büyükbaban", yonelme: "Büyükbabana", gender: "ERKEK" },
  { key: "cocuk", label: "Çocuk", iyelik: "Çocuğun", yonelme: "Çocuğuna", gender: null },
  { key: "is-arkadasi", label: "İş arkadaşı", iyelik: "İş arkadaşın", yonelme: "İş arkadaşına", gender: null },
  { key: "ogretmen", label: "Öğretmen", iyelik: "Öğretmenin", yonelme: "Öğretmenine", gender: null },
  { key: "diger", label: "Diğer", iyelik: "Sevdiğin kişi", yonelme: "Sevdiğin kişiye", gender: null },
] as const;

export type Hobby = { key: string; label: string };

export const HOBBIES: readonly Hobby[] = [
  { key: "okuma", label: "Okumak" },
  { key: "mutfak", label: "Yemek & mutfak" },
  { key: "kahve-cay", label: "Kahve & çay" },
  { key: "bahce", label: "Bahçe & bitkiler" },
  { key: "el-isi", label: "El işi & örgü" },
  { key: "moda", label: "Moda & stil" },
  { key: "seyahat", label: "Seyahat" },
  { key: "spor-doga", label: "Spor & doğa" },
  { key: "muzik", label: "Müzik" },
  { key: "sanat", label: "Sanat & resim" },
  { key: "dekorasyon", label: "Ev dekorasyonu" },
  { key: "teknoloji", label: "Teknoloji" },
  { key: "oyun", label: "Oyun & bulmaca" },
  { key: "fotograf", label: "Fotoğraf" },
  { key: "bakim", label: "Kişisel bakım" },
  { key: "hayvanlar", label: "Hayvanlar" },
] as const;

export const MAX_HOBBIES = 3;

export type BudgetKey = "0-500" | "500-1000" | "1000+";

export type Budget = {
  key: BudgetKey;
  label: string;
  /** Kuruş, dahil değil (null = alt sınır yok) */
  minExclusive: number | null;
  /** Kuruş, dahil (null = üst sınır yok) */
  maxInclusive: number | null;
};

export const BUDGETS: readonly Budget[] = [
  { key: "0-500", label: "500 ₺'ye kadar", minExclusive: null, maxInclusive: 50_000 },
  { key: "500-1000", label: "500 – 1.000 ₺", minExclusive: 50_000, maxInclusive: 100_000 },
  { key: "1000+", label: "1.000 ₺ ve üzeri", minExclusive: 100_000, maxInclusive: null },
] as const;

/** Puanlama ağırlıkları */
export const WEIGHTS = {
  recipientMatch: 40,
  genderMatch: 15,
  /** Cinsiyet uyuşmazlığı: fiilen eler */
  genderMismatch: -100,
  inBudget: 30,
  /** Bütçe sınırının %20 yakınında */
  nearBudget: 10,
  perHobby: 20,
  featured: 5,
} as const;

/** Bütçe sınırına ne kadar yakın olursa "komşu" sayılır */
export const BUDGET_TOLERANCE = 0.2;
/** Sonuçta aynı kategoriden en fazla kaç ürün (mümkünse) */
export const MAX_PER_CATEGORY = 2;
export const RESULT_COUNT = 5;

export const recipientByKey = (key: string) => RECIPIENTS.find((r) => r.key === key);
export const hobbyByKey = (key: string) => HOBBIES.find((h) => h.key === key);
export const budgetByKey = (key: string) => BUDGETS.find((b) => b.key === key);
