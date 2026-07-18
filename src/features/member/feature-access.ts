export type MemberAccessState = {
  emailVerified: boolean;
  identityVerified: boolean;
};

export function canCreateProperty(state: MemberAccessState) {
  return state.emailVerified && state.identityVerified;
}

export function propertyAccessMessage(state: MemberAccessState) {
  if (!state.emailVerified) return "完成 Email 驗證後，才能送出身分驗證資料。";
  if (!state.identityVerified) return "身分驗證通過後，才能新增房源資料。";
  return "你已具備新增與管理自己房源的權限。";
}
