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

  assert.equal(billingModule.isP12BillingTestEnabled(""), false);
  assert.equal(billingModule.isP12BillingTestEnabled("?p12BillingTest=0"), false);
  assert.equal(billingModule.isP12BillingTestEnabled("?p12BillingTest=1"), true);
  assert.match(activeSource, /p12BillingTest\s*\?\s*\(\s*<V8BillingTestPanel/);
  assert.match(activeSource, /const \[p12BillingTest, setP12BillingTest\] = useState\(false\)/);
  assert.match(activeSource, /useEffect\(\(\) => \{\s*setP12BillingTest\(isP12BillingTestEnabled\(\)\);\s*\}, \[\]\)/);
  assert.doesNotMatch(activeSource, /useMemo\(\(\) => isP12BillingTestEnabled\(\), \[\]\)/);
  assert.match(panelSource, /enabled:\s*open/);
  assert.match(panelSource, /P12 TEST｜我的帳務/);
  assert.match(apiSource, /fetchV8PersonalBilling[\s\S]*"\/me\/billing"/);
  assert.doesNotMatch(
    apiSource,
    /fetchV8PersonalBilling[\s\S]{0,800}(payerMemberId|lineIdentityId)/,
  );

  const panelEntryHtml = renderToStaticMarkup(
    React.createElement(panelModule.V8BillingTestPanel, {
      token: null,
      siteId: "kangxuan",
      eventId: "event-current",
    }),
  );
  assert.match(panelEntryHtml, /P12 TEST｜我的帳務/);

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
  const seasonQ4 = {
    paymentId: "season-q4",
    seasonId: "s4",
    seasonName: "2026 第4季",
    groupId: "g1",
    groupName: "週四",
    baseSeasonFee: 2470,
    refundCreditTotal: 380,
    finalPayableAmount: 2090,
    status: "unpaid",
    amountPaid: 0,
    outstanding: 2090,
    paidAt: null,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    refundSources: [
      {
        creditId: "credit-complete",
        sourceSeasonId: "s3",
        sourceSeasonName: "2026 第3季",
        leaveCount: 2,
        refundUnitAmount: 190,
        refundAmount: 380,
        leaveDates: ["2026-07-09", "2026-08-20"],
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
      otherGuestOutstandingTotal: 0,
      seasonOutstandingTotal: 2090,
      totalAmountDue: 2310,
    },
    currentGuestItems: [ownUnpaid],
    guestLedger: { items: [proxyPaid], nextCursor: "guest-next", hasMore: true, limit: 20 },
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
  assert.equal(mergedSeasons.totals.seasonOutstandingTotal, 2090);

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
  for (const expected of [
    "目前應付總額",
    "$2,310",
    "本人測試",
    "代報球友",
    "已付款",
    "未付款",
    "2026 第4季",
    "2027 第1季",
    "2026/07/09",
    "2026/08/20",
    "請假日期資料不足（已記錄 1 次）",
  ])
    assert.match(readyHtml, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  console.log("P12 billing fixture verification PASS");
} finally {
  await server.close();
}
