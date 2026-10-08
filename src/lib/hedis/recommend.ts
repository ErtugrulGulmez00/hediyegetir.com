// Hediş öneri motoru: kural tabanlı puanlama. Saf fonksiyon; veritabanına dokunmaz.
import {
  BUDGET_TOLERANCE,
  budgetByKey,
  hobbyByKey,
  occasionByKey,
  MAX_PER_CATEGORY,
  recipientByKey,
  RESULT_COUNT,
  WEIGHTS,
  type BudgetKey,
  type GenderKey,
} from "./config";

export type HedisAnswers = {
  recipient: string;
  /** Kişinin cinsiyeti belli değilse sorulur; null = fark etmez */
  gender: Exclude<GenderKey, "UNISEX"> | null;
  /** Belirtilmediyse bütçe puanlanmaz */
  budget?: BudgetKey;
  /** Boş = emin değilim */
  hobbies: string[];
  /** Özel gün (OCCASIONS anahtarı) */
  occasion?: string;
};

export type Candidate = {
  id: string;
  priceKurus: number;
  recipients: string[];
  gender: GenderKey;
  hobbies: string[];
  isFeatured: boolean;
  categoryId: string | null;
  createdAt: Date;
  occasions?: string[];
};

export type BudgetFit = "in" | "above" | "below" | "out";

export type Recommendation = {
  id: string;
  score: number;
  /** Kullanıcıya gösterilen kısa "neden" etiketleri */
  reasons: string[];
  /** Tam eşleşme değil; yer doldurmak için eklendi */
  fallback: boolean;
};

export type RecommendResult = {
  items: Recommendation[];
  /** Kişi ve bütçeyle gerçekten eşleşen ürün sayısı */
  strongCount: number;
};

export function budgetFit(priceKurus: number, budget: BudgetKey): BudgetFit {
  const b = budgetByKey(budget);
  if (!b) return "out";
  const aboveMin = b.minExclusive == null || priceKurus > b.minExclusive;
  const belowMax = b.maxInclusive == null || priceKurus <= b.maxInclusive;
  if (aboveMin && belowMax) return "in";
  if (!belowMax && b.maxInclusive != null && priceKurus <= b.maxInclusive * (1 + BUDGET_TOLERANCE)) return "above";
  if (!aboveMin && b.minExclusive != null && priceKurus > b.minExclusive * (1 - BUDGET_TOLERANCE)) return "below";
  return "out";
}

/** Hedef kişinin cinsiyeti: kişiden belliyse o, değilse kullanıcının cevabı */
export function targetGender(answers: HedisAnswers): Exclude<GenderKey, "UNISEX"> | null {
  return recipientByKey(answers.recipient)?.gender ?? answers.gender;
}

function scoreOne(p: Candidate, a: HedisAnswers) {
  const recipient = recipientByKey(a.recipient);
  const gender = targetGender(a);
  const reasons: string[] = [];
  let score = 0;

  const recipientMatch = p.recipients.includes(a.recipient);
  if (recipientMatch) {
    score += WEIGHTS.recipientMatch;
    if (recipient) reasons.push(`${recipient.yonelme} uygun`);
  }

  let genderOk = true;
  if (gender) {
    if (p.gender === gender || p.gender === "UNISEX") score += WEIGHTS.genderMatch;
    else {
      score += WEIGHTS.genderMismatch;
      genderOk = false;
    }
  }

  const fit: BudgetFit | "none" = a.budget ? budgetFit(p.priceKurus, a.budget) : "none";
  if (fit === "in") {
    score += WEIGHTS.inBudget;
    reasons.push("Bütçene uygun");
  } else if (fit === "above") {
    score += WEIGHTS.nearBudget;
    reasons.push("Bütçeni biraz aşıyor");
  } else if (fit === "below") {
    score += WEIGHTS.nearBudget;
    reasons.push("Bütçenin biraz altında");
  }

  for (const h of a.hobbies) {
    if (p.hobbies.includes(h)) {
      score += WEIGHTS.perHobby;
      const label = hobbyByKey(h)?.label;
      if (label) reasons.push(`${label} sevenlere`);
    }
  }

  if (a.occasion && p.occasions?.includes(a.occasion)) {
    score += WEIGHTS.occasion;
    const label = occasionByKey(a.occasion)?.label;
    if (label) reasons.push(`${label} için uygun`);
  }

  if (p.isFeatured) score += WEIGHTS.featured;

  return { score, reasons, genderOk, strong: genderOk && recipientMatch && fit !== "out" };
}

export function recommend(candidates: Candidate[], answers: HedisAnswers): RecommendResult {
  const scored = candidates
    .map((p) => ({ p, ...scoreOne(p, answers) }))
    .filter((x) => x.genderOk)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.p.isFeatured) - Number(a.p.isFeatured) ||
        b.p.createdAt.getTime() - a.p.createdAt.getTime(),
    );

  const strong = scored.filter((x) => x.strong);
  const rest = scored.filter((x) => !x.strong);

  // Çeşitlilik: mümkünse aynı kategoriden en fazla MAX_PER_CATEGORY ürün
  const picked: typeof scored = [];
  const perCategory = new Map<string, number>();
  const take = (pool: typeof scored, respectLimit: boolean) => {
    for (const x of pool) {
      if (picked.length >= RESULT_COUNT) return;
      if (picked.includes(x)) continue;
      const cat = x.p.categoryId ?? "_";
      const n = perCategory.get(cat) ?? 0;
      if (respectLimit && n >= MAX_PER_CATEGORY) continue;
      picked.push(x);
      perCategory.set(cat, n + 1);
    }
  };
  take(strong, true);
  take(strong, false);
  const strongPicked = picked.length;
  take(rest, true);
  take(rest, false);

  return {
    strongCount: strongPicked,
    items: picked.map((x, i) => ({
      id: x.p.id,
      score: x.score,
      reasons: x.reasons.slice(0, 3),
      fallback: i >= strongPicked,
    })),
  };
}
