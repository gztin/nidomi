import { describe, expect, it } from "vitest";
import type { ViewingSlot } from "../../src/features/property/types";
import { getAvailableViewingSlots, isViewingSlotAvailable } from "../../src/features/viewing/availability";

const now = new Date("2026-07-11T10:00:00+08:00");

function slot(id: string, startAt: string, status: ViewingSlot["status"] = "available"): ViewingSlot {
  return { id, startAt, endAt: "2026-07-12T23:00:00+08:00", status };
}

describe("viewing availability", () => {
  it("只接受開放中且至少提前 12 小時的時段", () => {
    expect(isViewingSlotAvailable(slot("valid", "2026-07-11T22:00:00+08:00"), now)).toBe(true);
    expect(isViewingSlotAvailable(slot("too-soon", "2026-07-11T21:59:00+08:00"), now)).toBe(false);
    expect(isViewingSlotAvailable(slot("held", "2026-07-12T10:00:00+08:00", "held"), now)).toBe(false);
  });

  it("依開始時間排列可預約時段", () => {
    const slots = [
      slot("later", "2026-07-13T10:00:00+08:00"),
      slot("earlier", "2026-07-12T10:00:00+08:00"),
      slot("confirmed", "2026-07-11T23:00:00+08:00", "confirmed"),
    ];

    expect(getAvailableViewingSlots(slots, now).map(({ id }) => id)).toEqual(["earlier", "later"]);
  });
});
