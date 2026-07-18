"use client";

import { useRef } from "react";
import type { MemberBadgeLevel } from "@/features/property/types";
import { VerificationEmblem, type VerificationEmblemVariant } from "@/components/member/verification-emblem";

const badgeCopy: Record<MemberBadgeLevel, { label: string; shortDescription: string; variant: VerificationEmblemVariant }> = {
  bronze: { label: "普通會員", shortDescription: "已完成會員註冊", variant: "gray" },
  green: { label: "認證會員", shortDescription: "已完成身分與 Email 驗證", variant: "green" },
  gold: { label: "證照會員", shortDescription: "身分及專業證照文件已通過審核", variant: "blue" },
};

const badgeLevels: MemberBadgeLevel[] = ["bronze", "green", "gold"];

export function MemberVerificationBadge({ level, providerName }: { level: MemberBadgeLevel; providerName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const current = badgeCopy[level];

  return (
    <div className="provider-verification">
      <p className="provider-name">房源提供者：{providerName}</p>
      <div className="member-badge-row">
        <VerificationEmblem variant={current.variant} label={current.label} compact />
        <button className="badge-help-button" type="button" onClick={() => dialogRef.current?.showModal()} aria-haspopup="dialog">
          標章說明
        </button>
      </div>

      <dialog className="badge-dialog" ref={dialogRef} onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}>
        <div className="badge-dialog-panel">
          <div className="badge-dialog-header">
            <div><p className="eyebrow">會員驗證制度</p><h2>會員標章說明</h2></div>
            <button className="dialog-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="關閉標章說明">×</button>
          </div>
          <div className="badge-level-list">
            {badgeLevels.map((badgeLevel) => (
              <div className={`badge-level badge-level-${badgeLevel}`} key={badgeLevel}>
                <VerificationEmblem variant={badgeCopy[badgeLevel].variant} label={badgeCopy[badgeLevel].label} compact />
                <div><strong>{badgeCopy[badgeLevel].label}</strong><p>{badgeCopy[badgeLevel].shortDescription}</p></div>
              </div>
            ))}
          </div>
          <p className="badge-disclaimer">會員標章僅表示指定資料已依平台流程完成驗證，不代表平台保證會員身分以外的資訊、專業能力、履約能力或交易安全。</p>
        </div>
      </dialog>
    </div>
  );
}
