import { Camera, ImagePlus, Palette, Sparkles, Users } from "lucide-react";

export const services = [
  {
    title: "Concept chân dung cá nhân",
    description: "Một bộ ảnh được chuẩn bị theo cá tính, màu sắc yêu thích và hình ảnh bạn muốn lưu giữ.",
    icon: Camera,
  },
  {
    title: "Concept gia đình và couple",
    description: "Khoảnh khắc tự nhiên, gần gũi và đủ tinh tế để trở thành bộ ảnh kỷ niệm của riêng hai bạn hoặc cả gia đình.",
    icon: Users,
  },
  {
    title: "Lookbook thương hiệu",
    description: "Hình ảnh chỉn chu cho thời trang, sản phẩm hoặc thương hiệu cá nhân, với concept thống nhất và dễ sử dụng trên nhiều kênh.",
    icon: ImagePlus,
  },
  {
    title: "Retouch và bàn giao album",
    description: "Bạn tự chọn những khoảnh khắc mình yêu thích, gửi mong muốn chỉnh sửa và nhận ảnh hoàn thiện rõ ràng, riêng tư.",
    icon: Palette,
  },
];

export const pricing = [
  {
    name: "Gói Khởi đầu",
    price: "1.900.000đ",
    description: "Phù hợp khi bạn muốn có một bộ ảnh cá nhân gọn nhẹ nhưng vẫn chỉn chu và có dấu ấn riêng.",
    features: ["1 concept", "60 phút studio", "8 ảnh chỉnh màu", "3 ảnh retouch chi tiết"],
  },
  {
    name: "Gói Dấu ấn",
    price: "3.900.000đ",
    description: "Dành cho concept cá nhân, couple hoặc gia đình nhỏ muốn có nhiều lựa chọn trang phục và cảm xúc hơn.",
    features: ["2 concept", "Makeup cơ bản", "20 ảnh chỉnh màu", "8 ảnh retouch chi tiết"],
    highlighted: true,
  },
  {
    name: "Gói Tạp chí",
    price: "7.500.000đ",
    description: "Phù hợp với bộ ảnh thời trang, thương hiệu cá nhân hoặc concept cần nhiều bối cảnh và phong cách nổi bật.",
    features: ["3-4 concept", "Stylist và makeup đồng hành", "Hướng dẫn tạo dáng theo từng bối cảnh", "15 ảnh retouch cao cấp"],
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
    slug: "quy-trinh-chon-anh-online",
    title: "Quy trình chọn ảnh online giúp buổi retouch chính xác hơn",
    excerpt: "Cách album riêng, ghi chú từng ảnh và quyền tải file giúp khách kiểm soát quá trình bàn giao rõ ràng.",
    category: "Workflow Studio",
    readTime: "6 phút đọc",
    likes: 204,
    comments: 31,
  },
];

export const albumPhotos = [
  {
    id: "drv_001",
    name: "Portrait 01",
    src: "/brand/tlora-logo.png",
    status: "Chờ chọn",
  },
  {
    id: "drv_002",
    name: "Portrait 02",
    src: "/brand/tlora-logo.png",
    status: "Đã chọn",
  },
  {
    id: "drv_003",
    name: "Portrait 03",
    src: "/brand/tlora-logo.png",
    status: "Đang chỉnh",
  },
  {
    id: "drv_004",
    name: "Portrait 04",
    src: "/brand/tlora-logo.png",
    status: "Đã hoàn thành",
  },
];

export const aiPresets = {
  outfits: ["Blazer trắng", "Áo dài hiện đại", "Váy dạ hội tối giản", "Suit đen editorial"],
  backgrounds: ["Studio trắng cao cấp", "Cửa sổ ánh sáng mềm", "Gallery nghệ thuật", "Set hoa pastel"],
  styles: ["Clean beauty", "Fashion editorial", "Korean profile", "Luxury magazine"],
};

export const adminMenu = [
  "Tổng quan website",
  "Quản lý album khách hàng",
  "Website CMS",
];

export const colorSwatches = ["#f8fafc", "#f3e8d7", "#dbeafe", "#fce7f3", "#111827"];

export const creativeTools = [Palette, Sparkles, Camera];
