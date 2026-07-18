import { describe, expect, it } from "vitest";
import {
  canAddPropertyImages,
  PROPERTY_IMAGE_LIMIT,
  validateIdentityImageDimensions,
} from "../../src/features/images/policy";

describe("property image policy", () => {
  it("allows a property to reach exactly ten active images", () => {
    expect(PROPERTY_IMAGE_LIMIT).toBe(10);
    expect(canAddPropertyImages(8, 2)).toBe(true);
  });

  it("rejects an upload that would create an eleventh image", () => {
    expect(canAddPropertyImages(10, 1)).toBe(false);
    expect(canAddPropertyImages(8, 3)).toBe(false);
  });
});

describe("identity image dimensions", () => {
  it("accepts either image orientation at the minimum dimensions", () => {
    expect(validateIdentityImageDimensions(960, 600)).toBeNull();
    expect(validateIdentityImageDimensions(600, 960)).toBeNull();
  });

  it("rejects images whose long or short edge is too small", () => {
    expect(validateIdentityImageDimensions(959, 600)).toContain("解析度不足");
    expect(validateIdentityImageDimensions(1200, 599)).toContain("解析度不足");
  });
});
