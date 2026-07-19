import type { Metadata } from "next";
import { HomeCinematic } from "@/components/public/home-cinematic";
import { TlEcosystemExperience, type TlEcosystemBranch } from "@/components/public/tl-ecosystem-experience";
import { tlEcosystemBranches, tlLogoPlaceholder } from "@/lib/tl-ecosystem";
import { buildTloraPageMetadata } from "@/lib/tlora-metadata";
import { getPublishedTloraPageMeta, getPublishedTloraSection } from "@/repositories/tlora/cms-repository";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPublishedTloraPageMeta("services");
  return buildTloraPageMetadata(meta, "/dich-vu", {
    title: "Hệ sinh thái TL | Media, Studio & Academy",
    description: "TL Media, TLORA Studio và TL Academy — sản xuất hình ảnh, sáng tạo concept và đào tạo nhiếp ảnh.",
  });
}

export const dynamic = "force-dynamic";

const branchDetails = [
  {
    introTitle: "KỂ CHUYỆN THẬT",
    introText: "Một đội ngũ sản xuất linh hoạt cho những khoảnh khắc tập thể, sự kiện và ngày trọng đại — từ ý tưởng đến hình ảnh hoàn thiện.",
    products: [
      { name: "KỶ YẾU SIGNATURE", label: "Bộ ảnh tập thể có concept và câu chuyện riêng." },
      { name: "WEDDING STORY", label: "Phóng sự cưới tự nhiên, giàu cảm xúc." },
      { name: "EVENT COVERAGE", label: "Ghi hình sự kiện trọn vẹn và chuyên nghiệp." },
    ],
    suggestions: ["DỰ ÁN TIÊU BIỂU", "QUY TRÌNH SẢN XUẤT", "BÁO GIÁ THEO BRIEF"],
  },
  {
    introTitle: "TẠO DẤU ẤN",
    introText: "Không gian sáng tạo nơi cá tính được chuyển thành ngôn ngữ hình ảnh qua ánh sáng, styling, concept và kỹ thuật hậu kỳ tinh tế.",
    products: [
      { name: "BEAUTY SESSION", label: "Chân dung beauty tinh gọn và cao cấp." },
      { name: "FASHION EDITORIAL", label: "Hình ảnh thời trang mang tinh thần tạp chí." },
      { name: "CONCEPT PORTRAIT", label: "Bộ ảnh cá nhân được thiết kế theo cá tính." },
    ],
    suggestions: ["ALBUM CONCEPT", "HẬU TRƯỜNG", "ĐẶT LỊCH STUDIO"],
  },
  {
    introTitle: "LÀM CHỦ HÌNH ẢNH",
    introText: "Chương trình học thiên về thực hành, giúp người học hiểu thiết bị, ánh sáng và hậu kỳ để chủ động tạo ra hình ảnh có chất riêng.",
    products: [
      { name: "KHÓA CHỤP ẢNH", label: "Nền tảng máy ảnh, bố cục và ánh sáng." },
      { name: "KHÓA CHỈNH ẢNH", label: "Quy trình màu sắc, retouch và xuất file." },
      { name: "MENTOR 1:1", label: "Lộ trình cá nhân hóa cùng giảng viên." },
    ],
    suggestions: ["LỘ TRÌNH HỌC", "DỰ ÁN HỌC VIÊN", "LỊCH KHAI GIẢNG"],
  },
] as const;

type ServicesPageProps = { searchParams: Promise<{ "linh-vuc"?: string }> };

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const [content, params] = await Promise.all([
    getPublishedTloraSection("home", "services"),
    searchParams,
  ]);
  const textValues = content.text as Record<string, unknown> | undefined;
  const imageValues = content.images as Record<string, unknown> | undefined;
  const text = (key: string, fallback: string) => typeof textValues?.[key] === "string" ? String(textValues[key]) : fallback;
  const image = (key: string, fallback: string) => typeof imageValues?.[key] === "string" && imageValues[key] ? String(imageValues[key]) : fallback;

  const branches: TlEcosystemBranch[] = tlEcosystemBranches.map((branch, branchIndex) => {
    const detail = branchDetails[branchIndex];
    return {
      name: text(`ecosystemPage.branch.${branchIndex}.name`, branch.name),
      label: text(`ecosystemPage.branch.${branchIndex}.label`, branch.label),
      description: text(`ecosystemPage.branch.${branchIndex}.description`, branch.description),
      image: image(`ecosystemPage.branch.${branchIndex}.image`, branch.image),
      imagePosition: branch.imagePosition,
      logo: image(`ecosystemPage.branch.${branchIndex}.logo`, tlLogoPlaceholder),
      services: branch.services.map((service, serviceIndex) => text(`ecosystemPage.branch.${branchIndex}.service.${serviceIndex}`, service)),
      introTitle: text(`ecosystemPage.branch.${branchIndex}.introTitle`, detail.introTitle),
      introText: text(`ecosystemPage.branch.${branchIndex}.introText`, detail.introText),
      products: detail.products.map((product, productIndex) => ({
        name: text(`ecosystemPage.branch.${branchIndex}.product.${productIndex}.name`, product.name),
        label: text(`ecosystemPage.branch.${branchIndex}.product.${productIndex}.label`, product.label),
      })),
      suggestions: [...detail.suggestions],
    };
  });

  const initialIndex = params["linh-vuc"] === "studio" ? 1 : params["linh-vuc"] === "academy" ? 2 : 0;

  return (
    <div className="home-luxury overflow-hidden">
      <HomeCinematic />
      <TlEcosystemExperience
        eyebrow={text("ecosystemPage.eyebrow", "TL CREATIVE GROUP")}
        title={text("ecosystemPage.title", "HỆ SINH THÁI TL")}
        branches={branches}
        initialIndex={initialIndex}
      />
    </div>
  );
}
