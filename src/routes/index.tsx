import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type CSSProperties } from "react";
import { MeetupSheet, MemberSheet } from "@/components/homepage/HomepageSheets";
import { HomepageRoster } from "@/components/homepage/HomepageRoster";
import { ParticleRacket } from "@/components/homepage/ParticleRacket";
import { useHomepageFlow } from "@/hooks/use-homepage-flow";
import type { AlphaEvent, AlphaRoster } from "@/lib/database-alpha";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shuttle Dynamics — 羽球聚會報名" },
      {
        name: "description",
        content:
          "接上 v6 database-alpha 的手機羽球聚會報名頁：查看最近聚會、臨打報名/取消、季打請假/消假與正取候補名單。",
      },
    ],
  }),
  component: Index,
});

const RACKET_FILE = "shuttle-racket-pearl.png";

function Index() {
  const [name, setName] = useState("");
  const flow = useHomepageFlow();
  const racketSrc = `${import.meta.env.BASE_URL}${RACKET_FILE}`;
  const active = flow.phase === "active";
  const rotating = flow.phase === "rotating-to-active";
  const preview = flow.phase === "meetup-preview";
  const materialized = ["materializing", "meetup-preview", "rotating-to-active", "active"].includes(
    flow.phase,
  );

  const metrics = useMemo(() => {
    const summary = flow.roster?.summary;
    const event = flow.selectedEvent;
    const reported = Number(summary?.confirmedCount || event?.confirmedCount || 0);
    return {
      reported,
      missing: Math.max(0, Number(event?.maxPeople || 0) - reported),
      waiting: Number(summary?.waitingCount || event?.waitingCount || 0),
    };
  }, [flow.roster, flow.selectedEvent]);

  const submit = async () => {
    const ok = await flow.submitSignup(name);
    if (ok) setName("");
  };

  return (
    <main
      className={`sd-page is-${flow.phase} motion-${flow.motionMode}`}
      data-locked={flow.pendingAction ? "true" : "false"}
    >
      <HomepageStyles />
      <ParticleRacket phase={flow.phase} motionMode={flow.motionMode} />

      <header className="sd-header">
        <p>BADMINTON ASSEMBLY</p>
      </header>

      <section className="sd-hero" id="sd-hero">
        <div className={`sd-racket-wrap ${materialized ? "is-materialized" : ""}`}>
          <RacketImage className="sd-racket-main" src={racketSrc} />
          {flow.shadowEvents.map((event, index) => (
            <button
              key={event.id}
              className={`sd-racket-shadow sd-shadow-${index + 1}`}
              aria-label={`切換到 ${event.name}`}
              onClick={() => flow.openMeetupPicker(event.id)}
              style={{ "--shadow-index": index } as CSSProperties}
            >
              <RacketImage src={racketSrc} />
            </button>
          ))}
        </div>

        {flow.phase === "load-error" && (
          <section className="sd-load-error">
            <h1>database-alpha 讀取失敗</h1>
            <p>{flow.error}</p>
            <button onClick={() => window.location.reload()}>重新整理</button>
          </section>
        )}

        {preview && flow.selectedEvent && (
          <button className="sd-preview" onClick={flow.enterActive}>
            <MeetupPreview event={flow.selectedEvent} />
            <span
              className="sd-more"
              onClick={(event) => {
                event.stopPropagation();
                flow.openMeetupPicker();
              }}
            >
              ...
            </span>
            <span className="sd-preview-line" />
          </button>
        )}

        {(active || rotating) && (
          <>
            <FloatingAnnotations event={flow.selectedEvent} roster={flow.roster} />
            <div className="sd-metrics" aria-label="報名狀態">
              <Metric label="已報" value={metrics.reported} tone="green" />
              <Metric label="尚缺" value={metrics.missing} tone="gold" center />
              <Metric label="後補" value={metrics.waiting} tone="neutral" />
            </div>
            <section className="sd-actions" aria-label="報名操作">
              <div className="sd-action-zone sd-season">
                <h2>季打</h2>
                <button
                  disabled={Boolean(flow.pendingAction)}
                  onClick={() => flow.openMemberPicker("season-leave")}
                >
                  請假
                </button>
                <button
                  disabled={Boolean(flow.pendingAction)}
                  onClick={() => flow.openMemberPicker("season-restore")}
                >
                  消假
                </button>
              </div>
              <div className="sd-action-zone sd-casual">
                <h2>臨打</h2>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submit();
                  }}
                  placeholder="姓名"
                  disabled={Boolean(flow.pendingAction)}
                />
                <button
                  className="sd-submit"
                  disabled={!name.trim() || Boolean(flow.pendingAction)}
                  onClick={submit}
                >
                  報名
                </button>
                <button
                  className="sd-cancel"
                  disabled={Boolean(flow.pendingAction)}
                  onClick={() => flow.openMemberPicker("casual-cancel")}
                >
                  取消
                </button>
              </div>
            </section>
          </>
        )}

        {flow.pendingAction && (
          <div className="sd-pending" aria-live="polite">
            <span />
            <span />
            <span />
            {flow.pendingAction.label}
          </div>
        )}
      </section>

      {(active || rotating) && (
        <HomepageRoster
          roster={flow.roster}
          confirmed={flow.confirmed}
          waiting={flow.waiting}
          lastChangedId={flow.lastChangedId}
          refreshing={Boolean(flow.pendingAction)}
          onRefresh={() => flow.refresh()}
        />
      )}

      {flow.notice && (
        <button className="sd-notice" onClick={() => flow.setNotice("")}>
          {flow.notice}
        </button>
      )}

      <MeetupSheet
        open={flow.meetupPickerOpen}
        events={flow.events}
        selectedEventId={flow.selectedEventId}
        pendingEventId={flow.pendingSwitchEventId}
        onSelect={flow.setPendingSwitchEventId}
        onClose={flow.closeMeetupPicker}
        onConfirm={flow.switchMeetup}
        disabled={Boolean(flow.pendingAction)}
      />

      <MemberSheet
        mode={flow.memberPickerMode}
        candidates={flow.memberCandidates}
        selectedMemberId={flow.selectedMemberId}
        onSelect={flow.setSelectedMemberId}
        onClose={flow.closeMemberPicker}
        onConfirm={flow.confirmMemberAction}
        disabled={Boolean(flow.pendingAction)}
      />
    </main>
  );
}

function RacketImage({ src, className = "" }: { src: string; className?: string }) {
  return <img className={className} src={src} alt="" aria-hidden="true" draggable={false} />;
}

function MeetupPreview({ event }: { event: AlphaEvent }) {
  return (
    <>
      <strong>{event.name}</strong>
      <span>
        {shortDate(event.eventDate)} {weekday(event.eventDate)} |{" "}
        {event.hours ? `${event.hours} 小時` : "時間待公告"}
      </span>
    </>
  );
}

function FloatingAnnotations({
  event,
  roster,
}: {
  event: AlphaEvent | null;
  roster: AlphaRoster | null;
}) {
  if (!event) return null;
  const venue = event.eventNote || "康軒羽球館";
  return (
    <div className="sd-annotations" aria-label="聚會資訊">
      <Annotation className="a-name" label={event.name} value={`${event.eventDate} | ${venue}`} />
      <Annotation
        className="a-time"
        label="時間"
        value={event.hours ? `${event.hours} 小時` : "待公告"}
      />
      <Annotation className="a-fee" label="費用" value={`NT$${Number(event.tempFee || 0)}`} />
      <Annotation className="a-ball" label="用球" value={event.ballType || "依現場公告"} />
      <Annotation
        className="a-cap"
        label="上限"
        value={`${Number(event.maxPeople || 0)} 人 | 請假 ${Number(roster?.summary.leaveCount || 0)}`}
      />
    </div>
  );
}

function Annotation({
  className,
  label,
  value,
}: {
  className: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`sd-annotation ${className}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
  center = false,
}: {
  label: string;
  value: number;
  tone: "green" | "gold" | "neutral";
  center?: boolean;
}) {
  return (
    <div className={`sd-metric ${center ? "is-center" : ""}`}>
      <span>{label}</span>
      <strong className={`tone-${tone}`}>{value}</strong>
      <i />
    </div>
  );
}

function shortDate(value: string) {
  const [, month = "", day = ""] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function weekday(value: string) {
  const date = new Date(`${value}T00:00:00+08:00`);
  return ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][date.getDay()];
}

function HomepageStyles() {
  return (
    <style>{`
      .sd-page {
        --gold: #d8b95e;
        --green: #9df416;
        min-height: 100svh;
        overflow-x: clip;
        color: #f7f6ef;
        background:
          radial-gradient(90% 58% at 74% 14%, rgba(216,185,94,.08), transparent 56%),
          radial-gradient(70% 44% at 50% 102%, rgba(157,244,22,.055), transparent 62%),
          linear-gradient(180deg, #11151a 0%, #080b0f 62%, #05070a 100%);
      }

      .sd-page::before,
      .sd-page::after {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
      }

      .sd-page::before {
        z-index: 0;
        opacity: .36;
        background-image:
          linear-gradient(128deg, transparent 0 35%, rgba(216,185,94,.10) 35.2% 35.45%, transparent 35.7%),
          linear-gradient(133deg, transparent 0 64%, rgba(255,255,255,.055) 64.1% 64.25%, transparent 64.5%),
          repeating-linear-gradient(135deg, rgba(255,255,255,.026) 0 1px, transparent 1px 13px),
          repeating-linear-gradient(45deg, transparent 0 17px, rgba(255,255,255,.018) 17px 18px);
      }

      .sd-page::after {
        z-index: 1;
        background:
          radial-gradient(100% 80% at 50% 40%, transparent 42%, rgba(0,0,0,.72) 100%),
          linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.46));
      }

      .sd-header,
      .sd-hero,
      .sd-roster,
      .sd-notice,
      .sd-sheet-layer {
        position: relative;
        z-index: 2;
      }

      .sd-header {
        min-height: 72px;
        display: grid;
        place-items: center;
        padding: calc(env(safe-area-inset-top) + 14px) 16px 0;
      }

      .sd-header p {
        margin: 0;
        color: rgba(216,185,94,.76);
        font: 600 11px/1.2 "Chakra Petch", "Noto Sans TC", sans-serif;
        letter-spacing: .48em;
      }

      .sd-particles {
        position: fixed;
        z-index: 3;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        transition: opacity .7s ease, filter .7s ease;
      }

      .is-materializing .sd-particles,
      .is-meetup-preview .sd-particles,
      .is-rotating-to-active .sd-particles,
      .is-active .sd-particles {
        opacity: 0;
        filter: blur(8px);
      }

      .sd-hero {
        width: min(100%, 560px);
        min-height: 712px;
        margin: 0 auto;
        isolation: isolate;
      }

      .sd-racket-wrap {
        position: absolute;
        z-index: 4;
        left: 50%;
        top: 84px;
        width: clamp(276px, 82vw, 420px);
        aspect-ratio: 971 / 1619;
        opacity: 0;
        transform: translateX(-50%) rotate(88deg) scale(.88);
        transform-origin: 50% 52%;
        transition:
          opacity 1.2s ease,
          transform 1.35s cubic-bezier(.2,.9,.2,1),
          top 1.35s cubic-bezier(.2,.9,.2,1);
      }

      .sd-racket-wrap.is-materialized {
        opacity: 1;
        transform: translateX(-50%) rotate(88deg) scale(.94);
      }

      .is-rotating-to-active .sd-racket-wrap,
      .is-active .sd-racket-wrap {
        top: 48px;
        transform: translateX(-50%) rotate(27deg) scale(.9);
      }

      .sd-racket-main,
      .sd-racket-shadow img,
      .sd-racket-wrap > img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        user-select: none;
        -webkit-user-drag: none;
      }

      .sd-racket-main {
        filter:
          drop-shadow(0 22px 38px rgba(0,0,0,.54))
          drop-shadow(0 0 16px rgba(216,185,94,.12));
        animation: racket-breathe 5.6s ease-in-out infinite;
      }

      .sd-racket-shadow {
        position: absolute;
        inset: 0;
        border: 0;
        padding: 0;
        background: transparent;
        opacity: 0;
        transform: translate(calc(-18px - var(--shadow-index) * 16px), calc(18px + var(--shadow-index) * 14px)) scale(calc(1 + var(--shadow-index) * .016));
        filter: blur(3px) brightness(.55) sepia(.35);
        pointer-events: none;
      }

      .is-rotating-to-active .sd-racket-shadow,
      .is-active .sd-racket-shadow {
        pointer-events: auto;
        animation: shadow-breathe 6.4s ease-in-out infinite;
      }

      .is-rotating-to-active .sd-shadow-1,
      .is-active .sd-shadow-1 { opacity: .28; transition: opacity .3s ease .25s; }
      .is-rotating-to-active .sd-shadow-2,
      .is-active .sd-shadow-2 { opacity: .20; transition: opacity .3s ease .50s; }
      .is-rotating-to-active .sd-shadow-3,
      .is-active .sd-shadow-3 { opacity: .14; transition: opacity .3s ease .75s; }
      .is-rotating-to-active .sd-shadow-4,
      .is-active .sd-shadow-4 { opacity: .10; transition: opacity .3s ease .90s; }

      .sd-preview {
        position: absolute;
        z-index: 8;
        left: 24px;
        right: 24px;
        top: 454px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 38px;
        gap: 8px;
        align-items: center;
        border: 1px solid rgba(216,185,94,.26);
        border-radius: 22px;
        background: rgba(5,8,11,.46);
        color: #fff;
        padding: 14px 16px;
        text-align: left;
        backdrop-filter: blur(12px);
      }

      .sd-preview strong {
        display: block;
        color: var(--gold);
        font-size: 18px;
        letter-spacing: .08em;
      }

      .sd-preview span {
        display: block;
        margin-top: 4px;
        color: rgba(255,255,255,.68);
        font-size: 12px;
      }

      .sd-preview .sd-more {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        color: var(--green);
        border: 1px solid rgba(157,244,22,.35);
      }

      .sd-preview-line {
        grid-column: 1 / -1;
        height: 1px;
        margin-top: 10px !important;
        background: linear-gradient(90deg, transparent, rgba(157,244,22,.7), transparent);
        animation: preview-line 2.8s linear forwards;
      }

      .sd-annotations {
        position: absolute;
        z-index: 7;
        inset: 0;
        opacity: 0;
        animation: fade-in .55s ease .45s forwards;
      }

      .sd-annotation {
        position: absolute;
        width: min(43vw, 190px);
        color: rgba(255,255,255,.84);
        font-size: 11px;
      }

      .sd-annotation::before {
        content: "";
        position: absolute;
        top: 19px;
        width: 64px;
        height: 1px;
        background: linear-gradient(90deg, rgba(216,185,94,.8), transparent);
      }

      .sd-annotation span {
        display: block;
        color: rgba(216,185,94,.74);
        letter-spacing: .18em;
      }

      .sd-annotation strong {
        display: block;
        margin-top: 4px;
        font-weight: 500;
        line-height: 1.35;
      }

      .a-name { left: 18px; top: 78px; }
      .a-time { right: 16px; top: 96px; text-align: right; }
      .a-fee { left: 24px; top: 238px; }
      .a-ball { right: 18px; top: 245px; text-align: right; }
      .a-cap { right: 26px; top: 336px; text-align: right; }
      .a-time::before,
      .a-ball::before,
      .a-cap::before { right: 0; transform: scaleX(-1); }

      .sd-metrics {
        position: absolute;
        z-index: 9;
        left: 16px;
        right: 16px;
        top: 374px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: center;
      }

      .sd-metric {
        text-align: center;
        padding: 8px 4px;
      }

      .sd-metric.is-center {
        border-radius: 999px;
        background:
          radial-gradient(70% 100% at 50% 50%, rgba(4,7,10,.38), transparent 76%),
          rgba(4,7,10,.14);
        filter: drop-shadow(0 10px 20px rgba(0,0,0,.28));
      }

      .sd-metric span {
        display: block;
        margin-bottom: 2px;
        color: rgba(255,255,255,.62);
        font-size: 11px;
        letter-spacing: .12em;
      }

      .sd-metric strong {
        display: block;
        font: 700 clamp(34px, 10vw, 48px)/1 "Chakra Petch", "Noto Sans TC", sans-serif;
      }

      .tone-green { color: var(--green); }
      .tone-gold { color: #f0bd5c; }
      .tone-neutral { color: rgba(255,255,255,.86); }

      .sd-metric i {
        display: block;
        width: 34px;
        height: 2px;
        margin: 7px auto 0;
        background: currentColor;
        opacity: .7;
      }

      .sd-actions {
        position: absolute;
        z-index: 10;
        left: 16px;
        right: 16px;
        top: 478px;
        display: grid;
        grid-template-columns: minmax(0, .86fr) minmax(0, 1.14fr);
        gap: clamp(30px, 10vw, 58px);
      }

      .sd-actions::before {
        content: "";
        position: absolute;
        left: 42%;
        top: -16px;
        width: 1px;
        height: 194px;
        transform: rotate(27deg);
        background: linear-gradient(180deg, transparent, rgba(216,185,94,.38), transparent);
      }

      .sd-action-zone {
        min-width: 0;
        display: grid;
        gap: 10px;
        align-content: start;
      }

      .sd-action-zone h2 {
        margin: 0 0 2px;
        font-size: 16px;
        letter-spacing: .18em;
        text-align: center;
      }

      .sd-season h2 { color: var(--gold); }
      .sd-casual h2 { color: var(--green); }

      .sd-action-zone button,
      .sd-action-zone input {
        width: 100%;
        min-height: 46px;
        border-radius: 999px;
        font-size: 15px;
      }

      .sd-action-zone button {
        border: 1px solid rgba(216,185,94,.62);
        background: rgba(5,8,11,.34);
        color: var(--gold);
      }

      .sd-casual input {
        border: 1px solid rgba(255,255,255,.22);
        background: rgba(5,8,11,.42);
        color: #fff;
        padding: 0 14px;
        outline: none;
      }

      .sd-casual input::placeholder { color: rgba(255,255,255,.44); }

      .sd-casual .sd-submit {
        border-color: transparent;
        background: linear-gradient(180deg, #b8ff18, #83cb08);
        color: #101607;
        font-weight: 800;
        box-shadow: 0 0 24px rgba(157,244,22,.24);
      }

      .sd-casual .sd-cancel {
        border-color: rgba(157,244,22,.55);
        color: var(--green);
      }

      .sd-action-zone button:disabled,
      .sd-action-zone input:disabled {
        opacity: .45;
      }

      .sd-pending {
        position: absolute;
        z-index: 14;
        left: 50%;
        top: 638px;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 7px;
        color: rgba(255,255,255,.72);
        font-size: 12px;
      }

      .sd-pending span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--green);
        animation: pending-dot .9s ease-in-out infinite alternate;
      }

      .sd-pending span:nth-child(2) { animation-delay: .14s; }
      .sd-pending span:nth-child(3) { animation-delay: .28s; }

      .sd-load-error {
        position: absolute;
        z-index: 9;
        left: 20px;
        right: 20px;
        top: 310px;
        border: 1px solid rgba(216,185,94,.24);
        border-radius: 22px;
        background: rgba(5,8,11,.64);
        padding: 18px;
        backdrop-filter: blur(14px);
      }

      .sd-load-error h1 {
        margin: 0 0 8px;
        color: var(--gold);
        font-size: 18px;
      }

      .sd-load-error p {
        color: rgba(255,255,255,.72);
        font-size: 13px;
      }

      .sd-load-error button {
        min-height: 42px;
        border: 0;
        border-radius: 999px;
        background: var(--green);
        padding: 0 18px;
        font-weight: 800;
      }

      .sd-roster {
        width: min(calc(100% - 32px), 560px);
        margin: -8px auto 40px;
        padding-bottom: calc(env(safe-area-inset-bottom) + 20px);
      }

      .sd-roster-title {
        position: sticky;
        top: 0;
        z-index: 4;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto 42px;
        gap: 10px;
        align-items: center;
        padding: 10px 0;
        background: linear-gradient(180deg, rgba(8,11,15,.96), rgba(8,11,15,.78));
        backdrop-filter: blur(10px);
      }

      .sd-roster-title h2 {
        margin: 0;
        color: rgba(255,255,255,.9);
        font-size: 16px;
        letter-spacing: .12em;
      }

      .sd-roster-title span {
        color: var(--gold);
        font-size: 14px;
      }

      .sd-roster-title button {
        width: 38px;
        height: 38px;
        border: 1px solid rgba(216,185,94,.35);
        border-radius: 50%;
        background: rgba(255,255,255,.04);
        color: var(--gold);
      }

      .sd-roster-list {
        display: grid;
        gap: 8px;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .sd-roster-list li {
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) 52px;
        align-items: center;
        min-height: 44px;
        border-bottom: 1px solid rgba(255,255,255,.08);
        color: rgba(255,255,255,.9);
      }

      .sd-roster-list li.is-changed {
        animation: changed-person 1.4s ease;
      }

      .sd-roster-no {
        color: rgba(216,185,94,.7);
        font-family: "Chakra Petch", monospace;
      }

      .sd-roster-list strong {
        font-weight: 500;
      }

      .sd-roster-list em {
        font-style: normal;
        font-size: 12px;
        text-align: right;
      }

      .sd-roster-list .is-season { color: var(--gold); }
      .sd-roster-list .is-casual { color: rgba(210,255,164,.92); }
      .sd-waiting-title {
        margin: 22px 0 8px;
        color: rgba(255,255,255,.68);
        letter-spacing: .14em;
        font-size: 13px;
      }

      .sd-empty {
        margin: 12px 0;
        color: rgba(255,255,255,.48);
        font-size: 13px;
      }

      .sd-back-top {
        position: fixed;
        right: 18px;
        bottom: calc(env(safe-area-inset-bottom) + 18px);
        z-index: 30;
        width: 42px;
        height: 42px;
        border: 1px solid rgba(216,185,94,.28);
        border-radius: 50%;
        background: rgba(7,10,14,.66);
        color: var(--gold);
        backdrop-filter: blur(12px);
      }

      .sd-notice {
        position: fixed;
        z-index: 50;
        left: 50%;
        bottom: calc(env(safe-area-inset-bottom) + 18px);
        transform: translateX(-50%);
        width: min(calc(100% - 32px), 460px);
        border: 1px solid rgba(216,185,94,.25);
        border-radius: 16px;
        background: rgba(5,8,11,.9);
        color: rgba(255,255,255,.88);
        padding: 12px 14px;
        box-shadow: 0 14px 36px rgba(0,0,0,.42);
        backdrop-filter: blur(16px);
      }

      .sd-sheet-layer {
        position: fixed;
        z-index: 70;
        inset: 0;
        display: flex;
        align-items: flex-end;
      }

      .sd-sheet-backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        background: rgba(0,0,0,.62);
        backdrop-filter: blur(9px);
      }

      .sd-bottom-sheet {
        position: relative;
        width: 100%;
        max-height: min(82svh, 680px);
        overflow: auto;
        border-radius: 28px 28px 0 0;
        background: linear-gradient(180deg, #f4f7fb, #e9eef4);
        color: #111827;
        padding: 28px 16px calc(env(safe-area-inset-bottom) + 16px);
      }

      .sd-bottom-sheet h2 {
        margin: 0 56px 18px 0;
        color: #111827;
        font-size: 30px;
        line-height: 1;
      }

      .sd-sheet-close {
        position: absolute;
        right: 16px;
        top: 18px;
        width: 52px;
        height: 52px;
        border: 0;
        border-radius: 18px;
        background: #fff;
        color: #2585f4;
        font-size: 30px;
        font-weight: 800;
      }

      .sd-event-card,
      .sd-person-card {
        width: 100%;
        border: 1px solid #dde3ec;
        border-radius: 20px;
        background: rgba(255,255,255,.78);
        color: #182234;
        text-align: left;
        box-shadow: 0 8px 24px rgba(15,23,42,.05);
      }

      .sd-event-card {
        display: grid;
        gap: 9px;
        padding: 18px;
      }

      .sd-event-card + .sd-event-card,
      .sd-person-card + .sd-person-card {
        margin-top: 10px;
      }

      .sd-event-card.is-picked {
        border-color: rgba(216,185,94,.85);
        box-shadow: 0 0 0 2px rgba(157,244,22,.18);
      }

      .sd-event-card.is-current {
        opacity: .72;
      }

      .sd-event-topline {
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }

      .sd-event-topline strong {
        font-size: 24px;
        color: #2585f4;
      }

      .sd-event-topline em {
        align-self: start;
        border-radius: 999px;
        background: #ffe6e8;
        color: #bd1e2d;
        padding: 6px 10px;
        font-style: normal;
        font-weight: 800;
      }

      .sd-person-card {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) 58px;
        gap: 10px;
        align-items: center;
        min-height: 58px;
        padding: 0 14px;
      }

      .sd-person-card.is-picked {
        border-color: #2585f4;
        box-shadow: 0 0 0 2px rgba(37,133,244,.14);
      }

      .sd-person-card span {
        color: #2585f4;
        font-weight: 800;
      }

      .sd-person-card em {
        font-style: normal;
        text-align: right;
        color: #9b6f12;
      }

      .sd-sheet-confirm {
        width: 100%;
        min-height: 54px;
        margin-top: 16px;
        border: 0;
        border-radius: 999px;
        background: #111827;
        color: #fff;
        font-weight: 800;
        font-size: 16px;
      }

      .sd-sheet-confirm:disabled {
        opacity: .38;
      }

      @keyframes racket-breathe {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-3px) scale(1.01); }
      }

      @keyframes shadow-breathe {
        0%, 100% { translate: 0 0; }
        50% { translate: 2px -5px; }
      }

      @keyframes preview-line {
        from { transform: scaleX(0); transform-origin: left; }
        to { transform: scaleX(1); transform-origin: left; }
      }

      @keyframes fade-in {
        to { opacity: 1; }
      }

      @keyframes pending-dot {
        from { transform: translateY(0); opacity: .35; }
        to { transform: translateY(-5px); opacity: 1; }
      }

      @keyframes changed-person {
        0%, 100% { background: transparent; }
        35% { background: rgba(157,244,22,.10); }
      }

      @media (min-width: 431px) {
        .sd-hero { min-height: 760px; }
        .sd-racket-wrap { width: 420px; top: 80px; }
        .is-rotating-to-active .sd-racket-wrap,
        .is-active .sd-racket-wrap { top: 34px; }
        .sd-metrics { top: 398px; }
        .sd-actions { top: 506px; left: 30px; right: 30px; }
        .sd-bottom-sheet {
          width: min(520px, calc(100% - 32px));
          margin: 0 auto 16px;
          border-radius: 28px;
        }
      }

      @media (max-width: 374px) {
        .sd-header p { font-size: 10px; letter-spacing: .38em; }
        .sd-hero { min-height: 688px; }
        .sd-racket-wrap { width: 275px; top: 86px; }
        .sd-annotation { font-size: 10px; width: 42vw; }
        .a-name { left: 14px; top: 72px; }
        .a-time { top: 90px; }
        .a-fee { top: 224px; }
        .a-ball { top: 230px; }
        .a-cap { top: 318px; }
        .sd-metrics { top: 358px; left: 12px; right: 12px; }
        .sd-metric strong { font-size: 34px; }
        .sd-actions { top: 456px; left: 14px; right: 14px; gap: 26px; }
        .sd-action-zone button,
        .sd-action-zone input { min-height: 43px; font-size: 14px; }
      }

      .motion-reduced .sd-racket-wrap,
      .motion-reduced .sd-racket-main,
      .motion-reduced .sd-racket-shadow,
      .motion-reduced .sd-preview-line,
      .motion-reduced .sd-annotations,
      .motion-reduced .sd-pending span {
        animation: none !important;
        transition-duration: .01ms !important;
      }

      .motion-reduced .sd-racket-shadow {
        display: none;
      }
    `}</style>
  );
}
