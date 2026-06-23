import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", background: "#14110f", color: "#f4ece0" }}>
      <div style={{ display: "flex", color: "#c99a5e", fontSize: 28, fontWeight: 700, letterSpacing: 5 }}>TLORA STUDIO</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 76, lineHeight: 1.08, fontWeight: 700 }}>Mỗi set chụp là</div>
        <div style={{ marginTop: 8, fontSize: 76, lineHeight: 1.08, fontWeight: 700, color: "#c99a5e" }}>một concept riêng.</div>
      </div>
      <div style={{ display: "flex", fontSize: 27, color: "#cbc0b0" }}>Chụp ảnh concept · Chọn ảnh online · Album riêng</div>
    </div>,
    size,
  );
}
