import { useEffect, useState, type ReactNode } from "react";
import {
  adminApi,
  adminWriteApi,
  money,
  type AdminSeason,
  type GroupMember,
  type GroupMemberInput,
  type MemberDisableImpact,
  type SeasonConfirmInput,
  type SeasonConfirmSetting,
  type SeasonIntentReply,
  type SeasonSetting,
  type SeasonSettingInput,
} from "@/lib/v6admin-api";
import { errText } from "@/lib/v6admin-write";
import { Sheet } from "./AdminParts";

// ③ 賽季管理 writes, part 2 (P5-b): 期初設定, 群組 (新增／改名／停用), 群組成員,
// 產生下季抵扣, 建立／更新季繳收費單, 儲存季末損益. Each sheet posts the same
// body as the Worker's /admin page; the numbers shown come from the Worker
// (試算 = POST season-settings/preview, which writes nothing).

export type SubmitWrite = <R>(work: () => Promise<R>, okText: string | ((r: R) => string)) => void;

function Actions({
  busy,
  error,
  onClose,
  confirmText,
  danger,
  disabled,
  onConfirm,
}: {
  busy: boolean;
  error: string;
  onClose: () => void;
  confirmText: string;
  danger?: boolean | undefined;
  disabled?: boolean | undefined;
  onConfirm: () => void;
}) {
  return (
    <>
      {error ? <div className="ctl-error">{error}</div> : null}
      <div className="ctl-sheet-actions">
        <button className="ctl-btn is-plain" type="button" onClick={onClose} disabled={busy}>
          返回
        </button>
        <button
          className={`ctl-btn${danger ? " is-danger" : ""}`}
          type="button"
          disabled={busy || disabled}
          onClick={onConfirm}
        >
          {busy ? "處理中…" : confirmText}
        </button>
      </div>
    </>
  );
}

// ---------- 期初設定 ----------

const SETTING_FIELDS: [keyof SeasonSettingInput, string, string][] = [
  ["courtFeePerCourtHour", "場地單價（每面每小時）", "1"],
  ["courtDiscountRate", "場地折扣（1 = 不打折）", "0.01"],
  ["courtCount", "預估場地數（面）", "0.5"],
  ["hoursPerEvent", "每場時數", "0.5"],
  ["shuttleTubePrice", "球一桶價格", "1"],
  ["shuttlePerTube", "一桶球數", "1"],
  ["estimatedShuttlePerEvent", "每場每面用球數", "0.5"],
  ["acFeePerHour", "冷氣每小時", "1"],
  ["acHoursPerEvent", "每場冷氣時數", "0.5"],
  ["miscFeePerSeason", "整季雜支", "1"],
  ["estimatedEventCount", "預估聚會次數", "1"],
  ["seasonMemberCount", "總費用平均人數", "1"],
  ["roundingUnit", "季費取整單位", "1"],
  ["tempFee", "臨打費用（每次）", "1"],
];

function settingToInput(
  seasonId: string,
  groupId: string,
  st: SeasonSetting | null | undefined,
): SeasonSettingInput {
  const v = (n: number | undefined | null, fallback = "") => (n == null ? fallback : String(n));
  return {
    seasonId,
    groupId,
    courtFeePerCourtHour: v(st?.courtFeePerCourtHour),
    courtDiscountRate: v(st?.courtDiscountRate, "1"),
    courtCount: v(st?.courtCount),
    hoursPerEvent: v(st?.hoursPerEvent),
    shuttleTubePrice: v(st?.shuttleTubePrice),
    shuttlePerTube: v(st?.shuttlePerTube),
    estimatedShuttlePerEvent: v(st?.estimatedShuttlePerEvent),
    acFeePerHour: v(st?.acFeePerHour),
    acHoursPerEvent: v(st?.acHoursPerEvent),
    miscFeePerSeason: v(st?.miscFeePerSeason),
    estimatedEventCount: v(st?.estimatedEventCount),
    seasonMemberCount: v(st?.seasonMemberCount),
    roundingUnit: v(st?.roundingUnit, "10"),
    tempFee: v(st?.tempFee),
  };
}

export function SettingSheet({
  password,
  siteId,
  seasonId,
  groupId,
  title,
  current,
  busy,
  error,
  onClose,
  submit,
}: {
  password: string;
  siteId: string;
  seasonId: string;
  groupId: string;
  title: string;
  current: SeasonSetting | null | undefined;
  busy: boolean;
  error: string;
  onClose: () => void;
  submit: SubmitWrite;
}) {
  const [form, setForm] = useState(() => settingToInput(seasonId, groupId, current));
  // Saving needs a 試算 of exactly these numbers first.
  const [preview, setPreview] = useState<{ key: string; setting: SeasonSetting } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const key = JSON.stringify(form);
  const fresh = preview?.key === key ? preview.setting : null;

  async function runPreview() {
    setPreviewing(true);
    setPreviewError("");
    try {
      const d = await adminWriteApi.previewSeasonSetting(password, siteId, form);
      setPreview({ key, setting: d.setting });
    } catch (err) {
      setPreviewError(errText(err));
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <Sheet title={title} onClose={onClose} busy={busy}>
      <p className="ctl-sub">
        {current ? "修改後會留下修改紀錄；" : "這個賽季／群組還沒有期初設定。"}
        先按「試算」看季費，數字確認後再儲存。
      </p>
      <div className="ctl-form">
        {SETTING_FIELDS.map(([name, label, step]) => (
          <label className="ctl-field" key={name}>
            {label}
            <input
              type="number"
              inputMode="decimal"
              step={step}
              min="0"
              value={form[name]}
              disabled={busy}
              onChange={(e) => setForm({ ...form, [name]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <button
        className="ctl-btn is-plain"
        type="button"
        disabled={busy || previewing}
        onClick={() => void runPreview()}
      >
        {previewing ? "試算中…" : "試算"}
      </button>
      {previewError ? <div className="ctl-error">{previewError}</div> : null}
      {fresh ? (
        <dl className="ctl-kv">
          <dt>每場場地費</dt>
          <dd>{money(Math.round(fresh.courtFeePerEvent ?? 0))}</dd>
          <dt>每場用球費</dt>
          <dd>{money(Math.round(fresh.shuttleFeePerEvent ?? 0))}</dd>
          <dt>每場冷氣費</dt>
          <dd>{money(Math.round(fresh.acFeePerEvent ?? 0))}</dd>
          <dt>預估總成本</dt>
          <dd>{money(Math.round(fresh.estimatedTotalCost ?? 0))}</dd>
          <dt>每人估算</dt>
          <dd>{money(Math.round(fresh.estimatedFeePerMember ?? 0))}</dd>
          <dt className="is-total">季費</dt>
          <dd className="is-total">{money(fresh.seasonFee)}</dd>
          <dt>每場季費基準</dt>
          <dd>{money(fresh.perEventSeasonFee)}</dd>
          <dt>臨打費</dt>
          <dd>{money(fresh.tempFee)}</dd>
        </dl>
      ) : preview ? (
        <p className="ctl-notice">數字有改過，請重新試算。</p>
      ) : null}
      <Actions
        busy={busy}
        error={error}
        onClose={onClose}
        confirmText={current ? "儲存修改" : "儲存期初設定"}
        disabled={!fresh}
        onConfirm={() =>
          submit(
            () => adminWriteApi.saveSeasonSetting(password, siteId, form),
            (r) =>
              (r as { revisionStatus?: string }).revisionStatus === "noop"
                ? "期初設定沒有變更"
                : `期初設定已儲存，季費 ${money(fresh?.seasonFee)}`,
          )
        }
      />
    </Sheet>
  );
}

// ---------- 群組 ----------

export function GroupSheet({
  mode,
  group,
  busy,
  error,
  onClose,
  onCreate,
  onRename,
  onDisable,
}: {
  mode: "create" | "edit";
  group?: { id: string; name: string } | undefined;
  busy: boolean;
  error: string;
  onClose: () => void;
  onCreate: (name: string) => void;
  onRename: (name: string) => void;
  onDisable: (name: string) => void;
}) {
  const [name, setName] = useState(group?.name || "");
  const [armDisable, setArmDisable] = useState(false);
  const trimmed = name.trim();
  return (
    <Sheet title={mode === "create" ? "新增季打群組" : "群組設定"} onClose={onClose} busy={busy}>
      <label className="ctl-field is-wide">
        群組名稱
        <input
          value={name}
          maxLength={40}
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <p className="ctl-sub">群組與成員跨賽季共用；變更只影響之後建立或重新同步的聚會。</p>
      <Actions
        busy={busy}
        error={error}
        onClose={onClose}
        confirmText={mode === "create" ? "新增群組" : "儲存名稱"}
        disabled={!trimmed || (mode === "edit" && trimmed === group?.name)}
        onConfirm={() => (mode === "create" ? onCreate(trimmed) : onRename(trimmed))}
      />
      {mode === "edit" ? (
        <div className="ctl-actions">
          <button
            className="ctl-act is-danger"
            type="button"
            disabled={busy}
            onClick={() => (armDisable ? onDisable(group?.name || trimmed) : setArmDisable(true))}
          >
            {armDisable ? "再按一次確定停用" : "停用這個群組"}
          </button>
        </div>
      ) : null}
    </Sheet>
  );
}

// ---------- 群組成員 ----------

type MemberRow = GroupMemberInput & { key: string; tag?: string | undefined };

// T-25: a row of the 依回覆產生名單建議 draft (reason shown as a tag).
export type SuggestedMember = GroupMemberInput & { tag: string };

// T-21: 同一人改名 must be edited on the original row (same member id, so
// claims, bills and refund credits stay linked); ＋ 新增成員 creates a new id.
// T-23 (b): saving with 停用 members cancels their unpaid season fee and their
// seats in upcoming meetups -- the Worker's dry run is shown before saving.
export function MembersSheet({
  members,
  suggested,
  seasonName,
  bootstrapDraft,
  busy,
  error,
  onClose,
  onPreview,
  onSave,
}: {
  members: GroupMember[];
  suggested?: SuggestedMember[] | undefined;
  seasonName: string;
  bootstrapDraft: boolean;
  busy: boolean;
  error: string;
  onClose: () => void;
  onPreview: (members: GroupMemberInput[]) => Promise<MemberDisableImpact>;
  onSave: (members: GroupMemberInput[]) => void;
}) {
  const [rows, setRows] = useState<MemberRow[]>(() =>
    suggested
      ? suggested.map((m, i) => ({ ...m, key: m.id || `n${i}` }))
      : [...members]
          .sort((a, b) => (a.orderNo ?? 9999) - (b.orderNo ?? 9999))
          .map((m, i) => ({
            key: m.id || `n${i}`,
            id: m.id,
            name: m.name,
            orderNo: m.orderNo ?? i + 1,
            status: m.status === "disabled" ? "disabled" : "active",
          })),
  );
  // Each member as it is now (before this edit), for the 改名 check.
  const original = new Map(members.map((m) => [m.id, m]));
  const [review, setReview] = useState<{
    payload: GroupMemberInput[];
    added: string[];
    dropped: string[];
    impact: MemberDisableImpact | null;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const nextKey = () => `new${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  const set = (key: string, patch: Partial<MemberRow>) =>
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const valid = rows.filter((r) => r.name.trim());
  const active = valid.filter((r) => r.status === "active").length;

  async function startSave() {
    const payload = valid.map(({ id, name, orderNo, status }) => ({
      id,
      name: name.trim(),
      orderNo,
      status,
    }));
    const added = valid.filter((r) => !r.id).map((r) => r.name.trim());
    // Existing members this edit turns off or blanks out.
    const dropped = rows
      .filter((r) => r.id && original.has(r.id))
      .filter((r) => {
        const before = original.get(r.id)!;
        return !r.name.trim() || (r.status === "disabled" && before.status !== "disabled");
      })
      .map((r) => original.get(r.id)!.name);
    let impact: MemberDisableImpact | null = null;
    if (payload.some((m) => m.id && m.status === "disabled")) {
      setChecking(true);
      setCheckError("");
      try {
        impact = await onPreview(payload);
      } catch (err) {
        setCheckError(errText(err));
        setChecking(false);
        return;
      }
      setChecking(false);
    }
    const touches = impact && (impact.unpaid.length || impact.paid.length || impact.seats.length);
    if (!added.length && !touches) {
      onSave(payload);
      return;
    }
    setReview({ payload, added, dropped, impact });
  }

  if (review) {
    const { impact } = review;
    const seatEvents = impact ? Array.from(new Set(impact.seats.map((x) => x.eventId))).length : 0;
    return (
      <Sheet title="儲存前確認" onClose={onClose} busy={busy}>
        {review.added.length ? (
          <div className="ctl-review">
            <strong>將新增 {review.added.length} 位新成員</strong>
            <p>{review.added.join("、")}</p>
            <p className="ctl-sub">新成員是新的編號，不會接上任何舊紀錄、LINE 認領或退費抵扣。</p>
            {review.dropped.length ? (
              <p className="ctl-error">
                你停用了 {review.dropped.join("、")}，又新增了 {review.added.join("、")}。
                如果是同一個人改名，請按返回，直接改原本那一列的名字。
              </p>
            ) : null}
          </div>
        ) : null}
        {impact && impact.unpaid.length ? (
          <div className="ctl-review">
            <strong>將取消 {impact.unpaid.length} 筆未付季費</strong>
            <p>{impact.unpaid.map((x) => `${x.memberName} ${money(x.amount)}`).join("、")}</p>
          </div>
        ) : null}
        {impact && impact.paid.length ? (
          <div className="ctl-review">
            <strong>已繳季費（不會自動退款）</strong>
            <p>
              {impact.paid.map((x) => `${x.memberName} ${money(x.amount)}`).join("、")}
              ，退款請另外處理。
            </p>
          </div>
        ) : null}
        {impact && impact.seats.length ? (
          <div className="ctl-review">
            <strong>將從 {seatEvents} 場聚會移除季打</strong>
            <p>
              {impact.seats
                .map((x) => `${x.eventDate.slice(5).replace("-", "/")} ${x.name}`)
                .join("、")}
            </p>
            <p className="ctl-sub">空出的位子照規則由備取遞補，會發出遞補通知。</p>
          </div>
        ) : null}
        <Actions
          busy={busy}
          error={error}
          onClose={() => setReview(null)}
          confirmText={review.added.length ? "確定新增並儲存" : "確定儲存"}
          danger={Boolean(impact && (impact.unpaid.length || impact.seats.length))}
          onConfirm={() => onSave(review.payload)}
        />
      </Sheet>
    );
  }

  return (
    <Sheet title="編輯季打成員" onClose={onClose} busy={busy}>
      <p className="ctl-sub">
        儲存後建立 {seasonName} 的季打名單（{active} 人有效）。
        {bootstrapDraft && !suggested ? "目前顯示的是群組常駐成員草稿。" : ""}
        {suggested ? "已依季打確認的回覆帶入，確認後再儲存。" : ""}
        停用＝本季不打；空白名字不會送出。
      </p>
      <p className="ctl-notice">同一人改名，請直接改原本那一列；「＋ 新增成員」只給新加入的人。</p>
      <ul className="ctl-rows">
        {rows.map((r) => (
          <li className="ctl-member-edit" key={r.key}>
            <input
              className="ctl-member-order"
              type="number"
              inputMode="numeric"
              min="1"
              aria-label="順序"
              value={r.orderNo}
              disabled={busy}
              onChange={(e) => set(r.key, { orderNo: Math.max(1, Number(e.target.value) || 1) })}
            />
            <span className="ctl-member-field">
              <input
                className="ctl-member-name"
                aria-label="名字"
                value={r.name}
                maxLength={40}
                disabled={busy}
                onChange={(e) => set(r.key, { name: e.target.value })}
              />
              {!r.id ? <span className="ctl-member-tag is-new">新</span> : null}
              {r.tag ? <span className="ctl-member-tag">{r.tag}</span> : null}
            </span>
            <button
              type="button"
              className={`ctl-act${r.status === "active" ? " is-done" : ""}`}
              disabled={busy}
              onClick={() => set(r.key, { status: r.status === "active" ? "disabled" : "active" })}
            >
              {r.status === "active" ? "有效" : "停用"}
            </button>
          </li>
        ))}
      </ul>
      <button
        className="ctl-btn is-plain"
        type="button"
        disabled={busy}
        onClick={() =>
          setRows((list) => [
            ...list,
            {
              key: nextKey(),
              id: "",
              name: "",
              orderNo: list.reduce((m, r) => Math.max(m, r.orderNo), 0) + 1,
              status: "active",
            },
          ])
        }
      >
        ＋ 新增成員
      </button>
      <Actions
        busy={busy || checking}
        error={checkError || error}
        onClose={onClose}
        confirmText={checking ? "檢查中…" : "儲存成員"}
        disabled={!valid.length}
        onConfirm={() => void startSave()}
      />
    </Sheet>
  );
}

// ---------- 產生下季抵扣 ----------

export function RefundGenSheet({
  password,
  siteId,
  toSeasonId,
  toSeasonName,
  groupId,
  seasons,
  busy,
  error,
  onClose,
  submit,
}: {
  password: string;
  siteId: string;
  toSeasonId: string;
  toSeasonName: string;
  groupId: string;
  seasons: AdminSeason[];
  busy: boolean;
  error: string;
  onClose: () => void;
  submit: SubmitWrite;
}) {
  const choices = seasons.filter((s) => s.id !== toSeasonId);
  // Default source: the latest season before this one (by start date when
  // both have one, else by name "20xx 第N季"), i.e. the previous season.
  const [fromId, setFromId] = useState(() => {
    const target = seasons.find((s) => s.id === toSeasonId);
    if (!target) return "";
    const cmp = (a: AdminSeason, b: AdminSeason) =>
      a.startDate && b.startDate
        ? a.startDate.localeCompare(b.startDate)
        : (a.name || "").localeCompare(b.name || "");
    const earlier = choices.filter((s) => cmp(s, target) < 0).sort((a, b) => cmp(b, a));
    return earlier[0]?.id || "";
  });
  const [unit, setUnit] = useState("");
  const [official, setOfficial] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");

  // Default 單次請假退費 = the source season's official per-meetup fee.
  useEffect(() => {
    if (!fromId) return;
    let alive = true;
    setOfficial(null);
    setLoadError("");
    adminApi
      .seasonManagement(password, siteId, fromId, groupId)
      .then((d) => {
        if (!alive) return;
        const per = d.setting?.perEventSeasonFee ?? null;
        setOfficial(per);
        setUnit(per ? String(per) : "");
      })
      .catch((err) => alive && setLoadError(errText(err)));
    return () => {
      alive = false;
    };
  }, [password, siteId, fromId, groupId]);

  const unitNumber = Math.round(Number(unit));
  const fromName = seasons.find((s) => s.id === fromId)?.name || fromId;
  return (
    <Sheet title="產生下季退費抵扣" onClose={onClose} busy={busy}>
      <div className="ctl-picker">
        <label htmlFor="ctl-refund-from">請假來源賽季</label>
        <select
          id="ctl-refund-from"
          className="ctl-select"
          value={fromId}
          disabled={busy}
          onChange={(e) => setFromId(e.target.value)}
        >
          {!fromId ? <option value="">請選擇</option> : null}
          {choices.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.id}
            </option>
          ))}
        </select>
      </div>
      <label className="ctl-field is-wide">
        單次請假退費
        <input
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          value={unit}
          disabled={busy}
          onChange={(e) => setUnit(e.target.value)}
        />
      </label>
      {loadError ? <div className="ctl-error">{loadError}</div> : null}
      <p className="ctl-sub">
        {official
          ? `預設為 ${fromName} 的每場季費基準 ${money(official)}。`
          : `${fromName} 沒有期初設定可帶入，請自行填寫。`}
        依 {fromName} 的有效請假次數，重新產生 {fromName} → {toSeasonName}{" "}
        的抵扣；已付款的季繳不會被改動。
      </p>
      <Actions
        busy={busy}
        error={error}
        onClose={onClose}
        confirmText="產生抵扣"
        disabled={!fromId || !(unitNumber > 0)}
        onConfirm={() =>
          submit(
            () =>
              adminWriteApi.generateRefundCredits(password, siteId, {
                fromSeasonId: fromId,
                toSeasonId,
                groupId,
                refundUnit: unitNumber,
              }),
            (r) => {
              const created = (r as { created?: { paidLocked?: boolean }[] }).created || [];
              const locked = created.filter((c) => c.paidLocked).length;
              return `退費抵扣已產生 ${created.length} 位${locked ? `（${locked} 位已付款未改動）` : ""}`;
            },
          )
        }
      />
    </Sheet>
  );
}

// ---------- 簡單確認 ----------

export function ConfirmSheet({
  title,
  children,
  confirmText,
  danger,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  title: string;
  children: ReactNode;
  confirmText: string;
  danger?: boolean | undefined;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet title={title} onClose={onClose} busy={busy}>
      {children}
      <Actions
        busy={busy}
        error={error}
        onClose={onClose}
        confirmText={confirmText}
        danger={danger}
        onConfirm={onConfirm}
      />
    </Sheet>
  );
}

// Dates belong to the season, not its fee setting or group name.
export function SeasonDateSheet({
  season,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  season?: AdminSeason | undefined;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (input: {
    seasonId?: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  }) => void;
}) {
  const [name, setName] = useState(season?.name || "");
  const [startDate, setStartDate] = useState(season?.startDate || "");
  const [endDate, setEndDate] = useState(season?.endDate || "");
  const valid = Boolean(name.trim() && startDate && endDate && startDate <= endDate);
  return (
    <Sheet title={season ? "修改賽季日期" : "新增賽季"} busy={busy} onClose={onClose}>
      <p>日期可跨年，例如 2026-12-14～2027-03-29。期初設定的預估聚會次數請另填完整場次。</p>
      <div className="ctl-form-grid">
        <label>
          賽季名稱
          <input value={name} disabled={busy} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          開始日期
          <input
            type="date"
            value={startDate}
            disabled={busy}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          結束日期
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            disabled={busy}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>
      {startDate && endDate && startDate > endDate ? (
        <p className="ctl-error">結束日期不可早於開始日期。</p>
      ) : null}
      <Actions
        busy={busy}
        error={error}
        onClose={onClose}
        confirmText="儲存賽季"
        disabled={!valid}
        onConfirm={() =>
          onSubmit({
            ...(season ? { seasonId: season.id } : {}),
            name: name.trim(),
            startDate,
            endDate,
            status: season?.status || "active",
          })
        }
      />
    </Sheet>
  );
}

// ---------- 季打確認 (T-25 / P5-c) ----------

// "2026-12-01T23:59" in Taipei <-> ISO.
function isoToTaipeiInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(d)
    .replace(" ", "T");
}
function taipeiInputToIso(value: string) {
  return value ? new Date(`${value}:00+08:00`).toISOString() : null;
}

// 精簡 settings (T-25): 名單來源 and 截止時間. 公告、名額上限、請假規則
// are not edited here and are passed back unchanged.
export function ConfirmSettingSheet({
  setting,
  seasonId,
  groupId,
  seasonName,
  groupName,
  seasons,
  busy,
  error,
  onClose,
  onSave,
}: {
  setting: SeasonConfirmSetting | null;
  seasonId: string;
  groupId: string;
  seasonName: string;
  groupName: string;
  seasons: AdminSeason[];
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (input: SeasonConfirmInput) => void;
}) {
  const others = seasons.filter((s) => s.id !== seasonId);
  const [source, setSource] = useState(setting?.sourceSeasonId || seasonId);
  const [deadline, setDeadline] = useState(isoToTaipeiInput(setting?.deadlineAt));
  const same = source === seasonId;
  return (
    <Sheet title={`季打確認｜${seasonName}／${groupName}`} onClose={onClose} busy={busy}>
      <div className="ctl-picker">
        <label>名單來源</label>
        <div className="ctl-seg ctl-seg-wide" role="group" aria-label="名單來源">
          <button
            type="button"
            className={same ? "is-on" : ""}
            disabled={busy}
            onClick={() => setSource(seasonId)}
          >
            本季名單（②）
          </button>
          <button
            type="button"
            className={!same ? "is-on" : ""}
            disabled={busy || !others.length}
            onClick={() => setSource(others[0]?.id || seasonId)}
          >
            其他賽季名單
          </button>
        </div>
        {!same ? (
          <select
            className="ctl-select"
            value={source}
            disabled={busy}
            onChange={(e) => setSource(e.target.value)}
          >
            {others.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.id}
              </option>
            ))}
          </select>
        ) : null}
        <p className="ctl-sub">
          {same
            ? "球員看到的是 ② 季打名單裡「有效」的人；確認期間改名單，球員端會立刻跟著變。"
            : "球員看到的是所選賽季的季打名單。"}
        </p>
      </div>
      <div className="ctl-picker">
        <label htmlFor="ctl-confirm-deadline">回覆截止（台北時間）</label>
        <input
          id="ctl-confirm-deadline"
          className="ctl-input"
          type="datetime-local"
          value={deadline}
          disabled={busy}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>
      <Actions
        busy={busy}
        error={error}
        onClose={onClose}
        confirmText="儲存設定"
        disabled={!deadline}
        onConfirm={() =>
          onSave({
            ...(setting ? { id: setting.id } : {}),
            targetSeasonId: seasonId,
            sourceSeasonId: source,
            groupId,
            enabled: Boolean(setting && Number(setting.enabled) === 1),
            status: setting?.status === "open" ? "open" : "draft",
            deadlineAt: taipeiInputToIso(deadline),
            capacityLimit: setting?.capacityLimit ?? null,
            leaveRulesText: setting?.leaveRulesText ?? null,
            publicNote: setting?.publicNote ?? null,
          })
        }
      />
    </Sheet>
  );
}

// 代登: the admin records a member's 續打／休息 told in person.
export function ProxySheet({
  memberName,
  busy,
  error,
  onClose,
  onSave,
}: {
  memberName: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (intent: "renew" | "decline") => void;
}) {
  return (
    <Sheet title={`代登回覆｜${memberName}`} onClose={onClose} busy={busy}>
      <p className="ctl-sub">替 {memberName} 登記回覆（會取代他目前的回覆）。</p>
      {error ? <div className="ctl-error">{error}</div> : null}
      <div className="ctl-sheet-actions">
        <button
          className="ctl-btn is-plain"
          type="button"
          disabled={busy}
          onClick={() => onSave("decline")}
        >
          這季休息
        </button>
        <button className="ctl-btn" type="button" disabled={busy} onClick={() => onSave("renew")}>
          {busy ? "處理中…" : "續打"}
        </button>
      </div>
      <button className="ctl-btn-ghost" type="button" disabled={busy} onClick={onClose}>
        返回
      </button>
    </Sheet>
  );
}

// 申請加入 審核: approve as a new member (default) or as an existing member
// of this group, or reject.
export function ReviewSheet({
  reply,
  groupMembers,
  busy,
  error,
  onClose,
  onApproveNew,
  onApproveExisting,
  onReject,
}: {
  reply: SeasonIntentReply;
  groupMembers: GroupMember[];
  busy: boolean;
  error: string;
  onClose: () => void;
  onApproveNew: (name: string) => void;
  onApproveExisting: (memberId: string) => void;
  onReject: () => void;
}) {
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [name, setName] = useState(reply.applicantName || reply.lineDisplayName || "");
  const [memberId, setMemberId] = useState("");
  const [armReject, setArmReject] = useState(false);
  return (
    <Sheet title="審核申請加入" onClose={onClose} busy={busy}>
      <p>
        <strong>{reply.applicantName || reply.lineDisplayName}</strong>
        {reply.lineDisplayName ? (
          <span className="ctl-sub">（LINE {reply.lineDisplayName}）</span>
        ) : null}
      </p>
      <div className="ctl-seg ctl-seg-wide" role="group" aria-label="核准方式">
        <button
          type="button"
          className={mode === "new" ? "is-on" : ""}
          disabled={busy}
          onClick={() => setMode("new")}
        >
          建立新成員
        </button>
        <button
          type="button"
          className={mode === "existing" ? "is-on" : ""}
          disabled={busy || !groupMembers.length}
          onClick={() => setMode("existing")}
        >
          對應既有成員
        </button>
      </div>
      {mode === "new" ? (
        <div className="ctl-picker">
          <label htmlFor="ctl-review-name">新成員名字</label>
          <input
            id="ctl-review-name"
            className="ctl-input"
            value={name}
            maxLength={40}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      ) : (
        <div className="ctl-picker">
          <label htmlFor="ctl-review-member">這個群組的成員（之前打過、改名回來的人）</label>
          <select
            id="ctl-review-member"
            className="ctl-select"
            value={memberId}
            disabled={busy}
            onChange={(e) => setMemberId(e.target.value)}
          >
            <option value="">請選擇</option>
            {groupMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.status === "disabled" ? "（停用）" : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      <p className="ctl-sub">核准後他的 LINE 會認領這位成員；之後到 ② 把他設為有效再儲存名單。</p>
      <Actions
        busy={busy}
        error={error}
        onClose={onClose}
        confirmText="核准"
        disabled={mode === "new" ? !name.trim() : !memberId}
        onConfirm={() => (mode === "new" ? onApproveNew(name.trim()) : onApproveExisting(memberId))}
      />
      <button
        className="ctl-btn-ghost is-danger"
        type="button"
        disabled={busy}
        onClick={() => (armReject ? onReject() : setArmReject(true))}
      >
        {armReject ? "再按一次確定婉拒" : "婉拒這筆申請"}
      </button>
    </Sheet>
  );
}
