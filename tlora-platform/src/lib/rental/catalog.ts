export type RentalStatus = "available" | "reserved" | "cleaning" | "rented";
export type RentalCategory = "Concept" | "Fashion" | "Wedding" | "Hanbok" | "Vintage" | "Cổ Trang";

export type RentalProduct = {
  id: string;
  slug: string;
  name: string;
  category: RentalCategory;
  price: number;
  color: string;
  colorHex: string;
  sizes: string[];
  status: RentalStatus;
  images: string[];
  description: string;
  availableDates: string[];
  reservedDates: string[];
  type: "costume" | "accessory";
};

export const rentalStatusMeta: Record<RentalStatus, { label: string; dot: string }> = {
  available: { label: "Có sẵn", dot: "#34d399" },
  reserved: { label: "Không có sẵn", dot: "#71717a" },
  cleaning: { label: "Không có sẵn", dot: "#71717a" },
  rented: { label: "Không có sẵn", dot: "#71717a" },
};

export const rentalCategories: RentalCategory[] = ["Concept", "Fashion", "Wedding", "Hanbok", "Vintage", "Cổ Trang"];
export const rentalSizes = ["XS", "S", "M", "L", "XL"];

export const rentalProducts: RentalProduct[] = [
  { id: "rt-001", slug: "celestial-pink", name: "Celestial Pink", category: "Concept", price: 380000, color: "Hồng phấn", colorHex: "#e9b8c2", sizes: ["S", "M"], status: "available", images: ["/concept/concept-01.webp", "/concept/concept-07.webp", "/concept/concept-14.webp"], description: "Thiết kế corset hoa nổi dành cho concept sinh nhật, beauty và chân dung nghệ thuật.", availableDates: ["2026-07-24", "2026-07-25"], reservedDates: ["2026-07-26", "2026-07-27"], type: "costume" },
  { id: "rt-002", slug: "midnight-butterfly", name: "Midnight Butterfly", category: "Fashion", price: 520000, color: "Đen", colorHex: "#141414", sizes: ["S", "M", "L"], status: "reserved", images: ["/concept/concept-02.webp", "/concept/concept-08.webp", "/concept/concept-13.webp"], description: "Phom đen editorial tạo chiều sâu mạnh cho fashion portrait và concept ánh sáng tương phản.", availableDates: ["2026-07-24", "2026-07-28"], reservedDates: ["2026-07-25", "2026-07-26"], type: "costume" },
  { id: "rt-003", slug: "ivory-vow", name: "Ivory Vow", category: "Wedding", price: 680000, color: "Trắng ngà", colorHex: "#f2efe7", sizes: ["S", "M", "L"], status: "available", images: ["/concept/concept-03.webp", "/concept/concept-09.webp", "/concept/concept-12.webp"], description: "Váy sáng tối giản dành cho ảnh cưới studio, bridal beauty và pre-wedding tinh tế.", availableDates: ["2026-07-24", "2026-07-25"], reservedDates: ["2026-07-27"], type: "costume" },
  { id: "rt-004", slug: "seoul-moon", name: "Seoul Moon", category: "Hanbok", price: 450000, color: "Xanh bạc", colorHex: "#b9c9dc", sizes: ["S", "M"], status: "cleaning", images: ["/concept/concept-04.webp", "/concept/concept-10.webp"], description: "Bảng màu thanh thoát, phom mềm phù hợp concept Hàn Quốc và chân dung kỷ niệm.", availableDates: ["2026-07-28", "2026-07-29"], reservedDates: ["2026-07-24"], type: "costume" },
  { id: "rt-005", slug: "velvet-archive", name: "Velvet Archive", category: "Vintage", price: 420000, color: "Nâu", colorHex: "#765445", sizes: ["M", "L"], status: "rented", images: ["/concept/concept-05.webp", "/concept/concept-11.webp"], description: "Chất liệu và sắc độ cổ điển dành cho portrait hoài niệm, film look và editorial vintage.", availableDates: ["2026-07-29", "2026-07-30"], reservedDates: ["2026-07-24", "2026-07-25"], type: "costume" },
  { id: "rt-006", slug: "jade-dynasty", name: "Jade Dynasty", category: "Cổ Trang", price: 560000, color: "Xanh ngọc", colorHex: "#6f9d8d", sizes: ["S", "M", "L"], status: "available", images: ["/concept/concept-06.webp", "/concept/concept-12.webp"], description: "Phom cổ trang nhiều lớp, phù hợp concept mỹ nhân, kiếm hiệp và ảnh nghệ thuật ngoại cảnh.", availableDates: ["2026-07-24", "2026-07-25"], reservedDates: ["2026-07-26", "2026-07-27"], type: "costume" },
];

export const rentalAccessories: RentalProduct[] = [
  { id: "ra-001", slug: "vuong-mien-pha-le", name: "Vương miện pha lê", category: "Wedding", price: 90000, color: "Bạc", colorHex: "#d9dde2", sizes: ["One size"], status: "available", images: ["/concept/concept-09.webp"], description: "Vương miện ánh bạc cho bridal và princess concept.", availableDates: [], reservedDates: [], type: "accessory" },
  { id: "ra-002", slug: "hoa-cam-tay-ivory", name: "Hoa cầm tay Ivory", category: "Wedding", price: 70000, color: "Trắng", colorHex: "#f4f1e8", sizes: ["One size"], status: "available", images: ["/concept/concept-03.webp"], description: "Bó hoa tông ivory tối giản.", availableDates: [], reservedDates: [], type: "accessory" },
  { id: "ra-003", slug: "khuyen-tai-starlight", name: "Khuyên tai Starlight", category: "Fashion", price: 50000, color: "Bạc", colorHex: "#d9dde2", sizes: ["One size"], status: "available", images: ["/concept/concept-14.webp"], description: "Khuyên tai bắt sáng cho beauty portrait.", availableDates: [], reservedDates: [], type: "accessory" },
  { id: "ra-004", slug: "voan-soft-light", name: "Voan Soft Light", category: "Wedding", price: 120000, color: "Trắng", colorHex: "#f4f1e8", sizes: ["One size"], status: "available", images: ["/concept/concept-01.webp"], description: "Voan mềm tạo chuyển động cho ảnh cưới và fashion.", availableDates: [], reservedDates: [], type: "accessory" },
];

export const allRentalItems = [...rentalProducts, ...rentalAccessories];
export function getRentalProduct(slugOrId: string) { return allRentalItems.find((item) => item.slug === slugOrId || item.id === slugOrId); }
export function formatRentalMoney(value: number) { return `${Math.round(value).toLocaleString("vi-VN")}đ`; }
