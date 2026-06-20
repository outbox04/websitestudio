import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ",
  description: "Điều khoản sử dụng website và dịch vụ của TLORA Studio.",
};

const sections = [
  ["1. Phạm vi áp dụng", "Điều khoản này điều chỉnh việc bạn truy cập website, đặt lịch, sử dụng album khách hàng và các dịch vụ chụp ảnh, hậu kỳ hoặc sản phẩm số do TLORA Studio cung cấp. Khi sử dụng dịch vụ, bạn xác nhận đã đọc, hiểu và đồng ý với Điều khoản này cùng Chính sách bảo mật."],
  ["2. Đặt lịch, giá và thanh toán", "Thông tin về gói dịch vụ, giá, ưu đãi, thời gian thực hiện và chi phí phát sinh (nếu có) được TLORA xác nhận với khách hàng trước khi thực hiện. Đặt lịch chỉ được coi là hoàn tất khi các bên đã xác nhận thông tin cần thiết và khoản đặt cọc/thanh toán (nếu áp dụng) được ghi nhận. Hóa đơn, chứng từ được cung cấp theo quy định pháp luật và thỏa thuận thực tế."],
  ["3. Thay đổi hoặc hủy lịch", "Bạn cần thông báo sớm khi muốn thay đổi hoặc hủy lịch. Mức hoàn, chuyển cọc hoặc chi phí phát sinh sẽ căn cứ vào thời điểm thông báo, chi phí chuẩn bị đã phát sinh và thỏa thuận xác nhận cho từng đơn hàng. TLORA sẽ thông báo rõ phương án xử lý trước khi áp dụng."],
  ["4. Trách nhiệm của khách hàng", "Bạn có trách nhiệm cung cấp thông tin chính xác, bảo đảm có quyền sử dụng nội dung/đạo cụ/trang phục do mình cung cấp, tôn trọng nhân sự và không sử dụng dịch vụ cho mục đích trái pháp luật, xâm phạm quyền của người khác hoặc gây mất an toàn. Khách hàng chịu trách nhiệm bảo mật liên kết album và không chia sẻ cho người không được phép."],
  ["5. Album khách hàng và nội dung số", "TLORA cung cấp album trực tuyến để bạn xem, chọn ảnh, gửi yêu cầu chỉnh sửa và tải tệp trong phạm vi gói dịch vụ. Liên kết album là thông tin có tính riêng tư; việc truy cập bằng liên kết có thể được xem là được khách hàng cho phép. TLORA có thể giới hạn, tạm ngưng hoặc thu hồi truy cập khi phát hiện rủi ro bảo mật, sử dụng sai mục đích hoặc theo yêu cầu pháp luật."],
  ["6. Quyền sở hữu trí tuệ và quyền sử dụng hình ảnh", "Bản quyền đối với website, giao diện, nhãn hiệu, ảnh mẫu và tài liệu do TLORA tạo ra thuộc TLORA hoặc bên cấp quyền, trừ khi có thỏa thuận khác bằng văn bản. Quyền sử dụng ảnh bàn giao, phạm vi công bố hình ảnh của khách hàng và sự đồng ý dùng hình ảnh cho portfolio/truyền thông sẽ được xác lập theo thỏa thuận riêng. TLORA không sử dụng hình ảnh nhận diện khách hàng cho mục đích quảng bá nếu chưa có sự đồng ý phù hợp."],
  ["7. Chất lượng, khiếu nại và hỗ trợ", "TLORA thực hiện dịch vụ với sự cẩn trọng hợp lý theo nội dung đã thống nhất. Các yếu tố như điều kiện ánh sáng, thời tiết, sự hợp tác của chủ thể hoặc yêu cầu thay đổi muộn có thể ảnh hưởng kết quả. Nếu có phản ánh, vui lòng liên hệ hello@tlorastudio.vn hoặc 0901 234 567, cung cấp mã đơn/album và nội dung cần hỗ trợ. Chúng tôi tiếp nhận, trao đổi và giải quyết theo thỏa thuận, quy định bảo vệ quyền lợi người tiêu dùng và pháp luật hiện hành."],
  ["8. Giới hạn trách nhiệm", "Trong phạm vi pháp luật cho phép, TLORA không chịu trách nhiệm với thiệt hại gián tiếp hoặc phát sinh từ sự cố ngoài khả năng kiểm soát hợp lý, lỗi kết nối Internet, thiết bị của khách hàng hoặc hành vi của bên thứ ba. Quy định này không loại trừ các trách nhiệm mà pháp luật Việt Nam không cho phép loại trừ."],
  ["9. Tạm ngừng dịch vụ", "TLORA có thể tạm ngừng một phần dịch vụ để bảo trì, khắc phục sự cố, bảo vệ an toàn hệ thống hoặc tuân thủ yêu cầu pháp luật; chúng tôi sẽ nỗ lực thông báo phù hợp khi điều kiện cho phép."],
  ["10. Luật áp dụng và điều khoản chung", "Điều khoản được điều chỉnh bởi pháp luật Việt Nam, bao gồm Luật Bảo vệ quyền lợi người tiêu dùng 2023, Luật Giao dịch điện tử 2023, Nghị định 52/2013/NĐ-CP (được sửa đổi, bổ sung) về thương mại điện tử và quy định liên quan. Tranh chấp được ưu tiên giải quyết bằng thương lượng; nếu không thành, các bên có quyền yêu cầu cơ quan có thẩm quyền tại Việt Nam giải quyết. Nếu một phần Điều khoản không có hiệu lực, các phần còn lại vẫn được áp dụng."],
];

export default function TermsOfServicePage() {
  return (
    <article className="bg-[#14110f] px-4 py-14 text-[#f4ece0] sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-[#f3d88e] transition hover:text-white">← Về trang chủ</Link>
        <p className="mt-10 font-mono text-xs uppercase tracking-[0.16em] text-[#c99a5e]">TLORA Studio</p>
        <h1 className="mt-3 font-heading text-4xl font-extrabold sm:text-5xl">Điều khoản dịch vụ</h1>
        <p className="mt-5 text-sm leading-7 text-[#cbc0b0]">Ngày hiệu lực: 20/06/2026 · Cập nhật lần cuối: 20/06/2026</p>
        <p className="mt-8 text-lg leading-8 text-[#cbc0b0]">Những điều khoản này giúp hai bên thống nhất cách đặt lịch, cung cấp dịch vụ và sử dụng album khách hàng một cách minh bạch.</p>
        <div className="mt-12 space-y-10 [&_p]:mt-4">
          {sections.map(([title, content]) => <section key={title}><h2 className="font-heading text-2xl font-bold text-white">{title}</h2><p className="leading-7 text-[#cbc0b0]">{content}</p></section>)}
        </div>
      </div>
    </article>
  );
}
