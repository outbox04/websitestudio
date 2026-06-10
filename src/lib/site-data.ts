import { Camera, ImagePlus, Palette, Sparkles, Users } from "lucide-react";

export const services = [
  {
    title: "Concept chân dung cá nhân",
    description: "Moodboard, stylist, makeup và ánh sáng được chuẩn bị theo cá tính của từng khách hàng.",
    icon: Camera,
  },
  {
    title: "Concept gia đình và couple",
    description: "Bố cục nhẹ nhàng, màu ảnh sang trọng, quy trình chọn ảnh riêng qua cổng khách hàng.",
    icon: Users,
  },
  {
    title: "Lookbook thương hiệu",
    description: "Thiết lập phông, đạo cụ và checklist shot list cho sản phẩm, thời trang, profile doanh nghiệp.",
    icon: ImagePlus,
  },
  {
    title: "AI concept preview",
    description: "Tạo bản xem trước trang phục, background và phong cách trước khi đặt lịch chụp thật.",
    icon: Sparkles,
  },
];

export const pricing = [
  {
    name: "Essential",
    price: "1.900.000đ",
    description: "Dành cho chân dung cá nhân hoặc profile nhanh.",
    features: ["1 concept", "60 phút studio", "8 ảnh chỉnh màu", "3 ảnh retouch chi tiết"],
  },
  {
    name: "Signature",
    price: "3.900.000đ",
    description: "Combo cân bằng cho concept cá nhân, couple hoặc gia đình nhỏ.",
    features: ["2 concept", "Makeup cơ bản", "20 ảnh chỉnh màu", "8 ảnh retouch chi tiết"],
    highlighted: true,
  },
  {
    name: "Editorial",
    price: "7.500.000đ",
    description: "Cho lookbook, campaign hoặc concept cần art direction đầy đủ.",
    features: ["3-4 concept", "Stylist + makeup", "Shot list sản xuất", "15 ảnh retouch cao cấp"],
  },
];

export const posts = [
  {
    slug: "chuan-bi-truoc-buoi-chup-concept",
    title: "Chuẩn bị gì trước buổi chụp concept trong studio?",
    excerpt: "Checklist trang phục, makeup, moodboard và cách trao đổi brief để buổi chụp diễn ra mượt.",
    category: "Hướng dẫn",
    readTime: "5 phút đọc",
    likes: 128,
    comments: 14,
  },
  {
    slug: "chon-background-cho-anh-profile",
    title: "Cách chọn background cho ảnh profile chuyên nghiệp",
    excerpt: "Phân biệt nền sáng, nền màu và set ánh sáng tối giản cho từng mục đích sử dụng.",
    category: "Studio Tips",
    readTime: "4 phút đọc",
    likes: 86,
    comments: 9,
  },
  {
    slug: "ai-concept-preview-la-gi",
    title: "AI concept preview giúp tiết kiệm thời gian sản xuất như thế nào?",
    excerpt: "Từ ảnh rõ mặt đến preset trang phục và background, AI giúp khách hình dung concept trước khi đặt lịch.",
    category: "AI Workflow",
    readTime: "6 phút đọc",
    likes: 204,
    comments: 31,
  },
];

export const albumPhotos = [
  {
    id: "drv_001",
    name: "Portrait 01",
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
    status: "Chờ chọn",
  },
  {
    id: "drv_002",
    name: "Portrait 02",
    src: "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=900&q=80",
    status: "Đã chọn",
  },
  {
    id: "drv_003",
    name: "Portrait 03",
    src: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=900&q=80",
    status: "Đang chỉnh",
  },
  {
    id: "drv_004",
    name: "Portrait 04",
    src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    status: "Đã hoàn thành",
  },
];

export const aiPresets = {
  outfits: ["Blazer trắng", "Áo dài hiện đại", "Váy dạ hội tối giản", "Suit đen editorial"],
  backgrounds: ["Studio trắng cao cấp", "Cửa sổ ánh sáng mềm", "Gallery nghệ thuật", "Set hoa pastel"],
  styles: ["Clean beauty", "Fashion editorial", "Korean profile", "Luxury magazine"],
};

export const adminMenu = [
  "Dashboard",
  "Khách hàng",
  "Album",
  "Ảnh cần sửa",
  "Tin tức",
  "AI Workflow",
  "Cài đặt",
];

export const colorSwatches = ["#f8fafc", "#f3e8d7", "#dbeafe", "#fce7f3", "#111827"];

export const creativeTools = [Palette, Sparkles, Camera];
