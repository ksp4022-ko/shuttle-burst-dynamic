import { useEffect, useState } from "react";

// V9-031: 付款方式 under the V9 bill -- the same three methods and wording as
// the V8 bill (V8BillingTestPanel). Folded by default; each method folds too.
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
            <strong>歡迎使用 LINE Pay 轉帳</strong>
            <p>完成後將由管理員確認付款。</p>
            <a
              className="v9-btn is-small"
              href={LINE_PAY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              開啟管理員 LINE
            </a>
            <small>付款後系統不會立即更新，待管理員確認後將顯示為已付款。</small>
          </div>
        </details>
        <details className="v9-pay-method">
          <summary>
            <span>銀行轉帳</span>
            <Chevron />
          </summary>
          <div className="v9-pay-detail">
            <strong>第一銀行</strong>
            <p>銀行代碼 007</p>
            <p className="v9-pay-account">
              帳號 <b>{BANK_ACCOUNT}</b>
            </p>
            <button
              type="button"
              className="v9-btn is-small"
              onClick={() => void copyText(BANK_ACCOUNT).then(() => setCopied(true))}
            >
              {copied ? "已複製" : "複製帳號"}
            </button>
            <small>轉帳完成後，由管理員確認並更新付款狀態。</small>
          </div>
        </details>
        <details className="v9-pay-method">
          <summary>
            <span>現金</span>
            <Chevron />
          </summary>
          <div className="v9-pay-detail">
            <strong>現金</strong>
            <p>現場付款後，由管理員確認並更新付款狀態。</p>
          </div>
        </details>
      </div>
    </details>
  );
}
