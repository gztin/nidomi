export type MemberBadgeLevel = "bronze" | "green" | "gold";

export interface PropertyProvider {
  displayName: string;
  memberBadge: MemberBadgeLevel;
}

export interface PropertyImage {
  src: string;
  alt: string;
}

export interface PropertyFee {
  name: string;
  value: string;
  note: string;
}

export type ViewingSlotStatus = "available" | "held" | "confirmed" | "closed";
export type ViewingRequirement = "email_verified" | "identity_verified";

export interface ViewingSlot {
  id: string;
  startAt: string;
  endAt: string;
  status: ViewingSlotStatus;
}

export interface PropertyDetail {
  id: string;
  title: string;
  publicLocation: string;
  monthlyRent: number;
  depositAmount: number;
  propertyType: string;
  layout: string;
  areaPing: number;
  floorLabel: string;
  availableFrom: string;
  minimumLeaseMonths: number;
  viewingRequirement: ViewingRequirement;
  provider: PropertyProvider;
  verification: {
    identityVerified: boolean;
    listingReviewed: boolean;
    rentalRightsVerified: boolean;
  };
  summary: string;
  fees: PropertyFee[];
  equipment: string[];
  conditions: string[];
  services: string[];
  knownConditions: string[];
  nearby: string[];
  viewingSlots: ViewingSlot[];
  images: PropertyImage[];
}
