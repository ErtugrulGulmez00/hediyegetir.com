"use client";

import { useActionState } from "react";
import { saveSettingsAction, type SettingsState } from "../../actions";
import { Field, inputClass } from "../ui";

export function SettingsForm({
  initial,
}: {
  initial: { whatsappNumber: string; whatsappGreeting: string; instagramUrl: string };
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettingsAction, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="WhatsApp numarası" hint="Sepet ve 'WhatsApp'tan sor' mesajları bu numaraya gider. Ör. 0532 123 45 67">
        <input name="whatsappNumber" defaultValue={initial.whatsappNumber} inputMode="tel" className={inputClass} />
      </Field>
      <Field label="Mesajın ilk cümlesi" hint="Sepet mesajı bu cümleyle başlar, altına ürünler eklenir.">
        <textarea name="whatsappGreeting" defaultValue={initial.whatsappGreeting} className={`${inputClass} min-h-20`} />
      </Field>
      <Field label="Instagram adresi" hint="Boş bırakırsan sitede gösterilmez.">
        <input name="instagramUrl" defaultValue={initial.instagramUrl} placeholder="https://instagram.com/hesabin" className={inputClass} />
      </Field>
      {state.error && <p role="alert" className="font-semibold text-kiremit-koyu">{state.error}</p>}
      {state.ok && <p role="status" className="font-semibold text-zeytin">Kaydedildi.</p>}
      <button type="submit" className="btn btn-ana self-start" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
