import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = process.cwd();
const server = await createServer({ root, appType: "custom", server: { middlewareMode: true } });

try {
  const billingModule = await server.ssrLoadModule("/src/lib/v8-personal-billing.ts");
  const panelModule = await server.ssrLoadModule(
    "/src/components/v8-active/V8BillingTestPanel.tsx",
  );
  const activeSource = await readFile(
    path.join(root, "src/components/v8-active/V8ActivePage.tsx"),
    "utf8",
  );
  const panelSource = await readFile(
    path.join(root, "src/components/v8-active/V8BillingTestPanel.tsx"),
    "utf8",
  );
  const apiSource = await readFile(path.join(root, "src/lib/database-alpha.ts"), "utf8");
  const routeSource = await readFile(path.join(root, "src/routes/index.tsx"), "utf8");

  assert.equal(billingModule.isP12BillingTestEnabled(""), false);
  assert.equal(billingModule.isP12BillingTestEnabled("?p12BillingTest=0"), false);
  assert.equal(billingModule.isP12BillingTestEnabled("?p12BillingTest=1"), true);
  assert.match(activeSource, /p12BillingTest\s*\?\s*\(\s*<V8BillingTestPanel/);
  assert.match(activeSource, /const \[p12BillingTest, setP12BillingTest\] = useState\(false\)/);
  assert.match(
    activeSource,
    /useEffect\(\(\) => \{\s*setP12BillingTest\(isP12BillingTestEnabled\(\)\);\s*\}, \[\]\)/,
  );
  assert.doesNotMatch(activeSource, /useMemo\(\(\) => isP12BillingTestEnabled\(\), \[\]\)/);
  assert.match(activeSource, /<V8BillingTestPanel\s+open=\{billOpen\}/);
  assert.match(activeSource, /!p12BillingTest && billOpen && seasonPayment/);
  assert.match(activeSource, /p12BillingTest \|\| seasonPayment/);
  assert.match(panelSource, /enabled:\s*open/);
  assert.doesNotMatch(panelSource, /P12|TEST/);
  assert.doesNotMatch(panelSource, /p12-billing-entry/);
  assert.match(routeSource, />\s*Intro\s*<\/button>/);
  assert.doesNotMatch(routeSource, /Replay Intro/);
  assert.match(panelSource, /document\.body\.classList\.add\("v8-billing-open"\)/);
  assert.match(panelSource, /document\.body\.classList\.remove\("v8-billing-open"\)/);
  assert.match(routeSource, /body\.v8-billing-open \.v8-intro-replay-button\s*\{\s*display: none;/);
  assert.match(panelSource, /aria-label="關閉帳務"/);
  assert.match(panelSource, /title="關閉帳務"/);
  assert.match(panelSource, /width: calc\(100% - 44px\); max-width: 346px/);
  assert.match(
    panelSource,
    /\.p12-current-due \{[\s\S]*?display: flex;[\s\S]*?white-space: nowrap/,
  );
  assert.match(panelSource, /overflow-y: auto; overflow-x: hidden/);
  assert.match(
    panelSource,
    /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\);\s*gap: 10px/,
  );
  assert.match(panelSource, /\.p12-header-close \{[\s\S]*?width: 44px; height: 44px/);
  assert.match(
    panelSource,
    /\.p12-payment-heading, \.p12-payment-method > button \{[\s\S]*?min-height: 48px/,
  );
  assert.match(panelSource, /\.p12-method-detail a, \.p12-bank-copy \{[\s\S]*?min-height: 44px/);
  assert.match(panelSource, /\.p12-bank-account \{[\s\S]*?white-space: nowrap/);
  assert.match(panelSource, /navigator\.clipboard\?\.writeText/);
  assert.match(panelSource, /document\.execCommand\("copy"\)/);
  assert.match(panelSource, /String\(summary\.totalAmountDue\)/);
  assert.doesNotMatch(panelSource, /複製金額/);
  assert.doesNotMatch(panelSource, /method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i);
  assert.doesNotMatch(panelSource, /activeSection === "guest" \? "收起" : "查看"/);
  assert.doesNotMatch(panelSource, /activeSection === "season" \? "收起" : "查看"/);
  assert.match(panelSource, /p12-chevron/);
  assert.match(panelSource, /grid-template-rows: 0fr/);
  assert.match(panelSource, /grid-template-rows: 1fr/);
  assert.match(panelSource, /prefers-reduced-motion: reduce/);
  assert.match(panelSource, /p12-row-in/);
  assert.match(apiSource, /fetchV8PersonalBilling[\s\S]*"\/me\/billing"/);
  assert.doesNotMatch(
    apiSource,
    /fetchV8PersonalBilling[\s\S]{0,800}(payerMemberId|lineIdentityId)/,
  );

  const panelClosedHtml = renderToStaticMarkup(
    React.createElement(panelModule.V8BillingTestPanel, {
      open: false,
      onClose: () => undefined,
      token: null,
      siteId: "kangxuan",
      eventId: "event-current",
    }),
  );
  assert.doesNotMatch(panelClosedHtml, /role="dialog"/);

  const panelOpenHtml = renderToStaticMarkup(
    React.createElement(panelModule.V8BillingTestPanel, {
      open: true,
      onClose: () => undefined,
      token: null,
      siteId: "kangxuan",
      eventId: "event-current",
    }),
  );
  const panelVisibleText = panelOpenHtml
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ");
  assert.match(panelVisibleText, /我的帳務/);
  assert.match(panelVisibleText, /康軒｜帳務紀錄/);
  assert.doesNotMatch(panelVisibleText, /P12|TEST/);
  const headerVisibleText = panelOpenHtml
    .match(/<header>([\s\S]*?)<\/header>/)?.[1]
    ?.replace(/<[^>]+>/g, " ");
  assert.doesNotMatch(headerVisibleText ?? "", /關閉/);
  assert.match(panelOpenHtml, /aria-label="關閉帳務"/);

  const ownUnpaid = {
    paymentId: "temp-own",
    signupId: "signup-own",
    eventId: "event-current",
    eventDate: "2026-10-01",
    eventName: "10/1 康軒",
    guestName: "本人測試",
    signupKind: "own",
    ownershipSource: "participant_identity",
    amount: 220,
    status: "unpaid",
    outstanding: 220,
    paidAt: null,
    createdAt: "2026-09-30T12:00:00Z",
    updatedAt: "2026-09-30T12:00:00Z",
    period: "today",
  };
  const proxyPaid = {
    ...ownUnpaid,
    paymentId: "temp-proxy",
    signupId: "signup-proxy",
    eventId: "event-past",
    eventDate: "2026-09-24",
    eventName: "9/24 康軒",
    guestName: "代報球友",
    signupKind: "proxy",
    ownershipSource: "creator_identity",
    amount: 250,
    status: "paid",
    outstanding: 0,
    paidAt: "2026-09-24T15:10:00Z",
    period: "past",
  };
  const proxyUnpaid = {
    ...proxyPaid,
    status: "unpaid",
    outstanding: 250,
    paidAt: null,
  };
  const seasonQ4 = {
    paymentId: "season-q4",
    seasonId: "s4",
    seasonName: "2026 第4季",
    groupId: "g1",
    groupName: "週四",
    baseSeasonFee: 2410,
    refundCreditTotal: 570,
    finalPayableAmount: 1840,
    status: "unpaid",
    amountPaid: 0,
    outstanding: 1840,
    paidAt: null,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    refundSources: [
      {
        creditId: "credit-complete",
        sourceSeasonId: "s3",
        sourceSeasonName: "2026 第3季",
        leaveCount: 3,
        refundUnitAmount: 190,
        refundAmount: 570,
        leaveDates: ["2026-07-16", "2026-07-30", "2026-08-06"],
        leaveDateComplete: true,
      },
    ],
  };
  const seasonQ1 = {
    ...seasonQ4,
    paymentId: "season-q1",
    seasonId: "s5",
    seasonName: "2027 第1季",
    baseSeasonFee: 2600,
    refundCreditTotal: 190,
    finalPayableAmount: 2410,
    status: "paid",
    amountPaid: 2410,
    outstanding: 0,
    paidAt: "2026-12-20T10:00:00Z",
    refundSources: [
      {
        creditId: "credit-incomplete",
        sourceSeasonId: "s4",
        sourceSeasonName: "2026 第4季",
        leaveCount: 1,
        refundUnitAmount: 190,
        refundAmount: 190,
        leaveDates: [],
        leaveDateComplete: false,
      },
    ],
  };
  const first = {
    siteId: "kangxuan",
    currentEvent: { eventId: "event-current", eventDate: "2026-10-01", eventName: "10/1 康軒" },
    totals: {
      currentGuestOutstandingTotal: 220,
      otherGuestOutstandingTotal: 250,
      seasonOutstandingTotal: 1840,
      totalAmountDue: 2310,
    },
    currentGuestItems: [ownUnpaid],
    guestLedger: { items: [proxyUnpaid], nextCursor: "guest-next", hasMore: true, limit: 20 },
    seasonPaymentHistory: {
      items: [seasonQ4],
      nextCursor: "season-next",
      hasMore: true,
      limit: 10,
    },
  };
  const guestNext = {
    ...first,
    guestLedger: {
      items: [
        { ...proxyPaid, paymentId: "temp-future", eventDate: "2026-10-08", period: "upcoming" },
      ],
      nextCursor: null,
      hasMore: false,
      limit: 20,
    },
  };
  const seasonNext = {
    ...first,
    seasonPaymentHistory: { items: [seasonQ1], nextCursor: null, hasMore: false, limit: 10 },
  };

  const mergedGuests = billingModule.mergeV8BillingGuestPage(first, guestNext);
  const mergedSeasons = billingModule.mergeV8BillingSeasonPage(first, seasonNext);
  assert.equal(mergedGuests.guestLedger.items.length, 2);
  assert.equal(mergedGuests.guestLedger.hasMore, false);
  assert.equal(mergedGuests.totals.totalAmountDue, 2310);
  assert.equal(mergedSeasons.seasonPaymentHistory.items.length, 2);
  assert.equal(mergedSeasons.seasonPaymentHistory.hasMore, false);
  assert.equal(mergedSeasons.totals.seasonOutstandingTotal, 1840);

  assert.deepEqual(panelModule.getBillingLedgerSummary(first), {
    guestOutstanding: 470,
    seasonOutstanding: 1840,
    totalAmountDue: 2310,
    consistent: true,
  });
  const seasonOnly = {
    ...first,
    totals: {
      currentGuestOutstandingTotal: 0,
      otherGuestOutstandingTotal: 0,
      seasonOutstandingTotal: 1840,
      totalAmountDue: 1840,
    },
    currentGuestItems: [],
    guestLedger: { items: [proxyPaid], nextCursor: null, hasMore: false, limit: 20 },
  };
  assert.deepEqual(panelModule.getBillingLedgerSummary(seasonOnly), {
    guestOutstanding: 0,
    seasonOutstanding: 1840,
    totalAmountDue: 1840,
    consistent: true,
  });
  assert.equal(
    panelModule.getBillingLedgerSummary({
      ...first,
      totals: { ...first.totals, totalAmountDue: 999 },
    }).consistent,
    false,
  );
  assert.equal(panelModule.nextBillingLedgerSection(null, "guest"), "guest");
  assert.equal(panelModule.nextBillingLedgerSection("guest", "guest"), null);
  assert.equal(panelModule.nextBillingLedgerSection("guest", "season"), "season");

  const authHtml = renderToStaticMarkup(
    React.createElement(panelModule.V8BillingTestContent, { state: { kind: "auth" } }),
  );
  assert.match(authHtml, /登入狀態失效，請重新登入/);

  const readyHtml = renderToStaticMarkup(
    React.createElement(panelModule.V8BillingTestContent, {
      state: {
        kind: "ready",
        billing: { ...mergedGuests, seasonPaymentHistory: mergedSeasons.seasonPaymentHistory },
      },
      onLoadMoreGuest: () => undefined,
      onLoadMoreSeason: () => undefined,
    }),
  );
  for (const expected of ["目前應付", "$2,310", "臨打帳務", "$470", "季費帳務", "$1,840"])
    assert.match(readyHtml, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal((readyHtml.match(/data-ledger-tile=/g) || []).length, 2);
  assert.equal((readyHtml.match(/p12-ledger-accordion is-open/g) || []).length, 0);
  assert.doesNotMatch(readyHtml, /p12-payment-guide is-open/);
  assert.doesNotMatch(
    readyHtml,
    /data-ledger-tile="(?:guest|season)"[\s\S]*?(?:收起|>查看<)[\s\S]*?<\/button>/,
  );
  for (const expected of [
    "付款方式",
    "LINE Pay",
    "銀行轉帳",
    "現金",
    "歡迎使用 LINE Pay 轉帳",
    "完成後將由管理員確認付款。",
    "開啟管理員 LINE",
    "付款後系統不會立即更新",
    "待管理員確認後將顯示為已付款",
    "第一銀行",
    "007",
    "22168142043",
    "複製帳號",
    "現場付款後",
    "由管理員確認並更新付款狀態",
  ])
    assert.match(readyHtml, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(readyHtml, /href="https:\/\/line\.me\/ti\/p\/50-eOQgbFr"/);
  assert.match(readyHtml, /target="_blank"/);
  assert.match(readyHtml, /rel="noopener noreferrer"/);

  const guestHtml = renderToStaticMarkup(
    React.createElement(panelModule.V8BillingTestContent, {
      state: { kind: "ready", billing: seasonOnly },
      initialSection: "guest",
      onLoadMoreGuest: () => undefined,
    }),
  );
  assert.match(guestHtml, /data-ledger-detail="guest"/);
  assert.equal((guestHtml.match(/p12-ledger-accordion is-open/g) || []).length, 1);
  assert.match(guestHtml, /代報｜代報球友/);
  assert.match(guestHtml, /已付款/);
  assert.match(guestHtml, /付款時間/);

  const guestPaginationHtml = renderToStaticMarkup(
    React.createElement(panelModule.V8BillingTestContent, {
      state: { kind: "ready", billing: first },
      initialSection: "guest",
      onLoadMoreGuest: () => undefined,
    }),
  );
  assert.match(guestPaginationHtml, /載入更多/);

  const seasonHtml = renderToStaticMarkup(
    React.createElement(panelModule.V8BillingTestContent, {
      state: {
        kind: "ready",
        billing: {
          ...mergedGuests,
          seasonPaymentHistory: {
            ...mergedSeasons.seasonPaymentHistory,
            nextCursor: "season-next",
            hasMore: true,
          },
        },
      },
      initialSection: "season",
      onLoadMoreSeason: () => undefined,
    }),
  );
  assert.match(seasonHtml, /data-ledger-detail="season"/);
  assert.equal((seasonHtml.match(/p12-ledger-accordion is-open/g) || []).length, 1);
  for (const expected of [
    "2026 第4季",
    "2027 第1季",
    "2026/07/16",
    "2026/07/30",
    "2026/08/06",
    "3 次 × $190 = $570",
    "請假日期資料不足（已記錄 1 次）",
    "載入更多",
  ])
    assert.match(seasonHtml, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  console.log("P12 billing fixture verification PASS");
} finally {
  await server.close();
}
