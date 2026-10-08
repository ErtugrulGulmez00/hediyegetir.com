import { describe, expect, it } from "vitest";
import { mergeSuggestion } from "./merge";

const empty = {
  name: "",
  description: "",
  categoryId: "",
  recipients: [] as string[],
  hobbies: [] as string[],
  gender: "UNISEX" as const,
  occasions: [] as string[],
  tags: [] as string[],
  features: [] as string[],
  hedisReviewed: true,
};
const sug = {
  name: "Örgü Elbise",
  description: "Pamuk ipten.",
  features: ["Pamuk ip"],
  categoryId: "c2",
  gender: "KADIN" as const,
  recipients: ["anne"],
  hobbies: ["moda"],
  occasions: ["dogum-gunu"],
  tags: ["el örgüsü"],
  alts: [],
};

describe("mergeSuggestion", () => {
  it("boş formu doldurur, etiket onayını kaldırır", () => {
    const { next, filled } = mergeSuggestion(empty, sug);
    expect(next).toMatchObject({ name: "Örgü Elbise", categoryId: "c2", gender: "KADIN", occasions: ["dogum-gunu"], hedisReviewed: false });
    expect(filled).toEqual(["name", "description", "category", "audience", "occasions", "tags", "features"]);
  });

  it("admin'in doldurduğu alanlara dokunmaz", () => {
    const form = { ...empty, name: "Benim adım", categoryId: "c1", hobbies: ["okuma"], gender: "ERKEK" as const, occasions: ["yilbasi"] };
    const { next, filled } = mergeSuggestion(form, sug);
    expect(next).toMatchObject({ name: "Benim adım", categoryId: "c1", hobbies: ["okuma"], gender: "ERKEK", occasions: ["yilbasi"] });
    expect(filled).toEqual(["description", "tags", "features"]);
    // Etiketler doldurulduğu için onay kalkar
    expect(next.hedisReviewed).toBe(false);
  });

  it("yalnızca ad/açıklama doldurulursa etiket onayına dokunmaz", () => {
    const form = { ...empty, recipients: ["baba"], occasions: ["yilbasi"], tags: ["x"], features: ["y"] };
    expect(mergeSuggestion(form, sug).next.hedisReviewed).toBe(true);
  });
});

describe("mergeSuggestion: yeniden analiz", () => {
  it("AI'ın doldurup admin'in dokunmadığı alanları günceller, admin'inkine dokunmaz", () => {
    const form = { ...empty, name: "Admin adı", categoryId: "eski-ai", tags: ["eski"] };
    const { next, filled } = mergeSuggestion(form, sug, ["category", "tags"]);
    expect(next.name).toBe("Admin adı");
    expect(next.categoryId).toBe("c2");
    expect(next.tags).toEqual(["el örgüsü"]);
    expect(filled).toContain("category");
    expect(filled).toContain("tags");
  });
});
