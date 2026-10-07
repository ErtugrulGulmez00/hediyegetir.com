"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";
import { Field, inputClass } from "../(panel)/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-5 flex flex-col gap-4">
      <Field label="Kullanıcı adı">
        <input name="username" autoComplete="username" required className={inputClass} />
      </Field>
      <Field label="Şifre">
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-kiremit-koyu">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-ana mt-1" disabled={pending}>
        {pending ? "Kontrol ediliyor…" : "Giriş yap"}
      </button>
    </form>
  );
}
