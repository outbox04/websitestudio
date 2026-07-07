import { ScrollText } from "lucide-react";
import { PlaceholderPage } from "./PlaceholderPage";

export function ActivityLogPage() {
  return (
    <PlaceholderPage
      title="Nhật ký"
      description="Lịch sử thao tác của toàn hệ thống, có thể lọc và xuất Excel"
      icon={ScrollText}
      upcoming={[
        "Ghi lại tên thao tác, người thực hiện, thời gian, album liên quan và kết quả",
        "Bộ lọc theo album, người dùng, loại thao tác và khoảng thời gian",
        "Xuất nhật ký đã lọc ra file Excel để lưu trữ hoặc báo cáo",
        "Đánh dấu rõ các thao tác lỗi để xử lý lại nhanh chóng",
      ]}
    />
  );
}
