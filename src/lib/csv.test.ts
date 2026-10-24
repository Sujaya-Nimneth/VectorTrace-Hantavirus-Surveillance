import { describe, expect, it } from "vitest";
import { buildCsv } from "./csv";

describe("buildCsv", () => {
  it("joins header and rows with CRLF", () => {
    expect(
      buildCsv(
        ["a", "b"],
        [
          [1, 2],
          [3, 4],
        ],
      ),
    ).toBe("a,b\r\n1,2\r\n3,4");
  });

  it("escapes quotes, commas, and newlines inside fields", () => {
    expect(buildCsv(["h"], [['say "hi", ok\nline']])).toBe('h\r\n"say ""hi"", ok\nline"');
  });

  it("renders null and undefined as empty fields", () => {
    expect(buildCsv(["x", "y"], [[null, undefined]])).toBe("x,y\r\n,");
  });
});
