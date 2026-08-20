import { createServerFn } from "@tanstack/react-start";

export interface UserCredits {
  /** 剩餘 credits；null 代表無上限。 */
  balance: number | null;
  /** 本期已用額度。 */
  usedThisPeriod: number;
  /** 本期上限；null 代表無個人上限。 */
  periodLimit: number | null;
  /** ISO 8601 更新時間。 */
  updatedAt: string;
}

/**
 * 目前回傳 Lovable 工作區 credit 用量的快照示範資料。
 * 未來若 Lovable 提供對應的公開計費 API，可將此 handler 改為真實查詢。
 */
export const getUserCredits = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserCredits> => {
    // 目前值取自最近一次查詢：本期已用 6 credits，無個人上限。
    return {
      balance: null,
      usedThisPeriod: 6,
      periodLimit: null,
      updatedAt: new Date().toISOString(),
    };
  },
);
