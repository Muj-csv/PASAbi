import { describe, expect, it } from "vitest";
import { PROTO_VERSION } from "./index";

describe("core package", () => {
  it("is reachable from the test runner and pins the wire protocol version", () => {
    expect(PROTO_VERSION).toBe(1);
  });
});
