"use client";

import { useEffect, useRef, useState } from "react";
import type { HedisRehberRequest, HedisRehberResponse } from "@/app/api/hedis/oneri/route";
import { BUDGETS, HOBBIES, MAX_HOBBIES, budgetByKey, hobbyByKey, recipientByKey, type BudgetKey } from "@/lib/hedis/config";
import { MSG } from "@/lib/hedis/messages";
import type { MascotMood } from "./Mascot";
import {
  HedisActions,
  HedisHeader,
  HedisNote,
  HedisWelcome,
  OptionTag,
  OptionTags,
  readLastRecipient,
  Results,
  STARTERS,
  ThinkingDots,
  UserBubble,
  writeLastRecipient,
} from "./HedisParts";

type Gender = "KADIN" | "ERKEK" | null;
type Step = "recipient" | "gender" | "budget" | "hobbies" | "thinking" | "results" | "error";
type Answers = { recipient?: string; gender?: Gender; budget?: BudgetKey | null; hobbies?: string[] };

/** Sonuç çok hızlı gelse de "düşünüyor" anı okunabilsin */
const MIN_THINKING_MS = 1200;

const genderLabel = (g: Gender) => (g === "KADIN" ? "Kadın" : g === "ERKEK" ? "Erkek" : "Fark etmez");
const firstStep = (recipient: string | undefined): Step =>
  !recipient ? "recipient" : recipientByKey(recipient)?.gender ? "budget" : "gender";

/**
 * Hediş'in yapay zekasız modu: kişi, bütçe ve ilgi alanlarını seçeneklerle sorar, kural tabanlı
 * motordan öneri alır. Yapay zeka anahtarı yoksa ya da sohbet bir sorun yüzünden açılamazsa çalışır.
 */
export function HedisRehber({
  onBrowseShop,
  initialRecipient = null,
  switched = false,
}: {
  onBrowseShop: () => void;
  /** Sohbet modunda seçilmiş kişi; varsa o soru atlanır */
  initialRecipient?: string | null;
  /** Sohbet modundan bir sorun yüzünden geçildiyse kısa bir açıklama gösterilir */
  switched?: boolean;
}) {
  const start = initialRecipient && recipientByKey(initialRecipient) ? initialRecipient : undefined;
  const [step, setStep] = useState<Step>(firstStep(start));
  const [answers, setAnswers] = useState<Answers>(start ? { recipient: start } : {});
  const [hobbyDraft, setHobbyDraft] = useState<string[]>([]);
  const [result, setResult] = useState<HedisRehberResponse | null>(null);
  const [thinkingLine, setThinkingLine] = useState(0);
  const [returning, setReturning] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const recipient = answers.recipient ? recipientByKey(answers.recipient) : undefined;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage yalnızca mount sonrası okunabilir
    setReturning(readLastRecipient());
  }, []);

  useEffect(() => {
    if (step !== "thinking") return;
    const id = setInterval(() => setThinkingLine((n) => n + 1), 700);
    return () => clearInterval(id);
  }, [step]);

  // Her yeni soruda görünür alana kaydır
  useEffect(() => {
    if (step === firstStep(start) && !result) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [step, result, start]);

  const chooseRecipient = (key: string) => {
    setAnswers({ recipient: key });
    setStep(firstStep(key));
  };

  async function fetchResults(final: HedisRehberRequest) {
    setThinkingLine(0);
    setStep("thinking");
    try {
      const [res] = await Promise.all([
        fetch("/api/hedis/oneri", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(final),
        }).then((r) => (r.ok ? (r.json() as Promise<HedisRehberResponse>) : Promise.reject(new Error(String(r.status))))),
        new Promise((r) => setTimeout(r, MIN_THINKING_MS)),
      ]);
      setResult(res);
      // "Geçen sefer annen için bakmıştık" diye selamlayabilmek için iyelik hali
      const who = recipientByKey(final.recipient)?.iyelik;
      if (who) writeLastRecipient(who.toLocaleLowerCase("tr-TR"));
      setStep("results");
    } catch {
      setStep("error");
    }
  }

  const finishHobbies = (hobbies: string[]) => {
    if (!answers.recipient || answers.budget === undefined) return;
    setAnswers((a) => ({ ...a, hobbies }));
    void fetchResults({ recipient: answers.recipient, gender: answers.gender ?? null, budget: answers.budget, hobbies });
  };

  const restart = () => {
    setAnswers({});
    setHobbyDraft([]);
    setResult(null);
    setStep("recipient");
  };

  const toggleHobby = (key: string) =>
    setHobbyDraft((list) => (list.includes(key) ? list.filter((k) => k !== key) : list.length < MAX_HOBBIES ? [...list, key] : list));

  // Cevaplanmış sorular (soru → cevap balonu)
  const history: { q: string; a: string }[] = [];
  if (recipient) {
    history.push({ q: MSG.askRecipient, a: recipient.label });
    if (!recipient.gender && answers.gender !== undefined) history.push({ q: MSG.askGender(recipient), a: genderLabel(answers.gender) });
    if (answers.budget !== undefined)
      history.push({ q: MSG.askBudget(recipient), a: answers.budget ? budgetByKey(answers.budget)!.label : "Fark etmez" });
    if (answers.hobbies && step !== "hobbies")
      history.push({
        q: MSG.askHobbies(recipient),
        a: answers.hobbies.length ? answers.hobbies.map((h) => hobbyByKey(h)?.label).join(", ") : "Emin değilim",
      });
  }

  const mood: MascotMood =
    step === "thinking" ? "thinking" : step === "results" && result && result.products.length > 0 ? "happy" : "talking";
  const greeting = returning ? MSG.greetingReturning(returning) : MSG.greeting;
  const chips = [
    recipient?.label,
    answers.budget ? budgetByKey(answers.budget)?.label : null,
  ].filter((c): c is string => !!c);

  const welcome = history.length === 0 && step === "recipient";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      {welcome ? (
        <HedisWelcome mood={mood} bumpKey={0} ai={false}>
          <p>{switched ? MSG.switched : greeting}</p>
        </HedisWelcome>
      ) : (
        <HedisHeader mood={mood} bumpKey={history.length} ai={false} />
      )}

      {/* Canlı bölge baştan var olsun ki ilk sorular da ekran okuyucuya duyurulsun */}
      <ol aria-label="Hediş ile konuşma" aria-live="polite" className={`flex flex-col gap-4 ${welcome ? "" : "mt-6"}`}>
        {!welcome && (
          <li>
            <HedisNote>
              <p>{switched ? MSG.switched : greeting}</p>
            </HedisNote>
          </li>
        )}

        {history.map((h, i) => (
          <li key={i} className="flex flex-col gap-4">
            {/* İlk soru selamlamanın içinde soruluyor; tekrar etme */}
            {i > 0 && (
              <HedisNote>
                <p>{h.q}</p>
              </HedisNote>
            )}
            <div className="flex justify-end">
              <UserBubble>{h.a}</UserBubble>
            </div>
          </li>
        ))}

        {step !== "recipient" && step !== "thinking" && step !== "results" && step !== "error" && recipient && (
          <li>
            <HedisNote>
              <p>
                {step === "gender" && MSG.askGender(recipient)}
                {step === "budget" && MSG.askBudget(recipient)}
                {step === "hobbies" && MSG.askHobbies(recipient)}
              </p>
            </HedisNote>
          </li>
        )}

        {step === "thinking" && recipient && (
          <li>
            <HedisNote>
              <p className="ai-isilti font-semibold">{MSG.thinking(recipient)[thinkingLine % MSG.thinking(recipient).length]}</p>
              <ThinkingDots />
            </HedisNote>
          </li>
        )}

        {step === "results" && result && (
          <li className="flex flex-col gap-4">
            <HedisNote>
              <p>{MSG.resultIntro(result.strongCount, result.products.length)}</p>
            </HedisNote>
            {result.products.length > 0 ? (
              <Results products={result.products} title="Senin için seçtim" chips={chips} ai={false} />
            ) : (
              <button type="button" onClick={onBrowseShop} className="btn btn-ikincil self-start">
                Ürünlere göz at
              </button>
            )}
          </li>
        )}

        {step === "error" && (
          <li>
            <div role="alert" data-yuzey className="rounded-lg border-l-4 border-kiremit bg-kagit px-4 py-3">
              <p className="font-semibold">{MSG.error}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <button type="button" onClick={() => finishHobbies(answers.hobbies ?? [])} className="font-semibold underline underline-offset-2">
                  Tekrar dene
                </button>
                <button type="button" onClick={onBrowseShop} className="font-semibold underline underline-offset-2">
                  Ürünlere göz at
                </button>
              </div>
            </div>
          </li>
        )}
      </ol>
      <div ref={endRef} />

      {/* Seçenekler: ortada, hediye etiketi biçiminde */}
      <div className="mt-6">
        {step === "recipient" && (
          <OptionTags label="Hediye kime?">
            {STARTERS.map((s) => (
              <OptionTag key={s.key} onClick={() => chooseRecipient(s.key)}>
                {s.label}
              </OptionTag>
            ))}
          </OptionTags>
        )}

        {step === "gender" && (
          <OptionTags label="Kadın mı erkek mi?">
            {(["KADIN", "ERKEK", null] as const).map((g) => (
              <OptionTag
                key={String(g)}
                onClick={() => {
                  setAnswers((a) => ({ ...a, gender: g }));
                  setStep("budget");
                }}
              >
                {genderLabel(g)}
              </OptionTag>
            ))}
          </OptionTags>
        )}

        {step === "budget" && (
          <OptionTags label="Bütçe">
            {[...BUDGETS.map((b) => ({ key: b.key as BudgetKey | null, label: b.label })), { key: null, label: "Fark etmez" }].map((b) => (
              <OptionTag
                key={String(b.key)}
                onClick={() => {
                  setAnswers((a) => ({ ...a, budget: b.key }));
                  setHobbyDraft([]);
                  setStep("hobbies");
                }}
              >
                {b.label}
              </OptionTag>
            ))}
          </OptionTags>
        )}

        {step === "hobbies" && (
          <div className="flex flex-col items-center gap-4">
            <OptionTags label={`İlgi alanları (en fazla ${MAX_HOBBIES})`}>
              {HOBBIES.map((h) => {
                const on = hobbyDraft.includes(h.key);
                return (
                  <OptionTag
                    key={h.key}
                    active={on}
                    disabled={!on && hobbyDraft.length >= MAX_HOBBIES}
                    onClick={() => toggleHobby(h.key)}
                    className="disabled:opacity-40"
                  >
                    {h.label}
                  </OptionTag>
                );
              })}
            </OptionTags>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button type="button" onClick={() => finishHobbies([])} className="rounded-full bg-murekkep px-3.5 py-1.5 text-sm font-semibold text-krem underline underline-offset-2 hover:text-kagit">
                Emin değilim
              </button>
              <button type="button" onClick={() => finishHobbies(hobbyDraft)} disabled={hobbyDraft.length === 0} className="btn btn-ana min-h-10 py-1.5">
                Önerileri göster {hobbyDraft.length > 0 && `(${hobbyDraft.length})`}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <HedisActions onRestart={history.length > 0 ? restart : undefined} onBrowseShop={onBrowseShop} />
      </div>
    </div>
  );
}
