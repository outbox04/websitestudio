import { google } from "googleapis";

type ActivationEmail = { to: string; studioName: string; orderId: string; plan: string; domain: string; username: string; licenseKey?: string };

const esc = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);

function client() {
  const { GMAIL_CLIENT_ID: id, GMAIL_CLIENT_SECRET: secret, GMAIL_REFRESH_TOKEN: refresh_token } = process.env;
  if (!id || !secret || !refresh_token) throw new Error("Chưa cấu hình Gmail API OAuth.");
  const auth = new google.auth.OAuth2(id, secret); auth.setCredentials({ refresh_token });
  return google.gmail({ version: "v1", auth });
}

export async function sendActivationEmail(data: ActivationEmail) {
  const sender = process.env.GMAIL_SENDER;
  if (!sender) throw new Error("Chưa cấu hình GMAIL_SENDER.");
  const site = `https://${data.domain}`;
  const text = `TLORA Studio Platform\n\nChào ${data.studioName}, thanh toán của bạn đã được xác nhận.\n\nMã đơn: ${data.orderId}\nGói: ${data.plan}\nWebsite: ${site}\nTên đăng nhập: ${data.username}\nLicense Key: ${data.licenseKey || "Đang khởi tạo"}\n\nCảm ơn bạn đã chọn TLORA Studio Platform.`;
  const row = (label: string, value: string) => `<tr><td style="padding:13px 16px;border-bottom:1px solid #e5e7eb;color:#64748b;font-size:13px">${label}</td><td style="padding:13px 16px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;font-size:13px;color:#0f172a">${esc(value)}</td></tr>`;
  const html = `<!doctype html><html lang="vi"><body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 14px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden"><tr><td style="padding:28px 32px;background:#0f172a"><p style="margin:0;color:#9ddd48;font-size:12px;font-weight:700;letter-spacing:1.4px">TLORA STUDIO PLATFORM</p><h1 style="margin:12px 0 0;color:#fff;font-size:26px;line-height:34px">Studio của bạn đã sẵn sàng</h1></td></tr><tr><td style="padding:30px 32px"><p style="margin:0 0 20px;font-size:16px;line-height:25px">Chào <strong>${esc(data.studioName)}</strong>, thanh toán của bạn đã được xác nhận.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:9px">${row("Mã đơn", data.orderId)}${row("Gói", data.plan)}${row("Tên đăng nhập", data.username)}${row("License Key", data.licenseKey || "Đang khởi tạo")}</table><p style="margin:26px 0;text-align:center"><a href="${esc(site)}" style="display:inline-block;background:#7ec624;color:#0f172a;padding:13px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700">Mở Website Studio</a></p><p style="margin:0;color:#64748b;font-size:13px;line-height:20px">Đây là email giao dịch tự động. Nếu cần hỗ trợ, hãy trả lời trực tiếp email này.</p></td></tr><tr><td style="padding:17px 32px;background:#f8fafc;text-align:center;color:#94a3b8;font-size:12px">© TLORA Studio Platform</td></tr></table></td></tr></table></body></html>`;
  const boundary = "tlora-transactional-email";
  const raw = [`From: TLORA Studio <${sender}>`, `To: ${data.to}`, `Subject: TLORA Studio — Kích hoạt thành công`, "MIME-Version: 1.0", `Content-Type: multipart/alternative; boundary=${boundary}`, "", `--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "", text, "", `--${boundary}`, "Content-Type: text/html; charset=UTF-8", "", html, "", `--${boundary}--`].join("\r\n");
  await client().users.messages.send({ userId: "me", requestBody: { raw: Buffer.from(raw).toString("base64url") } });
}
