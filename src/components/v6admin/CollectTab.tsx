import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  adminApi,
  adminWriteApi,
  isUnknownResult,
  loadPersonBill,
  money,
  shortDate,
  type BillGuestItem,
  type BillingPerson,
  type BillSeasonItem,
  type PersonBill,
} from "@/lib/v6admin-api";
import { errText, runWrite, useToast, type WriteLock } from "@/lib/v6admin-write";
import { Card, Section, Sheet, Toast } from "./AdminParts";

// 收款 (P7, V6-027): pick a person, see everything they owe on this site
// (season fees incl. earlier seasons, and temp fees from any event) and mark
// the ticked items paid in one go. The bill and totals come from the Worker
// (same calculation as V9's bill); writes reuse the existing per-item APIs:
// POST season-payments/:id/status and temp-payments/:id/status.

type Item =
  | { kind: "season"; id: string; amount: number; season: BillSeasonItem }
  | { kind: "guest"; id: string; amount: number; guest: BillGuestItem };

type ItemResult = {
  id: string;
  label: string;
  amount: number;
  state: "ok" | "failed" | "unknown" | "skipped";
  message?: string;
};

function itemLabel(it: Item) {
  if (it.kind === "season") return `${it.season.seasonName} 季費`;
  const g = it.guest;
  return `${shortDate(g.eventDate)} 臨打${g.signupKind === "proxy" ? `（代報 ${g.guestName}）` : ""}`;
}

function outstandingItems(bill: PersonBill): Item[] {
  const seasons = bill.seasonItems
    .filter((s) => s.outstanding > 0)
    .sort((a, b) => a.seasonId.localeCompare(b.seasonId))
    .map<Item>((s) => ({ kind: "season", id: s.paymentId, amount: s.outstanding, season: s }));
  const guests = bill.guestItems
    .filter((g) => g.outstanding > 0)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .map<Item>((g) => ({ kind: "guest", id: g.paymentId, amount: g.outstanding, guest: g }));
  return [...seasons, ...guests];
}

export function CollectTab({
  password,
  siteId,
  dataVersion,
  writeLock,
  writing,
  onDataChanged,
}: {
  password: string;
  siteId: string;
  dataVersion: number;
  writeLock: WriteLock;
  writing: boolean;
  onDataChanged: () => void;
}) {
  const [toast, showToast] = useToast();

  // People list (sequenced so only the newest read lands).
  const [people, setPeople] = useState<BillingPerson[] | null>(null);
  const [peopleError, setPeopleError] = useState("");
  const peopleSeq = useRef(0);
  const loadPeople = useCallback(async () => {
    const seq = ++peopleSeq.current;
    try {
      const d = await adminApi.billingPeople(password, siteId);
      if (seq === peopleSeq.current) {
        setPeople(d.people);
        setPeopleError("");
      }
    } catch (err) {
      if (seq === peopleSeq.current) setPeopleError(errText(err));
      throw err;
    }
  }, [password, siteId]);

  const [personId, setPersonId] = useState("");
  const [query, setQuery] = useState("");
  const [onlyOwing, setOnlyOwing] = useState(true);

  // The selected person's bill.
  const [bill, setBill] = useState<PersonBill | null>(null);
  const [billError, setBillError] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<ItemResult[] | null>(null);
  const billSeq = useRef(0);
  const loadBill = useCallback(
    async (id: string) => {
      const seq = ++billSeq.current;
      try {
        const b = await loadPersonBill(password, siteId, id);
        if (seq === billSeq.current) {
          setBill(b);
          setBillError("");
          setChecked(new Set(outstandingItems(b).map((i) => i.id)));
        }
      } catch (err) {
        if (seq === billSeq.current) setBillError(errText(err));
        throw err;
      }
    },
    [password, siteId],
  );

  useEffect(() => {
    const counter = peopleSeq;
    loadPeople().catch(() => {});
    return () => {
      counter.current++;
    };
  }, [loadPeople, dataVersion]);

  useEffect(() => {
    const counter = billSeq;
    if (!personId) return;
    loadBill(personId).catch(() => {});
    return () => {
      counter.current++;
    };
    // dataVersion: another tab wrote; re-read the open bill.
  }, [loadBill, personId, dataVersion]);

  function openPerson(id: string) {
    setBill(null);
    setBillError("");
    setResult(null);
    setPersonId(id);
    window.scrollTo(0, 0);
  }
  function backToList() {
    if (writing) return;
    billSeq.current++;
    setPersonId("");
    setBill(null);
    setResult(null);
  }

  const person = people?.find((p) => p.personId === personId) || null;
  const items = useMemo(() => (bill ? outstandingItems(bill) : []), [bill]);
  const picked = items.filter((i) => checked.has(i.id));
  const pickedTotal = picked.reduce((sum, i) => sum + i.amount, 0);
  const itemsTotal = items.reduce((sum, i) => sum + i.amount, 0);

  const [confirming, setConfirming] = useState(false);

  // C4: 已繳紀錄 → fix → 改回未收 (same requests as ① / ③'s 取消已收).
  const [fixing, setFixing] = useState<{
    label: string;
    amount: number;
    run: () => Promise<unknown>;
  } | null>(null);
  const [fixError, setFixError] = useState("");
  function openFix(label: string, amount: number, run: () => Promise<unknown>) {
    if (writing) return;
    setFixError("");
    setFixing({ label, amount, run });
  }

  // Mark the picked items paid one by one inside the panel-wide write lock.
  // Stops at the first failure; an unknown outcome is never resent.
  async function collect() {
    if (!picked.length || !writeLock.acquire()) return;
    const todo = picked;
    const results: ItemResult[] = [];
    let stopped = false;
    try {
      for (const it of todo) {
        const base = { id: it.id, label: itemLabel(it), amount: it.amount };
        if (stopped) {
          results.push({ ...base, state: "skipped" });
          continue;
        }
        try {
          if (it.kind === "season") {
            await adminWriteApi.seasonPaymentStatus(password, it.id, "paid");
          } else {
            await adminWriteApi.tempPaymentStatus(password, it.id, "paid", it.guest.amount);
          }
          results.push({ ...base, state: "ok" });
        } catch (err) {
          stopped = true;
          results.push({
            ...base,
            state: isUnknownResult(err) ? "unknown" : "failed",
            message: errText(err),
          });
        }
      }
      setConfirming(false);
      setResult(results);
      onDataChanged();
      const reads = await Promise.allSettled([loadBill(personId), loadPeople()]);
      const readFailed = reads.some((r) => r.status === "rejected");
      const ok = results.filter((r) => r.state === "ok");
      const okSum = ok.reduce((s, r) => s + r.amount, 0);
      if (!stopped)
        showToast(
          readFailed
            ? `已收 ${ok.length} 筆 ${money(okSum)}，但重新讀取失敗，請按重新整理。`
            : `已收 ${ok.length} 筆 ${money(okSum)}`,
        );
      else
        showToast(
          `已收 ${ok.length} 筆 ${money(okSum)}；有一筆未完成${results.some((r) => r.state === "skipped") ? "，後面的沒有送出" : ""}。請看收款結果，不要直接重做。`,
          "error",
        );
    } finally {
      writeLock.release();
    }
  }

  if (!personId) {
    const q = query.trim().toLowerCase();
    const list = (people || []).filter((p) => {
      if (onlyOwing && p.outstandingTotal <= 0) return false;
      if (!q) return true;
      return [p.displayName, p.lineDisplayName, p.memberName]
        .filter(Boolean)
        .some((n) => String(n).toLowerCase().includes(q));
    });
    return (
      <>
        <section className="ctl-card ctl-collect-search">
          <input
            className="ctl-input"
            type="search"
            placeholder="搜尋球員（稱呼、LINE 名稱、季打名）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="搜尋球員"
          />
          <label className="ctl-check">
            <input
              type="checkbox"
              checked={onlyOwing}
              onChange={(e) => setOnlyOwing(e.target.checked)}
            />
            只看有未繳的人
          </label>
        </section>
        {peopleError ? (
          <div className="ctl-error">
            {peopleError}{" "}
            <button
              className="ctl-btn-ghost"
              type="button"
              onClick={() => loadPeople().catch(() => {})}
            >
              重試
            </button>
          </div>
        ) : !people ? (
          <div className="ctl-loading">讀取球員中…</div>
        ) : (
          <section className="ctl-card">
            <div className="ctl-card-title">
              <h2>球員</h2>
              <span className="ctl-sub">
                {list.length} 人 · 未繳合計{" "}
                {money(list.reduce((s, p) => s + p.outstandingTotal, 0))}
              </span>
            </div>
            {list.length ? (
              <ul className="ctl-rows">
                {list.map((p) => (
                  <li key={p.personId}>
                    <button
                      type="button"
                      className="ctl-row ctl-person"
                      onClick={() => openPerson(p.personId)}
                    >
                      <span className="ctl-row-name is-wrap">
                        {p.displayName || p.memberName || "（未命名）"}
                        {p.lineDisplayName && p.lineDisplayName !== p.displayName ? (
                          <small>LINE {p.lineDisplayName}</small>
                        ) : null}
                        {p.memberName && p.memberName !== p.displayName ? (
                          <small>季打 {p.memberName}</small>
                        ) : null}
                        {p.kind === "member" ? <small>未認領 LINE</small> : null}
                      </span>
                      <span className={`ctl-row-amt${p.outstandingTotal ? " is-owe" : ""}`}>
                        {p.outstandingTotal ? money(p.outstandingTotal) : "已結清"}
                      </span>
                      <span className="ctl-chev" aria-hidden>
                        ›
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ctl-empty">{onlyOwing ? "沒有未繳的人。" : "找不到符合的球員。"}</p>
            )}
          </section>
        )}
        <Toast toast={toast} />
      </>
    );
  }

  const paidSeasons = (bill?.seasonItems || []).filter((s) => s.status === "paid");
  const paidGuests = (bill?.guestItems || []).filter((g) => g.status === "paid");

  return (
    <>
      <div className="ctl-collect-head">
        <button className="ctl-btn-ghost" type="button" onClick={backToList} disabled={writing}>
          ‹ 球員列表
        </button>
        <button
          className="ctl-btn-ghost"
          type="button"
          disabled={writing}
          onClick={() => loadBill(personId).catch(() => {})}
        >
          重新整理
        </button>
      </div>
      <section className="ctl-card">
        <div className="ctl-event-head">
          <h2>{person?.displayName || person?.memberName || "球員"}</h2>
        </div>
        <p className="ctl-event-meta">
          {person?.lineDisplayName ? `LINE ${person.lineDisplayName}` : "未認領 LINE"}
          {person?.memberName ? ` · 季打 ${person.memberName}` : ""}
        </p>
      </section>

      {result ? <ResultCard results={result} onClose={() => setResult(null)} /> : null}

      {billError ? (
        <div className="ctl-error">
          {billError}{" "}
          <button
            className="ctl-btn-ghost"
            type="button"
            onClick={() => loadBill(personId).catch(() => {})}
          >
            重試
          </button>
        </div>
      ) : !bill ? (
        <div className="ctl-loading">讀取帳單中…</div>
      ) : (
        <>
          {!bill.complete ? (
            <div className="ctl-warn">紀錄太多，帳單只讀到一部分，請到 ① / ③ 核對。</div>
          ) : itemsTotal !== bill.totalAmountDue ? (
            <div className="ctl-warn">
              項目合計 {money(itemsTotal)} 與 Worker 應繳合計 {money(bill.totalAmountDue)}{" "}
              不一致，請先核對。
            </div>
          ) : null}
          <Card
            title="未繳項目"
            side={<span className="ctl-sub">應繳 {money(bill.totalAmountDue)}</span>}
          >
            {items.length ? (
              <>
                <label className="ctl-check ctl-check-all">
                  <input
                    type="checkbox"
                    checked={picked.length === items.length}
                    disabled={writing}
                    onChange={(e) =>
                      setChecked(new Set(e.target.checked ? items.map((i) => i.id) : []))
                    }
                  />
                  全選（{items.length} 筆）
                </label>
                <ul className="ctl-rows">
                  {items.map((it) => (
                    <li key={it.id}>
                      <label className="ctl-row ctl-bill-row">
                        <input
                          type="checkbox"
                          checked={checked.has(it.id)}
                          disabled={writing}
                          onChange={(e) => {
                            const next = new Set(checked);
                            if (e.target.checked) next.add(it.id);
                            else next.delete(it.id);
                            setChecked(next);
                          }}
                        />
                        <span className="ctl-row-name is-wrap">
                          {itemLabel(it)}
                          {it.kind === "season" ? (
                            <SeasonDetail s={it.season} />
                          ) : (
                            <small>{it.guest.eventName}</small>
                          )}
                        </span>
                        <span className="ctl-row-amt">{money(it.amount)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="ctl-empty">沒有未繳項目，已結清。</p>
            )}
          </Card>

          {paidSeasons.length || paidGuests.length ? (
            <Section title="已繳紀錄" note={`${paidSeasons.length + paidGuests.length} 筆`}>
              <ul className="ctl-rows">
                {paidSeasons.map((s) => (
                  <li className="ctl-row" key={s.paymentId}>
                    <span className="ctl-row-name is-wrap">
                      {s.seasonName} 季費
                      <small>{s.paidAt ? s.paidAt.replace("T", " ").slice(0, 16) : ""}</small>
                    </span>
                    <span className="ctl-row-amt">{money(s.finalPayableAmount)}</span>
                    <span className="ctl-pill green">已收</span>
                    <button
                      className="ctl-act is-fix"
                      type="button"
                      disabled={writing}
                      onClick={() =>
                        openFix(`${s.seasonName} 季費`, s.finalPayableAmount, () =>
                          adminWriteApi.seasonPaymentStatus(password, s.paymentId, "unpaid"),
                        )
                      }
                    >
                      fix
                    </button>
                  </li>
                ))}
                {paidGuests
                  .slice()
                  .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
                  .map((g) => (
                    <li className="ctl-row" key={g.paymentId}>
                      <span className="ctl-row-name is-wrap">
                        {shortDate(g.eventDate)} 臨打
                        {g.signupKind === "proxy" ? <small>代報 {g.guestName}</small> : null}
                      </span>
                      <span className="ctl-row-amt">{money(g.amount)}</span>
                      <span className="ctl-pill green">已收</span>
                      <button
                        className="ctl-act is-fix"
                        type="button"
                        disabled={writing}
                        onClick={() =>
                          openFix(`${shortDate(g.eventDate)} 臨打`, g.amount, () =>
                            adminWriteApi.tempPaymentStatus(
                              password,
                              g.paymentId,
                              "unpaid",
                              g.amount,
                            ),
                          )
                        }
                      >
                        fix
                      </button>
                    </li>
                  ))}
              </ul>
            </Section>
          ) : null}

          {items.length ? (
            <div className="ctl-collect-bar">
              <button
                className="ctl-btn"
                type="button"
                disabled={writing || !picked.length}
                onClick={() => setConfirming(true)}
              >
                {picked.length
                  ? `收款 ${money(pickedTotal)}（${picked.length} 筆）`
                  : "請勾選要收的項目"}
              </button>
            </div>
          ) : null}
        </>
      )}

      {fixing ? (
        <Sheet title="改回未收" onClose={() => !writing && setFixing(null)} busy={writing}>
          <p>
            <strong>{person?.displayName || person?.memberName}</strong> 的這筆款項：
          </p>
          <ul className="ctl-rows">
            <li className="ctl-row">
              <span className="ctl-row-name is-wrap">{fixing.label}</span>
              <span className="ctl-row-amt">{money(fixing.amount)}</span>
            </li>
          </ul>
          <p className="ctl-sub">改回「未付款」，原付款時間會清除，這筆會回到未繳項目。</p>
          {fixError ? <div className="ctl-error">{fixError}</div> : null}
          <div className="ctl-sheet-actions">
            <button
              className="ctl-btn is-plain"
              type="button"
              onClick={() => setFixing(null)}
              disabled={writing}
            >
              返回
            </button>
            <button
              className="ctl-btn is-danger"
              type="button"
              disabled={writing}
              onClick={() =>
                runWrite({
                  writeLock,
                  work: fixing.run,
                  okText: `${fixing.label} 已改回未收`,
                  reread: () => [loadBill(personId), loadPeople()],
                  onDataChanged,
                  onRejected: setFixError,
                  onClose: () => setFixing(null),
                  toast: showToast,
                })
              }
            >
              {writing ? "處理中…" : "確定改回未收"}
            </button>
          </div>
        </Sheet>
      ) : null}

      {confirming ? (
        <Sheet title="確認收款" onClose={() => !writing && setConfirming(false)} busy={writing}>
          <p>
            <strong>{person?.displayName || person?.memberName}</strong> 收款{" "}
            <strong>{money(pickedTotal)}</strong>，以下 {picked.length} 筆標記為已收：
          </p>
          <ul className="ctl-rows">
            {picked.map((it) => (
              <li className="ctl-row" key={it.id}>
                <span className="ctl-row-name is-wrap">{itemLabel(it)}</span>
                <span className="ctl-row-amt">{money(it.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="ctl-sub">逐筆送出；有一筆失敗就會停下，畫面會顯示哪些已收。</p>
          <div className="ctl-sheet-actions">
            <button
              className="ctl-btn is-plain"
              type="button"
              onClick={() => setConfirming(false)}
              disabled={writing}
            >
              返回
            </button>
            <button
              className="ctl-btn"
              type="button"
              disabled={writing}
              onClick={() => void collect()}
            >
              {writing ? "收款中…" : `確定收款 ${money(pickedTotal)}`}
            </button>
          </div>
        </Sheet>
      ) : null}

      <Toast toast={toast} />
    </>
  );
}

function SeasonDetail({ s }: { s: BillSeasonItem }) {
  return (
    <small className="ctl-bill-detail">
      季費 {money(s.baseSeasonFee)}
      {s.refundCreditTotal ? ` − 抵扣 ${money(s.refundCreditTotal)}` : ""}
      {s.refundSources.map((r) => (
        <span key={r.creditId} className="ctl-bill-detail">
          {r.sourceSeasonName} 請假 {r.leaveCount} 次 × {money(r.refundUnitAmount)} ={" "}
          {money(r.refundAmount)}
          {r.leaveDateComplete === false
            ? "（日期資料不足）"
            : r.leaveDates.length
              ? `（${r.leaveDates.map((d) => shortDate(d)).join("、")}）`
              : ""}
        </span>
      ))}
    </small>
  );
}

const RESULT_LABEL: Record<ItemResult["state"], [string, string]> = {
  ok: ["已收", "green"],
  failed: ["失敗", "red"],
  unknown: ["結果不明", "orange"],
  skipped: ["未送出", ""],
};

function ResultCard({ results, onClose }: { results: ItemResult[]; onClose: () => void }) {
  const bad = results.some((r) => r.state !== "ok");
  return (
    <section className={`ctl-card${bad ? " ctl-result-bad" : ""}`}>
      <div className="ctl-card-title">
        <h2>收款結果</h2>
        <button className="ctl-btn-ghost" type="button" onClick={onClose}>
          關閉
        </button>
      </div>
      <ul className="ctl-rows">
        {results.map((r) => (
          <li className="ctl-row" key={r.id}>
            <span className="ctl-row-name is-wrap">
              {r.label}
              {r.message ? <small>{r.message}</small> : null}
            </span>
            <span className="ctl-row-amt">{money(r.amount)}</span>
            <span className={`ctl-pill ${RESULT_LABEL[r.state][1]}`}>
              {RESULT_LABEL[r.state][0]}
            </span>
          </li>
        ))}
      </ul>
      {bad ? (
        <p className="ctl-sub">
          「結果不明」那筆可能已寫入：請看下方帳單是否還列為未繳，再決定要不要重收。
        </p>
      ) : null}
    </section>
  );
}
