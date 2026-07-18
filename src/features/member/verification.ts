import type { MemberBadgeLevel } from "@/features/property/types";

export type IdentityVerificationStatus = "not_submitted" | "pending" | "changes_requested" | "approved" | "rejected" | "revoked";
export type ProfessionalCredentialStatus = "not_submitted" | "pending" | "approved" | "rejected" | "revoked";

export interface MemberVerificationState {
  emailVerified: boolean;
  identityStatus: IdentityVerificationStatus;
  professionalCredentialStatus: ProfessionalCredentialStatus;
}

export function deriveMemberBadgeLevel(state: MemberVerificationState): MemberBadgeLevel {
  const dataVerified = state.emailVerified && state.identityStatus === "approved";
  if (dataVerified && state.professionalCredentialStatus === "approved") return "gold";
  if (dataVerified) return "green";
  return "bronze";
}

export function canRequestViewing(state: Pick<MemberVerificationState, "emailVerified">): boolean {
  return state.emailVerified;
}
