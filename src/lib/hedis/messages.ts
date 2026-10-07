// Hediş'in sesi: sıcak, kısa, "sen" dili. Türkçe ekler config'teki hazır çekimlerden gelir.
import type { Recipient } from "./config";

export const MSG = {
  greeting: "Merhaba, ben Hediş! Kime ne alacağını birlikte bulalım. Birkaç soru soracağım, söz, kısa sürecek.",
  greetingReturning: (last: Recipient | undefined) =>
    last
      ? `Yine geldin! Geçen sefer ${last.yonelme.toLocaleLowerCase("tr-TR")} bakıyorduk. Bu sefer kime?`
      : "Yine geldin! Bu sefer kime bakıyoruz?",
  askRecipient: "Hediye kime?",
  askGender: (r: Recipient) => `${r.iyelik} için kadın ürünlerine mi bakayım, erkek ürünlerine mi?`,
  askBudget: (r: Recipient) => `${r.yonelme} ne kadar ayırmayı düşünüyorsun?`,
  askHobbies: (r: Recipient) => `${r.iyelik} nelerden hoşlanır? En fazla 3 tane seçebilirsin.`,
  thinking: (r: Recipient) => [
    "Raflara bakıyorum…",
    "Kurdeleleri tek tek açıyorum…",
    `${r.iyelik} zevkine göre eliyorum…`,
    "Son bir kontrol…",
  ],
  resultTitle: (r: Recipient, n: number) => `${r.yonelme} özel ${n} hediye`,
  resultIntro: (strong: number, total: number) => {
    if (total === 0) return "Şu an rafta uygun bir şey bulamadım. Mağazaya göz atmak ister misin?";
    if (strong === 0) return "Tam tarif ettiğin gibi bir şey bulamadım, ama bunlar yakın olabilir.";
    if (strong < total) return `Sana tam uyan ${strong} hediye buldum, yanına birkaç alternatif ekledim.`;
    return "Bunları senin için seçtim. Kartlara dokunup yakından bakabilirsin.";
  },
  error: "Bir şeyler ters gitti, raflara ulaşamadım. Bir daha dener misin?",
} as const;
