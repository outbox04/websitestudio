export type OptimizedWebImage = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  originalBytes: number;
};

export async function optimizeImageForWeb(file: File): Promise<OptimizedWebImage> {
  const bitmap = await createImageBitmap(file);
  const maxDimension = 1920;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Trình duyệt không hỗ trợ tối ưu ảnh.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let result: Blob | null = null;
  for (const quality of [0.82, 0.74, 0.66, 0.58]) {
    result = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (result && result.size <= 500 * 1024) break;
  }
  if (!result) throw new Error("Không thể tạo ảnh WebP.");

  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-") || "tlora-image";
  const optimizedFile = new File([result], `${baseName}.webp`, { type: "image/webp" });
  return {
    file: optimizedFile,
    previewUrl: URL.createObjectURL(result),
    width,
    height,
    originalBytes: file.size,
  };
}
