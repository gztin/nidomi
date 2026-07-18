import type { ViewingRequirement } from "@/features/property/types";
import type { MemberVerificationState } from "@/features/member/verification";

export const viewingRequirementCopy: Record<ViewingRequirement, { label: string; description: string }> = {
  email_verified: { label: "Email 驗證", description: "完成 Email 驗證即可申請約看" },
  identity_verified: { label: "身分資料驗證", description: "需完成 Email 與身分資料審核" },
};

export function meetsViewingRequirement(requirement: ViewingRequirement, member: MemberVerificationState): boolean {
  if (!member.emailVerified) return false;
  return requirement === "email_verified" || member.identityStatus === "approved";
}
