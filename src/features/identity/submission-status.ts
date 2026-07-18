export type IdentitySubmissionStatus = "pending" | "changes_requested" | "approved" | "rejected" | "revoked";

export function identityStatusLabel(status: IdentitySubmissionStatus | null, identityVerified: boolean) {
  if (identityVerified || status === "approved") return "已驗證";
  if (status === "pending") return "審核中";
  if (status === "changes_requested") return "需補件";
  if (status === "rejected") return "未通過";
  return "未驗證";
}

export function canUploadIdentity(status: IdentitySubmissionStatus | null, identityVerified: boolean) {
  return !identityVerified && status !== "approved";
}

export function identityUploadLabel(status: IdentitySubmissionStatus | null) {
  return status ? "重新上傳資料" : "前往身分驗證";
}
