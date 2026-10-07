import { describe, expect, it } from "vitest";
import { mergeSuggestion } from "./merge";

const empty = { name: "", description: "", categoryId: "", recipients: [], hobbies: [], gender: "UNISEX" as const, hedisReviewed: true };
const sug = {
  name: "Örgü Elbise",
  description: "Pamuk ipten.",
  categoryId: "c2",
  gender: "KADIN" as const,
  recipients: ["anne"],
  hobbies: ["moda"],
  alt: "Yeşil elbise",
};

describe("mergeSuggestion", () => {
  it("boş formu doldurur, etiket onayını kaldırır", () => {
    const { next, filled } = mergeSuggestion(empty, sug);
    expect(next).toMatchObject({ name: "Örgü Elbise", categoryId: "c2", gender: "KADIN", recipients: ["anne"], hedisReviewed: false });
    expect(filled).toEqual(["ad", "açıklama", "kategori", "Hediş etiketleri"]);
  });

  it("admin'in doldurduğu alanlara dokunmaz", () => {
    const form = { ...empty, name: "Benim adım", categoryId: "c1", hobbies: ["okuma"], gender: "ERKEK" as const };
    const { next, filled } = mergeSuggestion(form, sug);
    expect(next.name).toBe("Benim adım");
    expect(next.categoryId).toBe("c1");
    expect(next.hobbies).toEqual(["okuma"]);
    expect(next.gender).toBe("ERKEK");
    expect(next.hedisReviewed).toBe(true);
    expect(filled).toEqual(["açıklama"]);
  });

  it("boşluktan ibaret adı boş sayar", () => {
    expect(mergeSuggestion({ ...empty, name: "   " }, sug).next.name).toBe("Örgü Elbise");
  });
});
