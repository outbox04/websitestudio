import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description: "Chính sách bảo vệ dữ liệu cá nhân của TLORA Studio.",
  openGraph: {
    title: "Chính sách bảo mật",
    description: "Chính sách bảo vệ dữ liệu cá nhân của TLORA Studio.",
    images: ["/brand/tlora-logo.png"],
  },
};

const sections = [
  {
    title: "1. Phạm vi và người kiểm soát dữ liệu",
    content: (
      <>
        <p>
          Chính sách này áp dụng khi bạn truy cập website, đặt lịch, sử dụng album khách hàng, gửi yêu cầu chỉnh sửa hoặc liên hệ với TLORA Studio (gọi chung là “TLORA”, “chúng tôi”). TLORA là bên kiểm soát dữ liệu cá nhân đối với dữ liệu được thu thập trực tiếp qua các kênh này.
        </p>
        <p>
          Nếu có câu hỏi hoặc yêu cầu về dữ liệu cá nhân, vui lòng liên hệ: <a className="text-[#f3d88e] underline underline-offset-4" href="mailto:hello@tlorastudio.vn">hello@tlorastudio.vn</a> hoặc 0901 234 567.
        </p>
      </>
    ),
  },
  {
    title: "2. Dữ liệu chúng tôi có thể thu thập",
    content: (
      <ul>
        <li>Thông tin liên hệ và giao dịch: họ tên, số điện thoại, email, nội dung trao đổi, thông tin đặt lịch và thanh toán.</li>
        <li>Thông tin dự án: concept, yêu cầu chụp/chỉnh sửa, ảnh, video, ghi chú và lựa chọn của bạn trong album riêng.</li>
        <li>Dữ liệu kỹ thuật cần thiết để vận hành dịch vụ: địa chỉ IP, loại thiết bị/trình duyệt, nhật ký truy cập và mã định danh phiên.</li>
      </ul>
    ),
  },
  {
    title: "3. Mục đích và căn cứ xử lý",
    content: (
      <>
        <p>Chúng tôi chỉ xử lý dữ liệu trong phạm vi cần thiết để:</p>
        <ul>
          <li>tư vấn, xác nhận lịch, thực hiện dịch vụ, bàn giao sản phẩm và hỗ trợ sau dịch vụ;</li>
          <li>cung cấp, bảo mật và cải thiện album khách hàng cùng các chức năng của website;</li>
          <li>thực hiện nghĩa vụ kế toán, thuế, giải quyết khiếu nại, ngăn ngừa gian lận và tuân thủ yêu cầu hợp pháp của cơ quan nhà nước;</li>
          <li>gửi thông tin tiếp thị khi bạn đã đồng ý; bạn có thể rút lại sự đồng ý này bất cứ lúc nào.</li>
        </ul>
        <p>Việc xử lý được thực hiện trên cơ sở sự đồng ý của bạn, việc thực hiện hợp đồng/dịch vụ đã yêu cầu, nghĩa vụ pháp lý hoặc lợi ích hợp pháp phù hợp với quy định pháp luật.</p>
      </>
    ),
  },
  {
    title: "4. Chia sẻ và xử lý dữ liệu",
    content: (
      <>
        <p>TLORA không bán dữ liệu cá nhân. Dữ liệu có thể được cung cấp cho nhân sự được phân quyền và nhà cung cấp hạ tầng cần thiết để vận hành dịch vụ, như Supabase, Google Drive và Vercel, theo phạm vi công việc và biện pháp bảo mật phù hợp.</p>
        <p>Chúng tôi chỉ cung cấp dữ liệu cho cơ quan có thẩm quyền khi có yêu cầu hợp pháp, hoặc cho bên thứ ba khi bạn đã đồng ý/việc đó cần thiết để thực hiện dịch vụ. Một số nhà cung cấp hạ tầng có thể xử lý dữ liệu ngoài lãnh thổ Việt Nam; khi đó, TLORA áp dụng các biện pháp cần thiết theo pháp luật về chuyển dữ liệu cá nhân ra nước ngoài.</p>
      </>
    ),
  },
  {
    title: "5. Thời hạn lưu trữ và bảo mật",
    content: (
      <>
        <p>Dữ liệu được lưu trong thời gian cần thiết cho mục đích đã thông báo, thời hạn cung cấp album/dịch vụ, giải quyết tranh chấp và thực hiện nghĩa vụ pháp lý. Khi không còn cần thiết, dữ liệu sẽ được xóa, hủy hoặc ẩn danh theo quy trình phù hợp, trừ trường hợp pháp luật yêu cầu lưu lâu hơn.</p>
        <p>Chúng tôi áp dụng kiểm soát truy cập, phân quyền, xác thực, mã hóa trong quá trình truyền dữ liệu khi phù hợp và sao lưu để giảm rủi ro truy cập, mất mát hoặc tiết lộ trái phép. Không có hệ thống Internet nào bảo đảm an toàn tuyệt đối; bạn cần bảo mật liên kết album, mật khẩu và thiết bị của mình.</p>
      </>
    ),
  },
  {
    title: "6. Quyền của chủ thể dữ liệu",
    content: (
      <>
        <p>Trong phạm vi pháp luật cho phép, bạn có quyền được biết, đồng ý hoặc rút lại sự đồng ý, yêu cầu truy cập, chỉnh sửa, xóa, hạn chế xử lý, phản đối xử lý, yêu cầu cung cấp dữ liệu, khiếu nại, tố cáo và yêu cầu bồi thường thiệt hại liên quan đến dữ liệu cá nhân.</p>
        <p>Gửi yêu cầu đến email liên hệ ở trên, kèm thông tin cần thiết để xác minh danh tính. Chúng tôi sẽ phản hồi theo thời hạn pháp luật hoặc thông báo lý do hợp lý nếu không thể đáp ứng toàn bộ yêu cầu.</p>
      </>
    ),
  },
  {
    title: "7. Dữ liệu của trẻ em và sự cố dữ liệu",
    content: (
      <>
        <p>Đối với khách hàng chưa đủ tuổi thành niên theo quy định pháp luật, TLORA yêu cầu sự đồng ý phù hợp của cha, mẹ hoặc người giám hộ trước khi xử lý dữ liệu, đặc biệt là ảnh và thông tin nhận diện.</p>
        <p>Nếu phát hiện sự cố có nguy cơ ảnh hưởng đến quyền và lợi ích hợp pháp của chủ thể dữ liệu, chúng tôi sẽ thực hiện các bước xử lý, thông báo và phối hợp với cơ quan có thẩm quyền theo quy định hiện hành.</p>
      </>
    ),
  },
  {
    title: "8. Cập nhật chính sách và pháp luật áp dụng",
    content: (
      <p>Chính sách này được xây dựng tham chiếu Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, Luật An ninh mạng 2018, Luật An toàn thông tin mạng 2015 và các quy định pháp luật Việt Nam có liên quan. Khi chính sách thay đổi, phiên bản mới sẽ được công bố tại trang này cùng ngày hiệu lực.</p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <article className="bg-[#14110f] px-4 py-14 text-[#f4ece0] sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-[#f3d88e] transition hover:text-white">← Về trang chủ</Link>
        <p className="mt-10 font-mono text-xs uppercase tracking-[0.16em] text-[#c99a5e]">TLORA Studio</p>
        <h1 className="mt-3 font-heading text-4xl font-extrabold sm:text-5xl">Chính sách bảo mật</h1>
        <p className="mt-5 text-sm leading-7 text-[#cbc0b0]">Ngày hiệu lực: 20/06/2026 · Cập nhật lần cuối: 20/06/2026</p>
        <p className="mt-8 text-lg leading-8 text-[#cbc0b0]">TLORA tôn trọng quyền riêng tư của bạn và cam kết bảo vệ dữ liệu cá nhân khi cung cấp dịch vụ studio, album khách hàng và các tiện ích trực tuyến.</p>
        <div className="mt-12 space-y-10 [&_li]:ml-5 [&_li]:mt-2 [&_li]:list-disc [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:text-[#cbc0b0]">
          {sections.map((section) => <section key={section.title}><h2 className="font-heading text-2xl font-bold text-white">{section.title}</h2><div className="leading-7 text-[#cbc0b0]">{section.content}</div></section>)}
        </div>
      </div>
    </article>
  );
}
