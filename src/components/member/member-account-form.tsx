"use client";

import { useRef, useState } from "react";

type MemberAccountFormProps = {
  displayName: string;
  phone: string;
  email: string;
  emailStatus: string;
  identityStatus: string;
  accountStatus: string;
  registeredAt: string;
};

export function MemberAccountForm(props: MemberAccountFormProps) {
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return <form ref={formRef} className="verification-form member-account-form" action="/api/account/profile" method="post">
    <div className="member-account-heading">
      <h2>基本資料</h2>
      {!editing ? <button className="button button-secondary" type="button" onClick={() => setEditing(true)}>編輯</button> : null}
    </div>
    <div className="member-account-grid">
      <label>顯示暱稱<input name="displayName" defaultValue={props.displayName} maxLength={80} readOnly={!editing} required /></label>
      <label>聯絡電話<input name="phone" defaultValue={props.phone} inputMode="tel" maxLength={30} readOnly={!editing} /></label>
      <label>登入帳號（Email）<input className="member-readonly-field" value={props.email} readOnly aria-readonly="true" /></label>
      <label>Email 驗證<input className="member-readonly-field" value={props.emailStatus} readOnly aria-readonly="true" /></label>
      <label>身分驗證<input className={`member-readonly-field ${props.identityStatus === "審核中" ? "member-identity-pending" : ""}`} value={props.identityStatus} readOnly aria-readonly="true" /></label>
      <label>帳號狀態<input className="member-readonly-field" value={props.accountStatus} readOnly aria-readonly="true" /></label>
      <label className="member-account-wide">註冊日期<input className="member-readonly-field" value={props.registeredAt} readOnly aria-readonly="true" /></label>
    </div>
    {editing ? <div className="member-account-actions">
      <button className="button button-primary" type="submit">儲存</button>
      <button className="button button-secondary" type="button" onClick={() => { formRef.current?.reset(); setEditing(false); }}>取消</button>
    </div> : null}
  </form>;
}
