"use client";
import { useRef,useState } from "react";
import { policyDocuments,type PolicyKey } from "@/content/policies.generated";
import { PolicyContent } from "@/components/policy/policy-content";
import { PasswordField } from "@/components/form/password-field";
import { MIN_PASSWORD_LENGTH } from "@/features/auth/password-policy";

export function RegistrationForm() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<PolicyKey>("terms");
  const [progress, setProgress] = useState(0);
  const [read, setRead] = useState<Record<PolicyKey, boolean>>({ terms: false, privacy: false, member: false });
  const all = Object.values(read).every(Boolean);
  const policy = policyDocuments[active];

  function open(key: PolicyKey) {
    setActive(key);
    setProgress(0);
    dialog.current?.showModal();
  }

  return (
    <>
      <form id="auth-register-panel" className="verification-form auth-form" action="/api/auth/register" method="post" role="tabpanel" aria-labelledby="auth-register-tab">
        <label>暱稱<input name="name" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <PasswordField label="密碼" name="password" minLength={MIN_PASSWORD_LENGTH} required />
        <div className="consent-field policy-consent">
          <input
            id="register-consent"
            name="consent"
            type="checkbox"
            disabled={!all}
            required
            aria-label="已閱讀服務條款跟隱私權政策，註冊視為同意遵守會員規則"
          />
          <p>
            <span>已閱讀</span>
            <button type="button" onClick={() => open("terms")}>服務條款</button>
            <span>跟</span>
            <button type="button" onClick={() => open("privacy")}>隱私權政策</button>
            <span>，註冊視為同意遵守</span>
            <button type="button" onClick={() => open("member")}>會員規則</button>
          </p>
        </div>
        {(Object.keys(policyDocuments) as PolicyKey[]).map((key) => (
          <input type="hidden" name={`read_${key}`} value={read[key] ? policyDocuments[key].version : ""} key={key} />
        ))}
        <button className="button button-primary" type="submit" disabled={!all}>註冊並驗證 Email</button>
      </form>
      <dialog className="policy-reading-dialog" ref={dialog}>
        <header className="policy-reading-header">
          <div><small>版本 {policy.version}</small><h2>{policy.title}</h2></div>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="關閉">×</button>
        </header>
        <div className="policy-progress"><span style={{ width: `${progress}%` }} /><small>閱讀進度 {progress}%</small></div>
        <div className="policy-reading-body" onScroll={(event) => {
          const el = event.currentTarget;
          setProgress(Math.min(100, Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)));
        }}>
          <PolicyContent markdown={policy.markdown} />
        </div>
        <footer className="policy-reading-footer">
          <span>{progress < 100 ? "請繼續閱讀至文件底部" : "已閱讀至文件底部"}</span>
          <button className="button button-primary" disabled={progress < 100} onClick={() => {
            setRead((value) => ({ ...value, [active]: true }));
            dialog.current?.close();
          }}>我已閱讀</button>
        </footer>
      </dialog>
    </>
  );
}
