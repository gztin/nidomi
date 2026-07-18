type VerificationEmailInput = {
  displayName?: string;
  verificationUrl: string;
};

type PasswordResetEmailInput = {
  displayName?: string;
  resetUrl: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

export function buildVerificationEmail({ displayName, verificationUrl }: VerificationEmailInput) {
  const greeting = displayName ? `${displayName}，您好：` : "您好：";
  const safeGreeting = escapeHtml(greeting);
  const safeUrl = escapeHtml(verificationUrl);

  return {
    subject: "驗證你的 nidomi Email",
    text: `${greeting}\n\n請開啟以下連結完成 Email 驗證：\n${verificationUrl}\n\n連結將於 24 小時後失效。若非您本人提出申請，請忽略此信。`,
    html: `<!doctype html><html lang="zh-Hant"><body style="margin:0;background:#f5f7f3;font-family:Arial,'Noto Sans TC',sans-serif;color:#15231d"><div style="max-width:600px;margin:32px auto;padding:36px;background:#fff;border:1px solid #d9e1d8;border-radius:20px"><p style="margin:0 0 24px;color:#24704d;font-weight:700">nidomi</p><h1 style="font-size:28px;margin:0 0 20px">驗證你的 Email</h1><p>${safeGreeting}</p><p>請點擊下方按鈕完成 Email 驗證，以確保你能收到預約看房等重要通知。</p><p style="margin:32px 0"><a href="${safeUrl}" style="display:inline-block;padding:14px 24px;border-radius:12px;background:#1f6b49;color:#fff;text-decoration:none;font-weight:700">完成 Email 驗證</a></p><p style="color:#617068;font-size:14px">連結將於 24 小時後失效。若非您本人提出申請，請忽略此信。</p></div></body></html>`,
  };
}

export function buildPasswordResetEmail({ displayName, resetUrl }: PasswordResetEmailInput) {
  const greeting = displayName ? `${displayName}，您好：` : "您好：";
  const safeGreeting = escapeHtml(greeting);
  const safeUrl = escapeHtml(resetUrl);

  return {
    subject: "重設你的 nidomi 密碼",
    text: `${greeting}\n\n管理員已協助你申請密碼重設。請開啟以下連結設定新密碼：\n${resetUrl}\n\n連結將於 1 小時後失效，且只能使用一次。若非你本人提出需求，請勿開啟連結並聯絡管理員。`,
    html: `<!doctype html><html lang="zh-Hant"><body style="margin:0;background:#f5f7f3;font-family:Arial,'Noto Sans TC',sans-serif;color:#15231d"><div style="max-width:600px;margin:32px auto;padding:36px;background:#fff;border:1px solid #d9e1d8;border-radius:20px"><p style="margin:0 0 24px;color:#24704d;font-weight:700">nidomi</p><h1 style="font-size:28px;margin:0 0 20px">重設你的密碼</h1><p>${safeGreeting}</p><p>管理員已協助你申請密碼重設。請點擊下方按鈕設定新密碼。</p><p style="margin:32px 0"><a href="${safeUrl}" style="display:inline-block;padding:14px 24px;border-radius:12px;background:#1f6b49;color:#fff;text-decoration:none;font-weight:700">設定新密碼</a></p><p style="color:#617068;font-size:14px">連結將於 1 小時後失效，且只能使用一次。若非你本人提出需求，請勿開啟連結並聯絡管理員。</p></div></body></html>`,
  };
}
