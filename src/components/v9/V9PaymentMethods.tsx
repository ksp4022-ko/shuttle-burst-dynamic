import { useEffect, useState } from "react";

// V9-031: 付款方式 under the V9 bill -- the same three methods as the V8 bill
// (V8BillingTestPanel); V9-032 shortened wording and coloured buttons.
// Folded by default; each method folds too.
const LINE_PAY_URL = "https://line.me/ti/p/50-eOQgbFr";
const BANK_ACCOUNT = "22168142043";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Safari can reject Clipboard API access even after a direct tap.
    }
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function Chevron() {
  return (
    <svg className="v9-chevron" viewBox="0 0 20 20" aria-hidden="true">
      <path d="m7 4 6 6-6 6" />
    </svg>
  );
}

export function V9PaymentMethods() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <details className="v9-bill-line is-expandable v9-pay">
      <summary>
        <span>
          付款方式
          <Chevron />
        </span>
      </summary>
      <div className="v9-bill-detail v9-pay-list">
        <details className="v9-pay-method">
          <summary>
            <span>LINE Pay</span>
            <Chevron />
          </summary>
          <div className="v9-pay-detail">
            <p>LINE Pay 轉帳給管理員</p>
            <a
              className="v9-pay-btn is-line"
              href={LINE_PAY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              開啟管理員 LINE
            </a>
          </div>
        </details>
        <details className="v9-pay-method">
          <summary>
            <span>銀行轉帳</span>
            <Chevron />
          </summary>
          <div className="v9-pay-detail">
            <p>第一銀行 (007) 新店分行</p>
            <p className="v9-pay-account">
              帳號 <b>{BANK_ACCOUNT}</b>
              <button
                type="button"
                className="v9-pay-btn is-copy"
                onClick={() => void copyText(BANK_ACCOUNT).then(() => setCopied(true))}
              >
                {copied ? "已複製" : "複製"}
              </button>
            </p>
          </div>
        </details>
        <details className="v9-pay-method">
          <summary>
            <span>現金</span>
            <Chevron />
          </summary>
          <div className="v9-pay-detail">
            <p>現場付給管理員</p>
          </div>
        </details>
        <small className="v9-pay-note">付款後，請稍待管理員沖帳更新。</small>
      </div>
    </details>
  );
}
