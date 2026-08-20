import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { getUserCredits } from "@/lib/credits.functions";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "我的帳戶 — 分子球拍報名台" },
      {
        name: "description",
        content: "查看你的帳戶資料與 Lovable 額度使用狀態。",
      },
      {
        property: "og:title",
        content: "我的帳戶 — 分子球拍報名台",
      },
      {
        property: "og:description",
        content: "查看帳戶資料與剩餘 credits。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Account,
});

function Account() {
  const fetchCredits = useServerFn(getUserCredits);
  const { data, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["credits"],
    queryFn: fetchCredits,
    refetchInterval: 30000,
  });

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const credits = data ?? {
    balance: null,
    usedThisPeriod: 0,
    periodLimit: null,
    updatedAt: new Date().toISOString(),
  };

  const percent =
    credits.periodLimit && credits.periodLimit > 0
      ? Math.min(100, (credits.usedThisPeriod / credits.periodLimit) * 100)
      : 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 carbon-surface opacity-70" />
      <div className="relative mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl tracking-wide text-foreground">
            我的帳戶
          </h1>
          <Link
            to="/"
            className="text-sm text-accent underline-offset-4 hover:underline"
          >
            回首頁
          </Link>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-6 backdrop-blur-2xl glow-gold">
          <p className="text-[0.65rem] tracking-[0.35em] text-accent/80 uppercase">
            Lovable 額度
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[0.6rem] tracking-[0.3em] text-muted-foreground">
                剩餘 credits
              </p>
              <p className="font-display text-3xl font-bold text-foreground">
                {isLoading ? "—" : credits.balance ?? "∞"}
              </p>
            </div>
            <div>
              <p className="text-[0.6rem] tracking-[0.3em] text-muted-foreground">
                本期已用
              </p>
              <p className="font-display text-3xl font-bold text-foreground">
                {isLoading ? "—" : credits.usedThisPeriod}
              </p>
            </div>
          </div>

          {credits.periodLimit && credits.periodLimit > 0 && (
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-1 text-[0.65rem] text-muted-foreground">
                {credits.usedThisPeriod} / {credits.periodLimit} credits
              </p>
            </div>
          )}

          <p className="mt-4 text-[0.6rem] text-muted-foreground">
            最後更新：
            {dataUpdatedAt
              ? new Date(dataUpdatedAt).toLocaleString("zh-TW")
              : "—"}
          </p>

          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="mt-4 w-full rounded-full border border-primary/40 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            {isLoading ? "更新中…" : "立即刷新"}
          </button>
        </div>

        <p className="mt-4 text-center text-[0.65rem] text-muted-foreground">
          目前顯示為示範快照；未來可改接 Lovable 計費 API 或 Cloud 資料表以取得即時資料。
        </p>
      </div>
    </main>
  );
}
