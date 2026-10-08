import { describe, expect, it } from "vitest";
import { effectiveLayout, gridCellClass } from "./product-display";

describe("effectiveLayout", () => {
  it("tek fotoğrafta her düzen tek olur", () => {
    expect(effectiveLayout("IKILI", 1)).toBe("TEK");
    expect(effectiveLayout("UCLU", 0)).toBe("TEK");
  });

  it("üçlü, iki fotoğrafta ikiliye düşer", () => {
    expect(effectiveLayout("UCLU", 2)).toBe("IKILI");
    expect(effectiveLayout("UCLU", 3)).toBe("UCLU");
  });
});

describe("gridCellClass", () => {
  it("ikilide tek kalan son fotoğraf iki sütuna yayılır", () => {
    expect(gridCellClass("IKILI", 2, 3)).toContain("col-span-2");
    expect(gridCellClass("IKILI", 1, 2)).not.toContain("col-span-2");
  });

  it("üçlüde ilk fotoğraf büyük", () => {
    expect(gridCellClass("UCLU", 0, 3)).toContain("row-span-2");
    expect(gridCellClass("UCLU", 1, 3)).toBe("aspect-[4/5]");
  });
});
