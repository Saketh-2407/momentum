import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { encryptSecret, decryptSecret } from "@/lib/connectors/crypto";

const key = randomBytes(32);
const otherKey = randomBytes(32);

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a plaintext value", () => {
    const encrypted = encryptSecret("my-refresh-token", key);
    expect(decryptSecret(encrypted, key)).toBe("my-refresh-token");
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const a = encryptSecret("same-value", key);
    const b = encryptSecret("same-value", key);
    expect(a).not.toBe(b);
  });

  it("fails to decrypt with the wrong key", () => {
    const encrypted = encryptSecret("secret", key);
    expect(() => decryptSecret(encrypted, otherKey)).toThrow();
  });

  it("fails to decrypt tampered ciphertext", () => {
    const encrypted = encryptSecret("secret", key);
    const [iv, authTag, body] = encrypted.split(".");
    const tamperedBody = Buffer.from(body, "base64");
    tamperedBody[0] ^= 0xff;
    const tampered = [iv, authTag, tamperedBody.toString("base64")].join(".");
    expect(() => decryptSecret(tampered, key)).toThrow();
  });

  it("fails on a malformed stored string", () => {
    expect(() => decryptSecret("not-even-close", key)).toThrow();
  });

  it("round-trips an empty string", () => {
    const encrypted = encryptSecret("", key);
    expect(decryptSecret(encrypted, key)).toBe("");
  });

  it("round-trips a long token", () => {
    const long = "x".repeat(2000);
    const encrypted = encryptSecret(long, key);
    expect(decryptSecret(encrypted, key)).toBe(long);
  });
});
