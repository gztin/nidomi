export const PASSWORD_RESET_BACKOFF_SECONDS = [60, 120, 240, 480, 960] as const;
export const PASSWORD_RESET_TARGET_HOURLY_LIMIT = 5;
export const PASSWORD_RESET_TARGET_DAILY_LIMIT = 10;
export const PASSWORD_RESET_ADMIN_HOURLY_LIMIT = 20;
export const PASSWORD_RESET_GLOBAL_HOURLY_LIMIT = 100;

export function getPasswordResetCooldownSeconds(sentCount24Hours: number) {
  if (sentCount24Hours <= 0) return 0;
  return PASSWORD_RESET_BACKOFF_SECONDS[Math.min(sentCount24Hours - 1, PASSWORD_RESET_BACKOFF_SECONDS.length - 1)];
}

export function getPasswordResetRetryAfterSeconds(sentCount24Hours: number, secondsSinceLastSend: number | null) {
  if (secondsSinceLastSend === null) return 0;
  return Math.max(0, getPasswordResetCooldownSeconds(sentCount24Hours) - Math.max(0, secondsSinceLastSend));
}
