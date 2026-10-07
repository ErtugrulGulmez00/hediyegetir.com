import { formatPrice } from "./money";

export type WaLine = { name: string; qty: number; unitPriceKurus: number; url: string };

/**
 * Kullanıcının girdiği numarayı wa.me biçimine (ülke kodlu, yalnız rakam) çevirir.
 * "0532 123 45 67", "+90 532 123 4567", "5321234567" -> "905321234567"
 */
export function normalizeWhatsappNumber(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = "90" + digits.slice(1);
  else if (digits.length === 10 && digits.startsWith("5")) digits = "90" + digits;
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}

export function waLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function cartSubtotal(lines: Pick<WaLine, "qty" | "unitPriceKurus">[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitPriceKurus, 0);
}

export function buildCartMessage(greeting: string, lines: WaLine[]): string {
  const items = lines.map((l, i) => {
    const total = l.qty > 1 ? ` = ${formatPrice(l.qty * l.unitPriceKurus)}` : "";
    return `${i + 1}) ${l.name}\n   ${l.qty} adet × ${formatPrice(l.unitPriceKurus)}${total}\n   ${l.url}`;
  });
  return [
    greeting.trim(),
    "",
    items.join("\n\n"),
    "",
    `Ara toplam: ${formatPrice(cartSubtotal(lines))}`,
    "Ödeme ve kargo detaylarını konuşabilir miyiz?",
  ]
    .join("\n")
    .replace(/ /g, " ");
}

export function buildProductQuestion(p: { name: string; url: string; priceKurus: number }): string {
  return [
    `Merhaba! "${p.name}" (${formatPrice(p.priceKurus)}) hakkında bilgi almak istiyorum.`,
    p.url,
  ]
    .join("\n")
    .replace(/ /g, " ");
}
