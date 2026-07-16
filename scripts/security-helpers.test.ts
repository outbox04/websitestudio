import assert from "node:assert/strict";
import test from "node:test";
import { inspectImageBuffer, safeUploadBaseName } from "../tlora-platform/src/lib/image-upload.ts";
import { checkRateLimit } from "../tlora-platform/src/lib/rate-limit.ts";

test("image inspection accepts supported magic bytes", () => {
  assert.equal(inspectImageBuffer(Buffer.from([0xff, 0xd8, 0xff, 0x00]))?.mime, "image/jpeg");
  assert.equal(
    inspectImageBuffer(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime,
    "image/png",
  );
  assert.equal(inspectImageBuffer(Buffer.from("RIFF0000WEBP", "ascii"))?.mime, "image/webp");
});

test("image inspection rejects a forged browser MIME payload", () => {
  assert.equal(inspectImageBuffer(Buffer.from("<script>alert(1)</script>")), null);
});

test("upload filenames are normalized and stripped of path characters", () => {
  assert.equal(safeUploadBaseName("../../Ảnh khách hàng cuối.jpg"), "Anh-khach-hang-cuoi");
});

test("rate limiter blocks after the configured request count and resets", () => {
  const key = `test:${crypto.randomUUID()}`;
  assert.equal(checkRateLimit(key, 2, 1_000, 10_000).allowed, true);
  assert.equal(checkRateLimit(key, 2, 1_000, 10_100).allowed, true);
  assert.equal(checkRateLimit(key, 2, 1_000, 10_200).allowed, false);
  assert.equal(checkRateLimit(key, 2, 1_000, 11_001).allowed, true);
});
