import { describe, expect, it } from "vitest";
import { budgetKeyFor, catalogText, parseChatReply, profileToAnswers, sanitizeTurns, systemPrompt } from "./ai-chat";

const ids = new Set(["p1", "p2", "p3"]);

describe("parseChatReply", () => {
  it("soru aşamasını ve profili okur, bilinmeyen anahtarları atar", () => {
    const r = parseChatReply(
      `{"mesaj": "Eşin kullanışlı hediyelerden mi hoşlanır, yoksa duygusal olanlardan mı?",
        "secenekler": ["Kullanışlı", "Duygusal", "Kullanışlı"], "asama": "soru",
        "profil": {"kime": "es", "kimeMetin": "eşim", "cinsiyet": "KADIN", "butceMaxTL": 1000, "ozelGun": "yildonumu", "ilgiler": ["moda", "uçmak"]},
        "oneriler": []}`,
      ids,
    );
    expect(r).toMatchObject({
      stage: "question",
      quickReplies: ["Kullanışlı", "Duygusal"],
      profile: { recipient: "es", recipientText: "eşim", gender: "KADIN", budgetMaxKurus: 100_000, occasion: "yildonumu", hobbies: ["moda"] },
      picks: [],
    });
  });

  it("öneri aşamasında katalogda olmayan ve tekrar eden ürünleri atar", () => {
    const r = parseChatReply(
      `{"mesaj": "Bunları seçtim.", "asama": "oneri", "profil": {},
        "oneriler": [{"id": "p2", "neden": "Emeklilik için anlamlı."}, {"id": "uydurma", "neden": "x"}, {"id": "p2", "neden": "y"}, {"id": "p1"}]}`,
      ids,
    );
    expect(r?.stage).toBe("recommend");
    expect(r?.picks).toEqual([
      { id: "p2", reason: "Emeklilik için anlamlı." },
      { id: "p1", reason: "" },
    ]);
  });

  it("geçerli ürün varsa asama yanlış yazılmış olsa da öneri sayılır", () => {
    expect(parseChatReply('{"mesaj": "İşte", "asama": "?", "oneriler": [{"id": "p3"}]}', ids)?.stage).toBe("recommend");
  });

  it("mesaj yoksa ya da JSON değilse null döner", () => {
    expect(parseChatReply('{"asama": "soru"}', ids)).toBeNull();
    expect(parseChatReply("merhaba", ids)).toBeNull();
  });
});

describe("yardımcılar", () => {
  it("bütçe bandı", () => {
    expect(budgetKeyFor(null)).toBeUndefined();
    expect(budgetKeyFor(50_000)).toBe("0-500");
    expect(budgetKeyFor(100_000)).toBe("500-1000");
    expect(budgetKeyFor(150_000)).toBe("1000+");
  });

  it("profil kişi içermiyorsa yedek motor için cevap üretmez", () => {
    const base = { recipientText: null, gender: null, budgetMaxKurus: null, occasion: null, hobbies: [] };
    expect(profileToAnswers({ ...base, recipient: null })).toBeNull();
    expect(profileToAnswers({ ...base, recipient: "baba", occasion: "emeklilik", budgetMaxKurus: 80_000 })).toEqual({
      recipient: "baba",
      gender: null,
      budget: "500-1000",
      hobbies: [],
      occasion: "emeklilik",
    });
  });

  it("geçmişi temizler ve sınırlar", () => {
    const long = "a".repeat(2000);
    const turns = sanitizeTurns([{ role: "user", text: "  " }, { role: "user", text: long }]);
    expect(turns).toHaveLength(1);
    expect(turns[0].text).toHaveLength(600);
  });

  it("katalog satırı ve sistem istemi gerekli bilgileri içerir", () => {
    const line = catalogText([
      {
        id: "p1",
        name: "Saat",
        category: "Aksesuar",
        priceKurus: 500_000,
        recipients: ["baba"],
        gender: "UNISEX",
        hobbies: [],
        occasions: ["emeklilik"],
        tags: ["metal"],
        description: "Şık   saat",
      },
    ]);
    expect(line).toBe("p1 | Saat | Aksesuar | 5000 TL | kime:baba | cinsiyet:UNISEX | ilgi:- | gün:emeklilik | etiket:metal | Şık saat");
    const sys = systemPrompt(line, 1);
    expect(sys).toContain("Katalog (1 ürün");
    expect(sys).toContain("EN FAZLA BİR soru");
  });
});
