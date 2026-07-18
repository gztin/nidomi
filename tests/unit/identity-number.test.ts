import { describe, expect, it } from "vitest";
import {
  isValidTaiwanIdentityNumber,
  maskIdentityNumber,
  normalizeIdentityNumber,
  protectIdentityNumber,
  revealIdentityNumber,
} from "../../src/features/identity/identity-number";

const encryptionSecret = Buffer.alloc(32, 7).toString("base64");
const hmacSecret = Buffer.alloc(32, 9).toString("base64");

describe("Taiwan identity number protection", () => {
  it("normalizes and validates the checksum", () => {
    expect(normalizeIdentityNumber(" a123456789 ")).toBe("A123456789");
    expect(isValidTaiwanIdentityNumber("A123456789")).toBe(true);
    expect(isValidTaiwanIdentityNumber("A123456788")).toBe(false);
    expect(isValidTaiwanIdentityNumber("A323456789")).toBe(false);
  });

  it("masks the number for routine admin views", () => {
    expect(maskIdentityNumber("A123456789")).toBe("A1****6789");
  });

  it("encrypts the number and produces a stable keyed lookup value", async () => {
    const first = await protectIdentityNumber("A123456789", encryptionSecret, hmacSecret);
    const second = await protectIdentityNumber("A123456789", encryptionSecret, hmacSecret);
    expect(first.ciphertext).not.toContain("A123456789");
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(first.lookupHmac).toBe(second.lookupHmac);
    expect(await revealIdentityNumber(first.ciphertext, first.iv, encryptionSecret)).toBe("A123456789");
  });
});
