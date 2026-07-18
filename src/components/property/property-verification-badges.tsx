import { VerificationEmblem } from "@/components/member/verification-emblem";

type Verification = {
  identityVerified: boolean;
  listingReviewed: boolean;
  rentalRightsVerified: boolean;
};

export function PropertyVerificationBadges({ verification }: { verification: Verification }) {
  if (!verification.listingReviewed) return null;
  return <div className="property-verification-badges" aria-label="房源驗證標章">
    <VerificationEmblem variant="gold" label="房源已審核" compact />
  </div>;
}
