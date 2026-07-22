export const conceptQuotePricing = {
  packages: [
    { id: "standard", label: "Gói tiêu chuẩn", price: 1_800_000, description: "60 phút, 1 người, 5 ảnh chỉnh sửa" },
    { id: "signature", label: "Gói Signature", price: 3_200_000, description: "120 phút, 2 người, 10 ảnh chỉnh sửa" },
    { id: "premium", label: "Gói Premium", price: 5_500_000, description: "180 phút, 4 người, 18 ảnh chỉnh sửa" },
  ],
  extraPerson: 350_000,
  extraOutfit: 450_000,
  makeup: 650_000,
  printAlbum: 1_200_000,
  weekend: 300_000,
} as const;

export function formatConceptQuote(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}
