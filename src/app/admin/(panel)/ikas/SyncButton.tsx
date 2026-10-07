"use client";

import { useActionState } from "react";
import { runIkasSyncAction, type SyncState } from "../../actions";

export function SyncButton() {
  const [state, action, pending] = useActionState<SyncState>(runIkasSyncAction, {});
  const r = state.report;
  return (
    <form action={action} className="mt-4">
      <button type="submit" className="btn btn-ana" disabled={pending}>
        {pending ? "Senkronlanıyor… (biraz sürebilir)" : "Şimdi senkronla"}
      </button>
      {r && (
        <p role="status" className="mt-3 font-semibold">
          {r.status === "FAILED" ? "Senkron başarısız." : "Bitti:"} {r.added} yeni, {r.updated} güncellendi, {r.deactivated} pasife
          alındı, {r.failed} hata.
        </p>
      )}
    </form>
  );
}
