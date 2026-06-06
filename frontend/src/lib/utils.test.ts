import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getInitials,
  gradeLetterFromPercent,
  attendancePercent,
  truncate,
} from "./utils";

describe("formatCurrency", () => {
  it("formats USD", () => {
    expect(formatCurrency(1000)).toContain("1,000");
  });
});

describe("formatDate", () => {
  it("returns em dash for empty/zero dates", () => {
    expect(formatDate("")).toBe("—");
    expect(formatDate("0001-01-01T00:00:00Z")).toBe("—");
  });
  it("formats a real date", () => {
    expect(formatDate("2026-06-06")).toMatch(/2026/);
  });
});

describe("getInitials", () => {
  it("uppercases first letters", () => {
    expect(getInitials("ahmed", "ali")).toBe("AA");
  });
  it("handles empty input", () => {
    expect(getInitials("", "")).toBe("");
  });
});

describe("gradeLetterFromPercent", () => {
  it("maps boundaries", () => {
    expect(gradeLetterFromPercent(95)).toBe("A+");
    expect(gradeLetterFromPercent(40)).toBe("D");
    expect(gradeLetterFromPercent(30)).toBe("F");
  });
});

describe("attendancePercent", () => {
  it("avoids divide by zero", () => {
    expect(attendancePercent(0, 0)).toBe(0);
  });
  it("rounds", () => {
    expect(attendancePercent(1, 3)).toBe(33);
  });
});

describe("truncate", () => {
  it("truncates long strings", () => {
    expect(truncate("abcdef", 3)).toBe("abc…");
  });
  it("leaves short strings", () => {
    expect(truncate("ab", 3)).toBe("ab");
  });
});

describe("formatRelativeTime", () => {
  afterEach(() => vi.useRealTimers());

  it("returns em dash for invalid input", () => {
    expect(formatRelativeTime(null)).toBe("—");
    expect(formatRelativeTime("not-a-date")).toBe("—");
  });

  it("renders minutes ago in English", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-06T12:00:00Z"));
    const fiveMinAgo = new Date("2026-06-06T11:55:00Z").toISOString();
    const out = formatRelativeTime(fiveMinAgo, "en");
    expect(out).toMatch(/min/);
  });
});
