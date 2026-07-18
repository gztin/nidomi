import type { ViewingSlot } from "@/features/property/types";

const bookingLeadTimeMs = 12 * 60 * 60 * 1000;

export function isViewingSlotAvailable(slot: ViewingSlot, now = new Date()): boolean {
  if (slot.status !== "available") return false;
  return new Date(slot.startAt).getTime() - now.getTime() >= bookingLeadTimeMs;
}

export function getAvailableViewingSlots(slots: ViewingSlot[], now = new Date()): ViewingSlot[] {
  return slots
    .filter((slot) => isViewingSlotAvailable(slot, now))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

export function formatViewingSlot(slot: ViewingSlot): string {
  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);
  const date = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "numeric", day: "numeric", weekday: "short" }).format(start);
  const time = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} ${time.format(start)}–${time.format(end)}`;
}
