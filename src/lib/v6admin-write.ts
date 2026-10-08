// Shared write plumbing for the V6 admin panel (/v10CtlPanel): the panel-wide
// write lock type, the toast hook and the single write flow every tab uses.
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminApiError, isUnknownResult } from "@/lib/v6admin-api";

// Panel-wide single-write lock (see AdminApp). acquire() is synchronous so a
// double tap cannot start two writes.
export type WriteLock = { acquire: () => boolean; release: () => void };

export type ToastState = { text: string; tone: "ok" | "error" } | null;

export function useToast(): [ToastState, (text: string, tone?: "ok" | "error") => void] {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const show = useCallback((text: string, tone: "ok" | "error" = "ok") => {
    setToast({ text, tone });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), tone === "error" ? 6000 : 2600);
  }, []);
  return [toast, show];
}

export function errText(err: unknown) {
  return err instanceof AdminApiError ? err.message : "操作失敗。";
}

// One write, the same way everywhere:
// - the panel-wide lock is held from the POST until every re-read has landed,
//   so nothing can be written against stale data in between;
// - a clear Worker rejection keeps the sheet open with the reason (retryable);
// - an unknown outcome (timeout, dropped connection, unreadable reply) closes
//   the sheet, re-reads and warns: the Worker may have applied it, so it is
//   never retried from the sheet (e.g. no second LINE push or duplicate event).
export async function runWrite<R>(o: {
  writeLock: WriteLock;
  work: () => Promise<R>;
  okText: string | ((result: R) => string);
  reread: (unknown: boolean) => Promise<unknown>[];
  onDataChanged: () => void;
  onRejected: (message: string) => void;
  onClose: () => void;
  toast: (text: string, tone?: "ok" | "error") => void;
  onSuccess?: (result: R) => void;
}): Promise<void> {
  if (!o.writeLock.acquire()) return;
  o.onRejected("");
  try {
    let unknown: AdminApiError | null = null;
    let result: R | undefined;
    try {
      result = await o.work();
    } catch (err) {
      if (isUnknownResult(err)) {
        unknown = err;
      } else {
        o.onRejected(errText(err));
        return;
      }
    }
    o.onClose();
    o.onDataChanged();
    if (!unknown) o.onSuccess?.(result as R);
    const reads = await Promise.allSettled(o.reread(Boolean(unknown)));
    const readFailed = reads.some((r) => r.status === "rejected");
    const okText = typeof o.okText === "function" ? o.okText(result as R) : o.okText;
    if (unknown)
      o.toast(
        readFailed
          ? `${unknown.message}，重新讀取也失敗。請稍後按重新整理核對，不要直接重做。`
          : `${unknown.message}。已重新讀取，請先核對畫面資料，不要直接重做。`,
        "error",
      );
    else if (readFailed) o.toast(`${okText}，但重新讀取失敗，請按重新整理。`, "error");
    else o.toast(okText);
  } finally {
    o.writeLock.release();
  }
}
