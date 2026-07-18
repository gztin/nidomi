"use client";

import { useState } from "react";

type Decision = "pending" | "approved" | "changes_requested" | "rejected";

const labels: Record<Decision, string> = {
  pending: "待審核",
  approved: "審核通過",
  changes_requested: "需要補件",
  rejected: "審核拒絕",
};

export function IdentityReviewDemo() {
  const [decision, setDecision] = useState<Decision>("pending");

  return (
    <section className="review-card">
      <div className="review-heading"><div><strong>王小明</strong><p>member@example.com・2026/07/12 送出</p></div><span className={`status-pill status-${decision}`}>{labels[decision]}</span></div>
      <div className="controlled-preview"><strong>受控文件預覽</strong><p>開啟文件時會記錄管理員、時間與審核用途。示範頁不載入真實證件。</p></div>
      <label>審核原因／補件說明<textarea rows={4} placeholder="補件、拒絕或撤銷時必填" /></label>
      <div className="review-actions">
        <button className="button button-primary" type="button" onClick={() => setDecision("approved")}>通過</button>
        <button className="button button-secondary" type="button" onClick={() => setDecision("changes_requested")}>要求補件</button>
        <button className="button button-danger" type="button" onClick={() => setDecision("rejected")}>拒絕</button>
      </div>
      <p className="form-note">目前為本機審核互動示範，不會寫入資料庫。</p>
    </section>
  );
}
