import { describe, expect, it } from "vitest";
import { readImageDimensions } from "../../src/features/images/dimensions";

describe("readImageDimensions", () => {
  it("reads PNG dimensions from IHDR", () => {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    bytes.set([0x49, 0x48, 0x44, 0x52], 12);
    const view = new DataView(bytes.buffer);
    view.setUint32(16, 1920);
    view.setUint32(20, 1080);
    expect(readImageDimensions(bytes.buffer, "image/png")).toEqual({ width: 1920, height: 1080 });
  });

  it("reads JPEG dimensions from a start-of-frame marker", () => {
    const bytes = new Uint8Array([
      0xff, 0xd8,
      0xff, 0xe0, 0x00, 0x04, 0x00, 0x00,
      0xff, 0xc0, 0x00, 0x11, 0x08, 0x04, 0x38, 0x07, 0x80, 0x03, 0x01, 0x11, 0x00,
    ]);
    expect(readImageDimensions(bytes.buffer, "image/jpeg")).toEqual({ width: 1920, height: 1080 });
  });

  it("rejects unsupported or malformed data", () => {
    expect(readImageDimensions(new Uint8Array([1, 2, 3]).buffer, "image/jpeg")).toBeNull();
    expect(readImageDimensions(new Uint8Array(24).buffer, "image/gif")).toBeNull();
  });
});
