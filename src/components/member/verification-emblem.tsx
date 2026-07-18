export type VerificationEmblemVariant = "gray" | "green" | "blue" | "gold";

export function VerificationEmblem({
  variant,
  label,
  compact = false,
}: {
  variant: VerificationEmblemVariant;
  label: string;
  compact?: boolean;
}) {
  return (
    <span className={`verification-emblem verification-emblem-${variant}${compact ? " is-compact" : ""}`} aria-label={label}>
      <span className="verification-emblem-face" aria-hidden="true" />
    </span>
  );
}
