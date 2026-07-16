export type SupportedImageMime = "image/jpeg" | "image/png" | "image/webp";

const signatures: Array<{ mime: SupportedImageMime; extension: "jpg" | "png" | "webp"; matches: (buffer: Buffer) => boolean }> = [
  {
    mime: "image/jpeg",
    extension: "jpg",
    matches: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  {
    mime: "image/png",
    extension: "png",
    matches: (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: "image/webp",
    extension: "webp",
    matches: (buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP",
  },
];

export function inspectImageBuffer(buffer: Buffer) {
  return signatures.find((signature) => signature.matches(buffer)) || null;
}

export function safeUploadBaseName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}
