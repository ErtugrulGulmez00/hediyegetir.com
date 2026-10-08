import { beforeEach, describe, expect, it } from "vitest";
import { MAX_QTY, useCart } from "./cart";

describe("sepet deposu", () => {
  beforeEach(() => useCart.getState().clear());

  it("persist eklentisi bağlı (localStorage yokken bile)", async () => {
    expect(useCart.persist).toBeDefined();
    await useCart.persist.rehydrate();
    expect(useCart.persist.hasHydrated()).toBe(true);
  });

  it("aynı ürünü ekleyince adedi artırır, sınırı aşmaz", () => {
    const { add } = useCart.getState();
    add("a");
    add("a", 2);
    add("b", 99);
    expect(useCart.getState().lines).toEqual([
      { productId: "a", qty: 3 },
      { productId: "b", qty: MAX_QTY },
    ]);
  });

  it("adet en az 1 olur; keepOnly sunucuda olmayanları düşürür", () => {
    const s = useCart.getState();
    s.add("a");
    s.add("b");
    s.setQty("a", 0);
    s.keepOnly(["a"]);
    expect(useCart.getState().lines).toEqual([{ productId: "a", qty: 1 }]);
  });

  it("sepeti boşaltmak notu ve hediye paketini de sıfırlar", () => {
    const s = useCart.getState();
    s.add("a");
    s.setNote("Lacivert olsun");
    s.setGiftWrap(true);
    s.clear();
    const after = useCart.getState();
    expect([after.lines, after.note, after.giftWrap]).toEqual([[], "", false]);
  });

  it("eski (sürüm 1) sepetin ürünlerini korur", () => {
    const migrated = useCart.persist.getOptions().migrate?.({ lines: [{ productId: "a", qty: 2 }] }, 1) as {
      lines: unknown;
      note: string;
      giftWrap: boolean;
    };
    expect(migrated).toMatchObject({ lines: [{ productId: "a", qty: 2 }], note: "", giftWrap: false });
  });
});
