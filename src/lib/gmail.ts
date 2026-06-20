import { google } from "googleapis";

type ActivationEmail = {
  to: string;
  studioName: string;
  orderId: string;
  plan: string;
  domain: string;
  username: string;
  licenseKey?: string;
};

function gmailClient() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) throw new Error("Chưa cấu hình Gmail API OAuth trên máy chủ.");
  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth });
}

function encodeEmail(message: string) {
  return Buffer.from(message).toString("base64url");
}

export async function sendActivationEmail(data: ActivationEmail) {
  const sender = process.env.GMAIL_SENDER;
  if (!sender) throw new Error("Chưa cấu hình GMAIL_SENDER.");
  const subject = `TLORA Studio Platform — Studio ${data.studioName} đã sẵn sàng`;
  const text = [
    `Chào ${data.studioName},`,
    "",
    "Thanh toán của bạn đã được xác nhận.",
    `Mã đơn: ${data.orderId}`,
    `Gói: ${data.plan}`,
    `Website: https://${data.domain}`,
    `Tên đăng nhập: ${data.username}`,
    data.licenseKey ? `License Key: ${data.licenseKey}` : "License Key: đang được khởi tạo",
    "",
    "Cảm ơn bạn đã chọn TLORA Studio Platform.",
  ].join("\n");
  await gmailClient().users.messages.send({
    userId: "me",
    requestBody: { raw: encodeEmail([`From: TLORA Studio <${sender}>`, `To: ${data.to}`, `Subject: ${subject}`, "Content-Type: text/plain; charset=UTF-8", "", text].join("\r\n")) },
  });
}
