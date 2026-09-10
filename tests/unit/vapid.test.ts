import { describe, it, expect } from "vitest";
import { base64UrlToUint8Array } from "@/lib/vapid";

describe("base64UrlToUint8Array", () => {
  it("decodes standard base64url VAPID keys (RFC 8188 padding-less)", () => {
    const bytes = base64UrlToUint8Array("AQAB");
    expect(Array.from(bytes)).toEqual([1, 0, 1]);
  });

  it("round-trips arbitrary bytes through base64url", () => {
    const original = new Uint8Array([0, 1, 254, 255, 42, 128]);
    const b64 = Buffer.from(original).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const decoded = base64UrlToUint8Array(b64);
    expect(Buffer.from(decoded).equals(Buffer.from(original))).toBe(true);
  });
});