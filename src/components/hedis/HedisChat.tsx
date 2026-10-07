"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HedisProduct, HedisResponse } from "@/app/api/hedis/oneri/route";
import { ProductCard } from "@/components/site/ProductCard";
import { Scribble } from "@/components/ui/Scribble";
import { Tape } from "@/components/ui/Tape";
import { TagChip } from "@/components/ui/TagChip";
import { BUDGETS, HOBBIES, MAX_HOBBIES, RECIPIENTS, budgetByKey, hobbyByKey, recipientByKey, type BudgetKey, type Recipient } from "@/lib/hedis/config";
import { MSG } from "@/lib/hedis/messages";
import { useCart } from "@/store/cart";
import { Mascot, type MascotMood } from "./Mascot";

type Step = "recipient" | "gender" | "budget" | "hobbies" | "thinking" | "results" | "error";
type GenderAnswer = "KADIN" | "ERKEK" | null;
type Answers = { recipient?: string; gender?: GenderAnswer; budget?: BudgetKey; hobbies?: string[] };

const MIN_THINKING_MS = 1600;
const LAST_KEY = "hg_hedis_son";

function readLast(): string | null {
  try {
    return JSON.parse(localStorage.getItem(LAST_KEY) ?? "null")?.recipient ?? null;
  } catch {
    return null;
  }
}
function writeLast(recipient: string) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ recipient, at: Date.now() }));
  } catch {
    // depolama kapalıysa sorun değil
  }
}

const genderLabel = (g: GenderAnswer) => (g === "KADIN" ? "Kadın" : g === "ERKEK" ? "Erkek" : "Fark etmez");

export function HedisChat() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>("recipient");
  const [answers, setAnswers] = useState<Answers>({});
  const [hobbyDraft, setHobbyDraft] = useState<string[]>([]);
  const [result, setResult] = useState<HedisResponse | null>(null);
  const [thinkingLine, setThinkingLine] = useState(0);
  const [returning, setReturning] = useState<{ recipient: Recipient | undefined } | null>(null);
  const interacted = useRef(false);

  // Yeni soru başlığı DOM'a girdiği anda odaklan (ilk yüklemede değil). Efekt yerine callback ref:
  // geçiş animasyonu yüzünden yeni başlık, adım değiştikten bir süre sonra yüklenir.
  const questionRef = useCallback(
    (el: HTMLHeadingElement | null) => {
      if (!el || !interacted.current) return;
      el.focus({ preventScroll: true });
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    },
    [reduce],
  );

  const recipient = answers.recipient ? recipientByKey(answers.recipient) : undefined;

  // Dönen ziyaretçiyi tanı (yalnızca tarayıcıda)
  useEffect(() => {
    const last = readLast();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage yalnızca mount sonrası okunabilir
    if (last) setReturning({ recipient: recipientByKey(last) });
  }, []);

  // Düşünürken dönen cümleler
  useEffect(() => {
    if (step !== "thinking") return;
    const id = setInterval(() => setThinkingLine((n) => n + 1), 650);
    return () => clearInterval(id);
  }, [step]);

  const go = (next: Step, patch: Answers = {}) => {
    interacted.current = true;
    setAnswers((a) => ({ ...a, ...patch }));
    setStep(next);
  };

  const chooseRecipient = (key: string) => {
    const r = recipientByKey(key)!;
    // Kişi değişince sonraki cevaplar geçersiz olur
    setAnswers({ recipient: key });
    interacted.current = true;
    setStep(r.gender ? "budget" : "gender");
  };

  async function fetchResults(final: Required<Pick<Answers, "recipient" | "budget" | "hobbies">> & { gender: GenderAnswer }) {
    setThinkingLine(0);
    go("thinking", { hobbies: final.hobbies });
    try {
      const [res] = await Promise.all([
        fetch("/api/hedis/oneri", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(final),
        }).then((r) => (r.ok ? (r.json() as Promise<HedisResponse>) : Promise.reject(new Error(String(r.status))))),
        new Promise((r) => setTimeout(r, MIN_THINKING_MS)),
      ]);
      setResult(res);
      writeLast(final.recipient);
      setStep("results");
    } catch {
      setStep("error");
    }
  }

  const finishHobbies = (hobbies: string[]) => {
    if (!answers.recipient || !answers.budget) return;
    void fetchResults({ recipient: answers.recipient, budget: answers.budget, hobbies, gender: answers.gender ?? null });
  };

  const restart = () => {
    interacted.current = true;
    setAnswers({});
    setHobbyDraft([]);
    setResult(null);
    setStep("recipient");
  };

  const editFrom = (s: "recipient" | "gender" | "budget" | "hobbies") => {
    interacted.current = true;
    setResult(null);
    if (s === "recipient") setAnswers({});
    if (s === "gender") setAnswers((a) => ({ recipient: a.recipient }));
    if (s === "budget") setAnswers((a) => ({ recipient: a.recipient, gender: a.gender }));
    if (s === "hobbies") setHobbyDraft(answers.hobbies ?? []);
    setStep(s);
  };

  const mood: MascotMood = step === "thinking" ? "thinking" : step === "results" && result && result.products.length > 0 ? "happy" : "talking";

  // --- Geçmiş (cevaplanmış sorular) ---
  const history: { q: string; a: string; edit: "recipient" | "gender" | "budget" | "hobbies" }[] = [];
  if (answers.recipient && recipient) {
    history.push({ q: MSG.askRecipient, a: recipient.label, edit: "recipient" });
    if (!recipient.gender && answers.gender !== undefined) history.push({ q: MSG.askGender(recipient), a: genderLabel(answers.gender), edit: "gender" });
    if (answers.budget) history.push({ q: MSG.askBudget(recipient), a: budgetByKey(answers.budget)!.label, edit: "budget" });
    if (answers.hobbies && (step === "thinking" || step === "results" || step === "error"))
      history.push({
        q: MSG.askHobbies(recipient),
        a: answers.hobbies.length ? answers.hobbies.map((h) => hobbyByKey(h)?.label).join(", ") : "Emin değilim",
        edit: "hobbies",
      });
  }

  const greeting = returning ? MSG.greetingReturning(returning.recipient) : MSG.greeting;

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-12">
      {/* Maskot: masaüstünde solda sabit */}
      <div className="flex items-end gap-4 lg:sticky lg:top-6 lg:block lg:self-start">
        <Mascot mood={mood} bumpKey={step} className="size-28 shrink-0 sm:size-36 lg:size-56" />
        <p className="pb-3 font-el text-2xl leading-tight text-murekkep-soluk lg:mt-4 lg:pb-0">
          Hediş, <br className="hidden lg:block" />
          hediye bulma asistanın
        </p>
      </div>

      <div className="min-w-0">
        <ol aria-label="Hediş ile konuşma" className="flex flex-col gap-4">
          <li>
            <HedisNote>
              <p>{greeting}</p>
              <p className="mt-2 text-sm text-murekkep-soluk">
                Kendin bakmayı mı tercih edersin?{" "}
                <Link href="/magaza" className="link-el font-semibold text-murekkep">
                  Mağazaya geç
                </Link>
              </p>
            </HedisNote>
          </li>
          {history.map((h) => (
            <li key={h.edit} className="flex flex-col gap-2">
              <HedisNote compact>{h.q}</HedisNote>
              <UserAnswer onEdit={step === "thinking" ? undefined : () => editFrom(h.edit)}>{h.a}</UserAnswer>
            </li>
          ))}
        </ol>

        <div aria-live="polite" className="mt-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.section
              key={step}
              initial={reduce ? false : { opacity: 0, y: 12, rotate: -0.4 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              aria-labelledby="hedis-soru"
            >
              {step === "recipient" && (
                <Question title={MSG.askRecipient} questionRef={questionRef}>
                  <div className="flex flex-wrap gap-2">
                    {RECIPIENTS.map((r) => (
                      <TagChip key={r.key} onClick={() => chooseRecipient(r.key)} active={answers.recipient === r.key}>
                        {r.label}
                      </TagChip>
                    ))}
                  </div>
                </Question>
              )}

              {step === "gender" && recipient && (
                <Question title={MSG.askGender(recipient)} questionRef={questionRef}>
                  <div className="flex flex-wrap gap-2">
                    {(["KADIN", "ERKEK", null] as const).map((g) => (
                      <TagChip key={String(g)} onClick={() => go("budget", { gender: g })}>
                        {genderLabel(g)}
                      </TagChip>
                    ))}
                  </div>
                </Question>
              )}

              {step === "budget" && recipient && (
                <Question title={MSG.askBudget(recipient)} questionRef={questionRef}>
                  <div className="flex flex-wrap gap-2">
                    {BUDGETS.map((b) => (
                      <TagChip key={b.key} className="text-base" onClick={() => go("hobbies", { budget: b.key })}>
                        {b.label}
                      </TagChip>
                    ))}
                  </div>
                </Question>
              )}

              {step === "hobbies" && recipient && (
                <Question title={MSG.askHobbies(recipient)} questionRef={questionRef}>
                  <div className="flex flex-wrap gap-2">
                    {HOBBIES.map((h) => {
                      const on = hobbyDraft.includes(h.key);
                      const full = hobbyDraft.length >= MAX_HOBBIES && !on;
                      return (
                        <TagChip
                          key={h.key}
                          active={on}
                          disabled={full}
                          className={full ? "opacity-45" : ""}
                          onClick={() => setHobbyDraft((d) => (on ? d.filter((k) => k !== h.key) : [...d, h.key]))}
                        >
                          {h.label}
                        </TagChip>
                      );
                    })}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button type="button" className="btn btn-ana" disabled={hobbyDraft.length === 0} onClick={() => finishHobbies(hobbyDraft)}>
                      Hediyeleri göster
                    </button>
                    <button
                      type="button"
                      className="px-2 py-2 font-semibold text-murekkep-soluk underline-offset-4 hover:text-murekkep hover:underline"
                      onClick={() => {
                        setHobbyDraft([]);
                        finishHobbies([]);
                      }}
                    >
                      Emin değilim, sen seç
                    </button>
                    <span className="text-sm text-murekkep-soluk" aria-live="polite">
                      {hobbyDraft.length}/{MAX_HOBBIES} seçildi
                    </span>
                  </div>
                </Question>
              )}

              {step === "thinking" && recipient && (
                <HedisNote>
                  <div className="flex items-center gap-4">
                    {/* Mobilde büyük maskot ekranın yukarısında kalır; burada küçüğü görünsün */}
                    <Mascot mood="thinking" className="size-16 shrink-0 lg:hidden" />
                    <div>
                      <h2 id="hedis-soru" ref={questionRef} tabIndex={-1} className="font-el text-3xl font-normal outline-none">
                        {MSG.thinking(recipient)[Math.min(thinkingLine, MSG.thinking(recipient).length - 1)]}
                      </h2>
                      <ThinkingDots />
                    </div>
                  </div>
                </HedisNote>
              )}

              {step === "error" && (
                <HedisNote>
                  <h2 id="hedis-soru" ref={questionRef} tabIndex={-1} className="text-xl outline-none">
                    {MSG.error}
                  </h2>
                  <button type="button" className="btn btn-ana mt-4" onClick={() => finishHobbies(answers.hobbies ?? [])}>
                    Tekrar dene
                  </button>
                </HedisNote>
              )}

              {step === "results" && recipient && result && (
                <Results recipient={recipient} result={result} questionRef={questionRef} onRestart={restart} />
              )}
            </motion.section>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function HedisNote({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`kagit relative max-w-xl ${compact ? "px-4 py-2.5 text-[0.95rem] text-murekkep-soluk" : "px-5 pt-6 pb-5"}`}>
      {!compact && <Tape color="gul" rotate={-4} className="-top-3 left-5 h-5 w-16" />}
      {!compact && <span className="mb-1 block font-el text-lg leading-none text-kiremit-koyu">Hediş</span>}
      {children}
    </div>
  );
}

function UserAnswer({ children, onEdit }: { children: React.ReactNode; onEdit?: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3">
      {onEdit && (
        <button type="button" onClick={onEdit} className="text-sm text-murekkep-soluk underline-offset-2 hover:text-murekkep hover:underline">
          değiştir
        </button>
      )}
      <span
        className="relative inline-flex items-center bg-murekkep py-1.5 pr-4 pl-7 font-semibold text-kagit"
        style={{ clipPath: "polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)" }}
      >
        <span aria-hidden className="absolute top-1/2 left-2.5 size-1.5 -translate-y-1/2 rounded-full bg-krem" />
        <span className="sr-only">Senin cevabın: </span>
        {children}
      </span>
    </div>
  );
}

function Question({
  title,
  children,
  questionRef,
}: {
  title: string;
  children: React.ReactNode;
  questionRef: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <HedisNote>
        <h2 id="hedis-soru" ref={questionRef} tabIndex={-1} className="font-govde text-xl leading-snug font-bold outline-none">
          {title}
        </h2>
      </HedisNote>
      <div className="pl-1">{children}</div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span aria-hidden className="mt-3 flex gap-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-2.5 rounded-full bg-kiremit"
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function Results({
  recipient,
  result,
  questionRef,
  onRestart,
}: {
  recipient: Recipient;
  result: HedisResponse;
  questionRef: React.Ref<HTMLHeadingElement>;
  onRestart: () => void;
}) {
  const n = result.products.length;
  return (
    <div>
      <h2 id="hedis-soru" ref={questionRef} tabIndex={-1} className="text-3xl outline-none sm:text-4xl">
        {n > 0 ? <Scribble>{MSG.resultTitle(recipient, n)}</Scribble> : "Hmm…"}
      </h2>
      <p className="mt-4 max-w-xl">{MSG.resultIntro(result.strongCount, n)}</p>

      {n > 0 && (
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6">
          {result.products.map((p, i) => (
            <li key={p.id}>
              <ResultCard product={p} index={i} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12 flex flex-wrap items-center gap-3 border-t-2 border-dashed border-kraft-koyu pt-6">
        <Link href="/magaza" className="btn btn-ana">
          Diğer ürünlere göz at →
        </Link>
        <button type="button" className="btn btn-ikincil" onClick={onRestart}>
          Baştan başla
        </button>
      </div>
    </div>
  );
}

function ResultCard({ product, index }: { product: HedisProduct; index: number }) {
  const add = useCart((s) => s.add);
  const inCart = useCart((s) => s.lines.some((l) => l.productId === product.id));
  return (
    <ProductCard product={product} index={index} priority={index < 2}>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Neden önerdim">
        {product.fallback && <li className="bg-krem-koyu px-1.5 py-0.5 text-xs font-semibold text-murekkep-soluk">alternatif</li>}
        {product.reasons.map((r) => (
          <li key={r} className="border border-zeytin/50 px-1.5 py-0.5 text-xs font-semibold text-zeytin">
            {r}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => add(product.id)}
        disabled={inCart}
        className={`mt-3 w-full border-2 border-murekkep px-2 py-1.5 text-sm font-bold transition-colors ${
          inCart ? "bg-zeytin text-kagit" : "bg-kagit hover:bg-krem-koyu"
        }`}
      >
        {inCart ? "Sepette" : "Sepete ekle"}
      </button>
    </ProductCard>
  );
}
