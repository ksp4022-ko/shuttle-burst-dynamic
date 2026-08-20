import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { MEETUPS } from "@/lib/mock-meetups";

const MoleculeRacket = lazy(() => import("@/components/MoleculeRacket"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shuttle Dynamics — 羽球聚會報名" },
      {
        name: "description",
        content:
          "以實體羽球拍為核心的手機羽球聚會報名頁：查看聚會資訊、季打請假/消假、臨打報名與取消報名。",
      },
    ],
  }),
  component: Index,
});

type Stage = "drift" | "assembled" | "standing";
type SignState = "idle" | "sending" | "done";
type MemberAction = "season-leave" | "season-restore" | "casual-cancel";

const RACKET_FILE = "shuttle-racket-pearl.png";

function Index() {
  const [stage, setStage] = useState<Stage>("drift");
  const [solidReady, setSolidReady] = useState(false);
  const [picking, setPicking] = useState(false);
  const [meetupIndex, setMeetupIndex] = useState(0);
  const [name, setName] = useState("");
  const [signState, setSignState] = useState<SignState>("idle");
  const [roster, setRoster] = useState<string[]>(MEETUPS[0]!.roster);
  const [seasonLeaves, setSeasonLeaves] = useState<string[]>(
    MEETUPS[0]!.seasonMembers.filter((member) => !MEETUPS[0]!.roster.includes(member)),
  );
  const [memberAction, setMemberAction] = useState<MemberAction | null>(null);
  const [selectedMember, setSelectedMember] = useState("");
  const [notice, setNotice] = useState("");
  const [burstKey, setBurstKey] = useState(0);

  const meetup = MEETUPS[meetupIndex]!;
  const racketSrc = `${import.meta.env.BASE_URL}${RACKET_FILE}`;

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setStage("assembled");
      setSolidReady(true);
      return;
    }

    const assembleTimer = window.setTimeout(() => setStage("assembled"), 1200);
    const solidTimer = window.setTimeout(() => setSolidReady(true), 2650);

    return () => {
      window.clearTimeout(assembleTimer);
      window.clearTimeout(solidTimer);
    };
  }, []);

  const resetMeetupState = (i: number) => {
    const next = MEETUPS[i]!;
    setMeetupIndex(i);
    setRoster(next.roster);
    setSeasonLeaves(next.seasonMembers.filter((member) => !next.roster.includes(member)));
    setName("");
    setSignState("idle");
    setMemberAction(null);
    setSelectedMember("");
    setNotice("");
  };

  const chooseMeetup = (i: number) => {
    resetMeetupState(i);
    setPicking(false);
    setSolidReady(true);
    setStage("standing");
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed || signState !== "idle") return;

    if (roster.includes(trimmed)) {
      setNotice(`${trimmed} 已在目前名單中`);
      return;
    }

    setSignState("sending");
    window.setTimeout(() => {
      setRoster((current) => [...current, trimmed]);
      setBurstKey((key) => key + 1);
      setName("");
      setSignState("done");
      setNotice(`${trimmed} 已完成臨打報名`);
      window.setTimeout(() => setSignState("idle"), 1600);
    }, 500);
  };

  const seasonPresent = useMemo(
    () => meetup.seasonMembers.filter((member) => roster.includes(member)),
    [meetup.seasonMembers, roster],
  );

  const casualPlayers = useMemo(
    () => roster.filter((member) => !meetup.seasonMembers.includes(member)),
    [meetup.seasonMembers, roster],
  );

  const reported = Math.min(roster.length, meetup.capacity);
  const missing = Math.max(meetup.capacity - roster.length, 0);
  const waiting = Math.max(roster.length - meetup.capacity, 0);

  const actionCandidates = useMemo(() => {
    if (memberAction === "season-leave") return seasonPresent;
    if (memberAction === "season-restore") return seasonLeaves;
    if (memberAction === "casual-cancel") return casualPlayers;
    return [];
  }, [casualPlayers, memberAction, seasonLeaves, seasonPresent]);

  const openMemberAction = (action: MemberAction) => {
    setSelectedMember("");
    setMemberAction(action);
  };

  const closeMemberAction = () => {
    setMemberAction(null);
    setSelectedMember("");
  };

  const confirmMemberAction = () => {
    if (!memberAction || !selectedMember) return;

    if (memberAction === "season-leave") {
      setRoster((current) => current.filter((member) => member !== selectedMember));
      setSeasonLeaves((current) =>
        current.includes(selectedMember) ? current : [...current, selectedMember],
      );
      setNotice(`${selectedMember} 已完成季打請假`);
    }

    if (memberAction === "season-restore") {
      setRoster((current) =>
        current.includes(selectedMember) ? current : [...current, selectedMember],
      );
      setSeasonLeaves((current) => current.filter((member) => member !== selectedMember));
      setNotice(`${selectedMember} 已恢復出席`);
    }

    if (memberAction === "casual-cancel") {
      setRoster((current) => current.filter((member) => member !== selectedMember));
      setNotice(`${selectedMember} 已取消臨打報名`);
    }

    closeMemberAction();
  };

  const actionTitle =
    memberAction === "season-leave"
      ? "選擇季打請假人員"
      : memberAction === "season-restore"
        ? "選擇季打消假人員"
        : "選擇臨打取消人員";

  const actionConfirm =
    memberAction === "season-leave"
      ? "確認請假"
      : memberAction === "season-restore"
        ? "確認恢復出席"
        : "確認取消報名";

  return (
    <main className="sd-page">
      <style>{`
        .sd-page {
          --sd-gold: #d7b35d;
          --sd-gold-soft: rgba(215, 179, 93, .28);
          --sd-neon: #a9ef10;
          --sd-ink: #080b0f;
          --sd-line: rgba(255,255,255,.16);
          position: relative;
          min-height: 100svh;
          overflow-x: hidden;
          color: #f4f5f3;
          background:
            radial-gradient(90% 65% at 73% 18%, rgba(211,174,82,.10), transparent 54%),
            radial-gradient(78% 55% at 50% 100%, rgba(169,239,16,.07), transparent 62%),
            linear-gradient(180deg, #11151a 0%, #090c10 53%, #06080b 100%);
        }

        .sd-page::before,
        .sd-page::after {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
        }

        .sd-page::before {
          opacity: .22;
          background-image:
            linear-gradient(125deg, transparent 0 43%, rgba(215,179,93,.15) 43.2% 43.4%, transparent 43.6%),
            repeating-linear-gradient(135deg, rgba(255,255,255,.024) 0 1px, transparent 1px 13px);
          background-size: 100% 100%, 26px 26px;
        }

        .sd-page::after {
          background: radial-gradient(110% 90% at 50% 42%, transparent 38%, rgba(0,0,0,.68) 100%);
        }

        .sd-header {
          position: relative;
          z-index: 20;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 72px;
          padding: calc(env(safe-area-inset-top) + 14px) 20px 0;
        }

        .sd-brand {
          font-family: "Chakra Petch", "Noto Sans TC", sans-serif;
          font-size: 11px;
          letter-spacing: .48em;
          text-transform: uppercase;
          color: rgba(215,179,93,.76);
        }

        .sd-account {
          position: absolute;
          right: 18px;
          top: calc(env(safe-area-inset-top) + 18px);
          z-index: 40;
          font-size: 10px;
          letter-spacing: .2em;
          color: rgba(255,255,255,.58);
        }

        .sd-scene {
          position: relative;
          z-index: 10;
          width: min(100%, 520px);
          min-height: 735px;
          margin: 0 auto;
        }

        .sd-molecule {
          position: fixed;
          inset: 0;
          z-index: 4;
          transition: opacity .75s ease, filter .75s ease;
        }

        .sd-molecule-hidden {
          opacity: 0;
          filter: blur(6px);
          pointer-events: none;
        }

        .sd-solid-layer {
          position: absolute;
          inset: 0;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity .7s ease, transform .9s cubic-bezier(.16,1,.3,1);
          pointer-events: none;
        }

        .sd-solid-layer.is-ready {
          opacity: 1;
          transform: translateY(0);
        }

        .sd-racket-art {
          position: absolute;
          z-index: 5;
          top: 38px;
          left: 50%;
          width: clamp(282px, 78vw, 362px);
          aspect-ratio: 971 / 1619;
          transform: translateX(-51%) rotate(27deg);
          transform-origin: 50% 52%;
        }

        .sd-racket-art img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
        }

        .sd-racket-shadow {
          opacity: .11;
          filter: blur(6px) brightness(.38) sepia(.35);
        }

        .sd-shadow-1 { transform: translate(-7px, 8px) scale(1.01); }
        .sd-shadow-2 { transform: translate(-14px, 15px) scale(1.015); opacity: .075; }
        .sd-shadow-3 { transform: translate(-21px, 22px) scale(1.02); opacity: .045; }

        .sd-racket-main {
          z-index: 3;
          filter:
            drop-shadow(0 18px 34px rgba(0,0,0,.55))
            drop-shadow(0 0 10px rgba(215,179,93,.14));
        }

        .sd-head-info {
          position: absolute;
          z-index: 8;
          top: 74px;
          right: 18px;
          width: min(55vw, 232px);
          padding: 14px 15px 13px;
          border-radius: 26px;
          transform: rotate(6deg);
          transform-origin: center;
          background: linear-gradient(180deg, rgba(4,7,10,.76), rgba(4,7,10,.52));
          box-shadow: inset 0 0 0 1px rgba(215,179,93,.08);
          backdrop-filter: blur(1px);
          pointer-events: auto;
        }

        .sd-meetup-name {
          margin: 0 0 9px;
          font-family: "Chakra Petch", "Noto Sans TC", sans-serif;
          font-size: clamp(15px, 4vw, 20px);
          line-height: 1.12;
          letter-spacing: .18em;
          color: var(--sd-gold);
          text-transform: uppercase;
        }

        .sd-info-row {
          display: grid;
          grid-template-columns: 27px 1fr;
          align-items: center;
          gap: 8px;
          min-height: 31px;
          border-top: 1px solid rgba(215,179,93,.14);
          font-size: clamp(12px, 3.4vw, 15px);
          color: rgba(255,255,255,.94);
        }

        .sd-info-icon {
          display: grid;
          place-items: center;
          width: 22px;
          height: 22px;
          border: 1px solid rgba(215,179,93,.54);
          border-radius: 50%;
          font-size: 10px;
          color: var(--sd-gold);
        }

        .sd-metrics {
          position: absolute;
          z-index: 10;
          top: 384px;
          left: 18px;
          right: 18px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          align-items: center;
          gap: 4px;
          pointer-events: none;
        }

        .sd-metric {
          min-width: 0;
          text-align: center;
          padding: 8px 4px 9px;
        }

        .sd-metric + .sd-metric {
          border-left: 1px solid rgba(215,179,93,.28);
        }

        .sd-metric-center {
          justify-self: center;
          width: min(29vw, 118px);
          border-left: 0 !important;
          border-radius: 19px;
          background: rgba(2,4,6,.60);
          box-shadow:
            0 10px 26px rgba(0,0,0,.42),
            inset 0 0 0 1px rgba(215,179,93,.12);
          backdrop-filter: blur(8px);
        }

        .sd-metric-label {
          display: block;
          margin-bottom: 2px;
          font-size: 11px;
          letter-spacing: .12em;
          color: rgba(255,255,255,.72);
        }

        .sd-metric-value {
          display: block;
          font-family: "Chakra Petch", "Noto Sans TC", sans-serif;
          font-size: clamp(34px, 10vw, 48px);
          line-height: 1;
          font-weight: 500;
        }

        .sd-metric-value.is-green { color: var(--sd-neon); }
        .sd-metric-value.is-gold { color: #f0bd5c; }
        .sd-metric-value.is-neutral { color: rgba(255,255,255,.88); }

        .sd-metric-line {
          display: block;
          width: 34px;
          height: 2px;
          margin: 7px auto 0;
          background: currentColor;
          opacity: .75;
        }

        .sd-actions {
          position: absolute;
          z-index: 12;
          top: 490px;
          left: 16px;
          right: 16px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(32px, 12vw, 58px);
          align-items: start;
        }

        .sd-zone {
          min-width: 0;
          padding: 4px 0 0;
        }

        .sd-zone-title {
          margin: 0 0 10px;
          font-family: "Chakra Petch", "Noto Sans TC", sans-serif;
          font-size: clamp(15px, 4vw, 18px);
          letter-spacing: .15em;
          text-align: center;
        }

        .sd-zone-season .sd-zone-title { color: #e0b95b; }
        .sd-zone-casual .sd-zone-title { color: var(--sd-neon); }

        .sd-action-btn,
        .sd-name-input {
          width: 100%;
          min-height: 48px;
          border-radius: 999px;
          font-size: clamp(13px, 3.6vw, 16px);
        }

        .sd-action-btn {
          border: 1px solid rgba(215,179,93,.74);
          background: rgba(6,9,12,.48);
          color: #e5bd61;
          box-shadow: 0 0 22px rgba(215,179,93,.10);
          transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
        }

        .sd-action-btn:active { transform: scale(.97); }

        .sd-zone-season .sd-action-btn + .sd-action-btn { margin-top: 10px; }

        .sd-name-input {
          border: 1px solid rgba(255,255,255,.22);
          background: rgba(5,8,11,.52);
          padding: 0 13px;
          color: #fff;
          outline: none;
        }

        .sd-name-input::placeholder { color: rgba(255,255,255,.42); }

        .sd-casual-submit {
          margin-top: 10px;
          border-color: transparent;
          background: linear-gradient(180deg, #b5f51c, #88cf0b);
          color: #101607;
          font-weight: 800;
          box-shadow: 0 0 26px rgba(169,239,16,.24);
        }

        .sd-casual-cancel {
          margin-top: 10px;
          border-color: rgba(169,239,16,.62);
          color: var(--sd-neon);
        }

        .sd-action-btn:disabled {
          opacity: .42;
          filter: grayscale(.35);
        }

        .sd-choose-wrap {
          position: absolute;
          z-index: 13;
          left: 0;
          right: 0;
          top: 530px;
          display: flex;
          justify-content: center;
        }

        .sd-choose {
          min-width: 210px;
          min-height: 56px;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(180deg, #b8ff14, #8cd80c);
          color: #0c1205;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: .18em;
          box-shadow: 0 0 30px rgba(169,239,16,.27);
        }

        .sd-roster {
          position: relative;
          z-index: 20;
          width: min(calc(100% - 32px), 520px);
          margin: -4px auto 26px;
          padding: 14px 0 calc(env(safe-area-inset-bottom) + 8px);
        }

        .sd-roster-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          margin-bottom: 10px;
          color: rgba(255,255,255,.56);
          font-size: 11px;
          letter-spacing: .12em;
        }

        .sd-roster-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .sd-chip {
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 999px;
          background: rgba(255,255,255,.045);
          padding: 7px 12px;
          font-size: 12px;
          color: rgba(255,255,255,.86);
        }

        .sd-switch {
          margin-top: 14px;
          border: 0;
          background: transparent;
          color: var(--sd-gold);
          font-size: 11px;
          letter-spacing: .12em;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .sd-notice {
          position: fixed;
          z-index: 70;
          left: 50%;
          bottom: calc(env(safe-area-inset-bottom) + 18px);
          transform: translateX(-50%);
          width: min(calc(100% - 32px), 420px);
          border: 1px solid rgba(215,179,93,.24);
          border-radius: 16px;
          background: rgba(5,8,11,.88);
          padding: 11px 14px;
          color: rgba(255,255,255,.88);
          text-align: center;
          font-size: 12px;
          box-shadow: 0 14px 30px rgba(0,0,0,.36);
          backdrop-filter: blur(16px);
        }

        .sd-modal {
          position: fixed;
          z-index: 80;
          inset: 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 16px;
        }

        .sd-modal-backdrop {
          position: absolute;
          inset: 0;
          border: 0;
          background: rgba(0,0,0,.72);
          backdrop-filter: blur(12px);
        }

        .sd-sheet {
          position: relative;
          width: min(100%, 460px);
          max-height: min(76svh, 640px);
          overflow: auto;
          border: 1px solid rgba(215,179,93,.22);
          border-radius: 26px;
          background:
            linear-gradient(180deg, rgba(27,31,36,.98), rgba(10,13,17,.98));
          padding: 18px;
          box-shadow: 0 28px 70px rgba(0,0,0,.55);
        }

        .sd-sheet-title {
          margin: 0 0 14px;
          color: var(--sd-gold);
          font-size: 15px;
          letter-spacing: .14em;
        }

        .sd-meetup-option,
        .sd-member-option {
          width: 100%;
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 18px;
          background: rgba(255,255,255,.035);
          color: #fff;
          text-align: left;
        }

        .sd-meetup-option {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 14px;
        }

        .sd-meetup-option + .sd-meetup-option,
        .sd-member-option + .sd-member-option {
          margin-top: 9px;
        }

        .sd-meetup-date { font-size: 17px; }
        .sd-meetup-venue { margin-top: 3px; font-size: 11px; color: rgba(255,255,255,.55); }
        .sd-meetup-meta { font-size: 11px; color: var(--sd-gold); text-align: right; }

        .sd-member-option {
          padding: 13px 15px;
          font-size: 15px;
        }

        .sd-member-option.is-selected {
          border-color: rgba(169,239,16,.74);
          background: rgba(169,239,16,.10);
          box-shadow: inset 0 0 0 1px rgba(169,239,16,.18);
        }

        .sd-empty {
          padding: 20px 8px;
          text-align: center;
          color: rgba(255,255,255,.48);
          font-size: 13px;
        }

        .sd-confirm {
          width: 100%;
          min-height: 52px;
          margin-top: 14px;
          border: 0;
          border-radius: 999px;
          background: var(--sd-neon);
          color: #111807;
          font-weight: 800;
        }

        .sd-confirm:disabled { opacity: .38; }

        @media (min-width: 640px) {
          .sd-scene { min-height: 790px; }
          .sd-racket-art { top: 42px; width: 360px; }
          .sd-head-info { top: 78px; right: 28px; width: 230px; }
          .sd-metrics { top: 410px; }
          .sd-actions { top: 525px; left: 34px; right: 34px; gap: 82px; }
          .sd-choose-wrap { top: 560px; }
          .sd-modal { align-items: center; }
        }

        @media (max-width: 370px) {
          .sd-scene { min-height: 700px; }
          .sd-racket-art { top: 44px; width: 276px; }
          .sd-head-info { top: 82px; right: 14px; width: 190px; padding: 12px; }
          .sd-metrics { top: 365px; }
          .sd-actions { top: 468px; gap: 30px; }
          .sd-action-btn, .sd-name-input { min-height: 44px; }
          .sd-choose-wrap { top: 505px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sd-solid-layer,
          .sd-molecule {
            transition: none;
          }
        }
      `}</style>

      <div className="sd-molecule">
        <div className={`sd-molecule ${solidReady ? "sd-molecule-hidden" : ""}`}>
          <ClientOnly fallback={null}>
            <Suspense fallback={null}>
              <MoleculeRacket
                stage={stage}
                shadowCount={0}
                activeShadow={-1}
                burstKey={burstKey}
                onShadowClick={() => undefined}
                onHeadPoint={() => undefined}
              />
            </Suspense>
          </ClientOnly>
        </div>
      </div>

      <header className="sd-header">
        <p className="sd-brand">BADMINTON ASSEMBLY</p>
      </header>

      <Link to="/account" className="sd-account">
        帳戶
      </Link>

      <section className="sd-scene">
        <div className={`sd-solid-layer ${solidReady ? "is-ready" : ""}`}>
          <div className="sd-racket-art" aria-hidden="true">
            <img className="sd-racket-shadow sd-shadow-1" src={racketSrc} alt="" />
            <img className="sd-racket-shadow sd-shadow-2" src={racketSrc} alt="" />
            <img className="sd-racket-shadow sd-shadow-3" src={racketSrc} alt="" />
            <img className="sd-racket-main" src={racketSrc} alt="" />
          </div>
        </div>

        {solidReady && stage === "assembled" && (
          <div className="sd-choose-wrap">
            <button className="sd-choose" onClick={() => setPicking(true)}>
              選擇聚會
            </button>
          </div>
        )}

        {solidReady && stage === "standing" && (
          <>
            <div className="sd-head-info">
              <h1 className="sd-meetup-name">BADMINTON ASSEMBLY</h1>
              <InfoRow icon="日" value={`${meetup.date} ${meetup.weekday}`} />
              <InfoRow icon="$" value={meetup.fee} />
              <InfoRow icon="球" value={meetup.ball} />
              <InfoRow icon="人" value={`名額 ${meetup.capacity}`} />
            </div>

            <div className="sd-metrics" aria-label="報名狀態">
              <Metric label="已報" value={reported} tone="green" />
              <Metric label="尚缺" value={missing} tone="gold" center />
              <Metric label="後補" value={waiting} tone="neutral" />
            </div>

            <div className="sd-actions">
              <section className="sd-zone sd-zone-season" aria-label="季打成員操作">
                <h2 className="sd-zone-title">季打成員</h2>
                <button
                  className="sd-action-btn"
                  onClick={() => openMemberAction("season-leave")}
                >
                  季打請假
                </button>
                <button
                  className="sd-action-btn"
                  onClick={() => openMemberAction("season-restore")}
                >
                  季打消假
                </button>
              </section>

              <section className="sd-zone sd-zone-casual" aria-label="臨打報名操作">
                <h2 className="sd-zone-title">臨打報名</h2>
                <input
                  className="sd-name-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="輸入你的名字"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submit();
                  }}
                />
                <button
                  className="sd-action-btn sd-casual-submit"
                  onClick={submit}
                  disabled={!name.trim() || signState !== "idle"}
                >
                  {signState === "sending"
                    ? "送出中…"
                    : signState === "done"
                      ? "✓ 已報名"
                      : "我要報名"}
                </button>
                <button
                  className="sd-action-btn sd-casual-cancel"
                  onClick={() => openMemberAction("casual-cancel")}
                >
                  取消報名
                </button>
              </section>
            </div>
          </>
        )}
      </section>

      {stage === "standing" && (
        <section className="sd-roster">
          <div className="sd-roster-head">
            <span>{meetup.venue} · 目前名單</span>
            <span>
              {roster.length}/{meetup.capacity}
            </span>
          </div>

          <div className="sd-roster-chips">
            {roster.map((member, index) => (
              <span className="sd-chip" key={`${member}-${index}`}>
                {member}
              </span>
            ))}
          </div>

          <button className="sd-switch" onClick={() => setPicking(true)}>
            切換其他聚會
          </button>
        </section>
      )}

      {notice && (
        <button className="sd-notice" onClick={() => setNotice("")}>
          {notice}
        </button>
      )}

      {picking && (
        <div className="sd-modal">
          <button
            className="sd-modal-backdrop"
            aria-label="關閉聚會選單"
            onClick={() => setPicking(false)}
          />
          <div className="sd-sheet">
            <h2 className="sd-sheet-title">選擇聚會</h2>
            {MEETUPS.map((item, index) => (
              <button
                key={item.id}
                className="sd-meetup-option"
                onClick={() => chooseMeetup(index)}
              >
                <span>
                  <span className="sd-meetup-date">
                    {item.date} {item.weekday}
                  </span>
                  <span className="sd-meetup-venue">{item.venue}</span>
                </span>
                <span className="sd-meetup-meta">
                  {item.roster.length}/{item.capacity} 人
                  <br />
                  {item.fee}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {memberAction && (
        <div className="sd-modal">
          <button
            className="sd-modal-backdrop"
            aria-label="關閉人員選單"
            onClick={closeMemberAction}
          />
          <div className="sd-sheet">
            <h2 className="sd-sheet-title">{actionTitle}</h2>

            {actionCandidates.length === 0 ? (
              <div className="sd-empty">目前沒有符合條件的人員</div>
            ) : (
              actionCandidates.map((member) => (
                <button
                  key={member}
                  className={`sd-member-option ${
                    selectedMember === member ? "is-selected" : ""
                  }`}
                  onClick={() => setSelectedMember(member)}
                >
                  {member}
                </button>
              ))
            )}

            <button
              className="sd-confirm"
              disabled={!selectedMember}
              onClick={confirmMemberAction}
            >
              {actionConfirm}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function InfoRow({ icon, value }: { icon: string; value: string }) {
  return (
    <div className="sd-info-row">
      <span className="sd-info-icon">{icon}</span>
      <span>{value}</span>
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
    <div className={`sd-metric ${center ? "sd-metric-center" : ""}`}>
      <span className="sd-metric-label">{label}</span>
      <span className={`sd-metric-value is-${tone}`}>{value}</span>
      <span className="sd-metric-line" />
    </div>
  );
}
