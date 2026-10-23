import { describe, expect, it, vi, afterEach } from "vitest";
import { relativeTime, formatClock } from "./time";

describe("relativeTime", () => {
  afterEach(() => vi.useRealTimers());

  it("labels sub-minute differences as seconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-23T12:00:00Z"));
    expect(relativeTime("2026-10-23T11:59:42Z")).toBe("18s ago");
  });

  it("labels minute, hour, and day ranges", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-23T12:00:00Z"));
    expect(relativeTime("2026-10-23T11:42:00Z")).toBe("18m ago");
    expect(relativeTime("2026-10-23T07:00:00Z")).toBe("5h ago");
    expect(relativeTime("2026-10-20T12:00:00Z")).toBe("3d ago");
  });

  it("never produces negative labels for future timestamps", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-23T12:00:00Z"));
    expect(relativeTime("2026-10-23T13:00:00Z")).toBe("0s ago");
  });
});

describe("formatClock", () => {
  it("formats local HH:MM:SS with zero padding", () => {
    const d = new Date(2026, 9, 23, 5, 7, 9);
    expect(formatClock(d.toISOString())).toBe("05:07:09");
  });
});
