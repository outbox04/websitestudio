"use client";
import { useEffect, useRef, useState } from "react";
import {
  Check, Eye, EyeOff, ArrowRight, Sparkles,
  Camera, Cloud, Globe, FileText, Key, ChevronDown, Users,
} from "lucide-react";

/* ─────────────────────────────────────────────
   TLORA BRAND COLORS (from logo)
   Primary gold:  #c99a5e  (warm gold)
   Light gold:    #f3d88e  (bright gold hover)
   Dark bg:       #07080a / #14110f
   Surface:       #1c1813
   Text:          #f4ece0
   Sub text:      #cbc0b0
   Muted:         #8c8174
───────────────────────────────────────────── */

const plans = [
  { id: "basic",   name: "BASIC",   price: 2000, text: "Dành cho Studio mới",
    features: ["RAW Selector", "Website Portfolio", "Chọn ảnh online", "Google Drive cá nhân", "Subdomain miễn phí"] },
  { id: "medium",  name: "MEDIUM",  price: 3000, text: "Phổ biến nhất", hot: true,
    features: ["Tất cả tính năng Basic", "Tặng 2TB Cloud Storage", "Domain riêng", "Tuỳ chỉnh logo & màu sắc", "Hỗ trợ cài đặt"] },
  { id: "premium", name: "PREMIUM", price: 4000, text: "Giải pháp toàn diện",
    features: ["Tất cả tính năng Medium", "Thiết kế theo thương hiệu", "Landing Page riêng", "Thiệp cưới online", "Hỗ trợ mua tên miền", "Triển khai 1:1"] },
] as const;
type Plan = typeof plans[number]["id"];

const features = [
  { icon: Camera,   label: "RAW Selector",    desc: "Tự động phân loại RAW và JPG, cho phép khách chọn ảnh trực tiếp trên portal." },
  { icon: Cloud,    label: "Drive Sync",      desc: "Đồng bộ tự động với Google Drive theo cấu trúc job. Không bao giờ nhầm folder." },
  { icon: Users,    label: "Client Portal",   desc: "Khách hàng có trang riêng để xem, chọn ảnh và theo dõi tiến độ. Chuyên nghiệp." },
  { icon: Globe,    label: "Website Builder", desc: "Tạo website studio đẹp bằng kéo thả. Không cần code, tối ưu SEO và mobile." },
  { icon: FileText, label: "CMS Tích Hợp",   desc: "Viết blog, đăng portfolio, quản lý nội dung với dual-mode editor." },
  { icon: Key,      label: "License Cloud",   desc: "Gán license sử dụng ảnh khi bàn giao. Bảo vệ tác quyền rõ ràng cho khách." },
];

const workflow = [
  { n: "01", title: "Import ảnh từ thẻ nhớ",      sub: "Kết nối thẻ SD hoặc folder, TLORA tự nhận diện và import toàn bộ ảnh vào job tương ứng." },
  { n: "02", title: "Tách RAW / JPG tự động",     sub: "Hệ thống phân loại thông minh: RAW cho retouch, JPG preview cho khách chọn ngay lập tức." },
  { n: "03", title: "Upload & Sync Drive",         sub: "Ảnh được đồng bộ lên Drive theo cấu trúc chuẩn của studio — không cần thao tác thủ công." },
  { n: "04", title: "Khách chọn ảnh trên Portal", sub: "Khách nhận link portal riêng, xem ảnh đẹp, chọn và đánh dấu yêu thích trực tiếp trên web." },
  { n: "05", title: "Retouch & Xử lý ảnh",        sub: "Nhận danh sách ảnh khách đã chọn, export để retouch trong Lightroom / Photoshop." },
  { n: "06", title: "Bàn giao & License",          sub: "Upload ảnh đã retouch, gán license tự động và thông báo cho khách. Quy trình khép kín.", accent: true },
];

const faqs = [
  { q: "TLORA Studio OS có thể dùng thử miễn phí không?",               a: "Gói Starter hoàn toàn miễn phí vĩnh viễn cho 5 jobs/tháng. Gói Studio và Pro có 14 ngày dùng thử không cần thẻ tín dụng." },
  { q: "Drive Sync hoạt động với Google Drive và OneDrive không?",       a: "Hiện tại TLORA hỗ trợ Google Drive đầy đủ. OneDrive và Dropbox đang được phát triển và sẽ ra mắt trong Q3 2025." },
  { q: "Khách hàng có cần tạo tài khoản để dùng Client Portal không?",  a: "Không. Khách hàng chỉ cần nhận link duy nhất từ bạn gửi. Không cần đăng ký, không cần app, xem trực tiếp trên trình duyệt bất kỳ thiết bị nào." },
  { q: "Website Builder hỗ trợ custom domain không?",                    a: "Có, từ gói MEDIUM trở lên bạn có thể kết nối custom domain. Gói BASIC sẽ dùng subdomain dạng yourstudio.tlgroup.site." },
  { q: "Dữ liệu ảnh của tôi có an toàn không?",                         a: "TLORA không lưu trữ file ảnh gốc — chỉ đồng bộ metadata và thumbnail. Ảnh gốc luôn nằm trên Drive của bạn, bạn có toàn quyền kiểm soát." },
  { q: "Tôi có thể hủy bất kỳ lúc nào không?",                          a: "Hoàn toàn có thể. Không có hợp đồng ràng buộc. Hủy bất kỳ lúc nào, dữ liệu được giữ 30 ngày để bạn export ra nếu cần." },
];

const logos = ["Studio Ánh Sáng", "Moment Studio HN", "Golden Frame SG", "Pixel Stories", "Aurora Wedding", "Lens & Light", "Frame Perfect", "Mây Studio"];

const money = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   NOTE: SiteHeader & SiteFooter are injected by
   the (public) layout — do NOT add nav/footer here.
───────────────────────────────────────────── */
export function RegistrationWizard() {
  const [plan,    setPlan]    = useState<Plan | null>(null);
  const [step,    setStep]    = useState(1);
  const [show,    setShow]    = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [taken,   setTaken]   = useState({ email: false, username: false, phone: false });
  const [form,    setForm]    = useState({ studio: "", representative: "", email: "", phone: "", username: "", password: "", confirm: "", domain: "" });
  const [domFocused, setDomFocused] = useState(false);
  const [clickedSubmit, setClickedSubmit] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const formRef  = useRef<HTMLDivElement>(null);
  const selected = plans.find(x => x.id === plan);

  /* Domain logic */
  const slug = form.studio
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "ten-studio";
  const domain = plan === "basic" ? `${form.domain || slug}.tlgroup.site` : form.domain;

  /* Availability check (logic unchanged) */
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!form.email && !form.username && !form.phone) return;
      const r = await fetch(`/api/registration/availability?email=${encodeURIComponent(form.email)}&username=${encodeURIComponent(form.username)}&phone=${encodeURIComponent(form.phone)}`);
      if (r.ok) { const d = await r.json(); setTaken({ email: d.emailTaken, username: d.usernameTaken, phone: d.phoneTaken }); }
    }, 400);
    return () => clearTimeout(t);
  }, [form.email, form.username, form.phone]);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (key === "studio") {
      const newSlug = val
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const oldSlug = form.studio
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      
      setForm(prev => ({
        ...prev,
        studio: val,
        domain: (prev.domain === "" || prev.domain === oldSlug) ? newSlug : prev.domain
      }));
    } else {
      setForm(prev => ({ ...prev, [key]: val }));
    }
  };

  async function handleConfirmStep1() {
    setClickedSubmit(true);
    setCheckingAvailability(true);

    try {
      const r = await fetch(`/api/registration/availability?email=${encodeURIComponent(form.email)}&username=${encodeURIComponent(form.username)}&phone=${encodeURIComponent(form.phone)}`);
      if (r.ok) {
        const d = await r.json();
        setTaken({ email: d.emailTaken, username: d.usernameTaken, phone: d.phoneTaken });
        
        const isLengthValid = form.password.length >= 6;
        const isCaseValid = /[A-Z]/.test(form.password) && /[a-z]/.test(form.password);
        const isSpecialValid = /[!@#$%^&*(),.?":{}|<>]/.test(form.password);
        const isPasswordMatch = form.password === form.confirm;

        if (d.emailTaken || d.usernameTaken || d.phoneTaken || !isLengthValid || !isCaseValid || !isSpecialValid || !isPasswordMatch) {
          setCheckingAvailability(false);
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }
    setCheckingAvailability(false);
    setStep(2);
  }

  /* Checkout (logic unchanged) */
  async function checkout() {
    if (!selected) return;
    sessionStorage.setItem("tlora-registration-receipt", JSON.stringify({
      studio: form.studio, plan: selected.name, total: selected.price,
      domain, username: form.username, email: form.email, phone: form.phone,
    }));
    const r = await fetch("/api/payments/sepay/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, studioName: form.studio, representativeName: form.representative, email: form.email, phone: form.phone, username: form.username, domain }),
    });
    const p = await r.json();
    if (!r.ok) return alert(p.error);
    const f = document.createElement("form"); f.method = "POST"; f.action = p.checkoutUrl;
    Object.entries(p.fields).forEach(([k, v]) => {
      const i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = String(v); f.appendChild(i);
    });
    document.body.appendChild(f); f.submit();
  }

  function selectPlan(id: Plan) {
    setPlan(id); setStep(1);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  return (
    <div className="bg-[#14110f] text-[#f4ece0]" style={{ fontFamily: "'Outfit', -apple-system, sans-serif", overflowX: "hidden" }}>

      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes tlFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-30px)}}
        @keyframes tlFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tlMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes tlPulse{0%,100%{opacity:1}50%{opacity:.45}}
        @keyframes tlSlide{from{width:0}to{width:68%}}
        @keyframes tlShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes tlRayRotate{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes tlRayPulse{0%,100%{opacity:0.18}50%{opacity:0.38}}
        @keyframes tlSpotPulse{0%,100%{transform:scale(1);opacity:0.55}50%{transform:scale(1.08);opacity:0.75}}
        @keyframes tlFaqIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

        /* ── Light ray effect ── */
        .tl-rays-wrap{
          position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;
        }
        .tl-ray{
          position:absolute;top:50%;left:30%;
          width:100vmax;height:2px;
          transform-origin:0 50%;
          animation:tlRayPulse 4s ease-in-out infinite;
        }
        .tl-ray:nth-child(1){transform:rotate(5deg);background:linear-gradient(90deg,rgba(201,154,94,0.18),transparent);animation-delay:0s;}
        .tl-ray:nth-child(2){transform:rotate(18deg);background:linear-gradient(90deg,rgba(243,216,142,0.12),transparent);animation-delay:.8s;}
        .tl-ray:nth-child(3){transform:rotate(-8deg);background:linear-gradient(90deg,rgba(201,154,94,0.14),transparent);animation-delay:1.4s;}
        .tl-ray:nth-child(4){transform:rotate(30deg);background:linear-gradient(90deg,rgba(243,216,142,0.08),transparent);animation-delay:2s;}
        .tl-ray:nth-child(5){transform:rotate(-20deg);background:linear-gradient(90deg,rgba(201,154,94,0.1),transparent);animation-delay:2.8s;}
        .tl-spotlight{
          position:absolute;left:28%;top:40%;width:260px;height:260px;
          border-radius:50%;background:radial-gradient(circle,rgba(201,154,94,0.22) 0%,rgba(201,154,94,0.05) 45%,transparent 70%);
          filter:blur(20px);
          animation:tlSpotPulse 5s ease-in-out infinite;
        }

        .tl-reveal{opacity:0;transform:translateY(24px);transition:opacity .65s cubic-bezier(0.22,1,0.36,1),transform .65s cubic-bezier(0.22,1,0.36,1);}
        .tl-reveal.vis{opacity:1;transform:translateY(0);}

        .tl-input{
          width:100%;padding:.75rem 1rem;border-radius:.75rem;
          background:rgba(255,255,255,0.04);border:1px solid rgba(244,236,224,0.12);
          color:#f4ece0;font-family:inherit;font-size:.875rem;outline:none;
          transition:border-color .3s,box-shadow .3s;
        }
        .tl-input::placeholder{color:rgba(244,236,224,0.28);}
        .tl-input:focus{border-color:rgba(201,154,94,0.7);box-shadow:0 0 0 3px rgba(201,154,94,0.12);}
        .tl-input.err{border-color:rgba(239,68,68,.6);animation:tlShake .35s ease;}

        .tl-feat-card{
          border-radius:1.25rem;padding:1.5rem;
          background:#1c1813;border:1px solid rgba(244,236,224,0.08);
          transition:all .4s cubic-bezier(0.22,1,0.36,1);
        }
        .tl-feat-card:hover{transform:translateY(-4px);border-color:rgba(201,154,94,0.3);box-shadow:0 8px 40px rgba(201,154,94,0.08);}

        /* plan cards — equal height columns */
        .tl-plan-grid{display:grid;grid-template-columns:1fr;gap:1.5rem;align-items:stretch;}
        @media (min-width: 768px) {
          .tl-plan-grid{grid-template-columns:repeat(3,1fr);gap:1rem;}
        }
        .tl-plan-wrap{display:flex;flex-direction:column;}
        .tl-plan-card{
          position:relative;border-radius:1.25rem;padding:1.75rem;cursor:pointer;
          border:1px solid rgba(244,236,224,0.1);background:rgba(255,255,255,0.02);
          transition:all .4s cubic-bezier(0.22,1,0.36,1);display:flex;flex-direction:column;flex:1;
        }
        .tl-plan-card:hover{transform:translateY(-4px);border-color:rgba(201,154,94,0.3);box-shadow:0 8px 40px rgba(201,154,94,0.1);}
        .tl-plan-card.selected{border-color:rgba(201,154,94,0.55);background:rgba(201,154,94,0.05);box-shadow:0 0 40px rgba(201,154,94,0.12);}

        .tl-btn-primary{
          display:inline-flex;align-items:center;justify-content:center;gap:.625rem;
          padding:.875rem 1.75rem;border-radius:999px;border:none;font-family:inherit;
          font-size:.9375rem;font-weight:700;cursor:pointer;
          background:#f4ece0;color:#14110f;
          box-shadow:0 4px 20px rgba(0,0,0,.35);
          transition:all .35s cubic-bezier(0.34,1.56,0.64,1);
        }
        .tl-btn-primary:hover{background:#c99a5e;color:#fff;transform:translateY(-2px);box-shadow:0 8px 30px rgba(201,154,94,0.4);}
        .tl-btn-primary:disabled{opacity:.35;cursor:not-allowed;transform:none;box-shadow:none;}

        .tl-btn-ghost{
          display:inline-flex;align-items:center;justify-content:center;gap:.5rem;
          padding:.75rem 1.5rem;border-radius:999px;font-family:inherit;font-size:.875rem;
          font-weight:600;cursor:pointer;
          border:1px solid rgba(244,236,224,0.22);
          background:transparent;color:rgba(244,236,224,0.7);
          transition:all .3s;
        }
        .tl-btn-ghost:hover{background:rgba(244,236,224,0.06);border-color:rgba(244,236,224,0.35);color:#f4ece0;}

        /* FAQ redesign */
        .tl-faq-a{max-height:0;overflow:hidden;transition:max-height .5s cubic-bezier(0.22,1,0.36,1);}
        .tl-faq-open .tl-faq-a{max-height:200px;}
        .tl-faq-item{
          border-bottom:1px solid rgba(244,236,224,0.08);
          transition:background .3s;
        }
        .tl-faq-item:last-child{border-bottom:none;}
        .tl-faq-item.tl-faq-open{background:rgba(201,154,94,0.03);}

        .tl-timeline-step{display:flex;gap:1.25rem;align-items:flex-start;position:relative;z-index:1;padding-bottom:1.75rem;opacity:0;transform:translateX(-16px);transition:all .5s cubic-bezier(0.22,1,0.36,1);}
        .tl-timeline-step.vis{opacity:1;transform:translateX(0);}
      `}</style>

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section className="flex min-h-[calc(100vh-73px)] items-center py-16 md:py-24 relative overflow-hidden px-4 sm:px-6 lg:px-8">
        {/* Light ray effect */}
        <div className="tl-rays-wrap">
          <div className="tl-spotlight" />
          <div className="tl-ray" />
          <div className="tl-ray" />
          <div className="tl-ray" />
          <div className="tl-ray" />
          <div className="tl-ray" />
          {/* soft bg glow */}
          <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,154,94,0.08) 0%, transparent 65%)", top: "50%", left: "50%", transform: "translate(-60%,-50%)", filter: "blur(80px)" }} />
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(243,216,142,0.05) 0%, transparent 65%)", top: "20%", right: "10%", filter: "blur(60px)", animation: "tlFloat 9s ease-in-out infinite" }} />
        </div>

        <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          {/* Left */}
          <div>
            <h1 style={{ fontSize: "clamp(2.5rem,6vw,4.75rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-.04em", animation: "tlFadeUp .8s ease .1s both" }}>
              Hệ điều hành<br />dành cho<br />
              <span style={{ color: "#c99a5e", fontStyle: "italic" }}>Studio ảnh</span>
            </h1>
            <p style={{ marginTop: "1.25rem", color: "#cbc0b0", fontSize: "1.0625rem", lineHeight: 1.75, maxWidth: "46ch", animation: "tlFadeUp .8s ease .3s both" }}>
              Từ thẻ nhớ đến bàn giao khách hàng, mọi quy trình Studio được quản lý trên một nền tảng duy nhất.
            </p>
            <div style={{ marginTop: "2rem", display: "flex", gap: ".875rem", flexWrap: "wrap", animation: "tlFadeUp .8s ease .4s both" }}>
              <a href="#bang-gia" className="tl-btn-primary">
                Đăng ký ngay <ArrowRight size={16} />
              </a>
              <a href="#tinh-nang" className="tl-btn-ghost">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 5L10 7.5L6 10V5Z" fill="currentColor"/></svg>
                Xem tính năng
              </a>
            </div>
            <div style={{ display: "flex", gap: "2rem", marginTop: "2.25rem", animation: "tlFadeUp .8s ease .5s both" }}>
              {[["2,400+", "Studio đang dùng"], ["98%", "Hài lòng"], ["4.9★", "Đánh giá"]].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-.04em", color: "#c99a5e" }}>{n}</div>
                  <div style={{ fontSize: ".75rem", color: "#8c8174", marginTop: ".1rem" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard Mockup */}
          <div style={{ position: "relative", animation: "tlFadeUp 1s ease .45s both" }}>
            <div style={{ position: "absolute", inset: -40, zIndex: -1, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(201,154,94,0.18) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
            <div style={{ background: "#1c1813", border: "1px solid rgba(244,236,224,0.1)", borderRadius: "1.75rem", padding: ".875rem", boxShadow: "0 0 0 1px rgba(201,154,94,0.12), 0 40px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(244,236,224,0.06)" }}>
              <div style={{ background: "#14110f", borderRadius: "calc(1.75rem - .25rem)", overflow: "hidden", padding: "1.25rem" }}>
                {/* Titlebar */}
                <div style={{ display: "flex", alignItems: "center", gap: ".4rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF5F57" }} />
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#FFBD2E" }} />
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#28C840" }} />
                  <span style={{ marginLeft: "auto", fontSize: ".7rem", color: "#8c8174", fontFamily: "'JetBrains Mono', monospace" }}>TLORA Studio OS · Dashboard</span>
                </div>
                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: ".5rem", marginBottom: ".875rem" }}>
                  {[["48", "#c99a5e", "Albums"], ["1.2TB", "#f3d88e", "Drive"], ["126", "#8c8174", "Khách hàng"]].map(([v, c, l]) => (
                    <div key={l} style={{ background: "rgba(244,236,224,0.03)", border: "1px solid rgba(244,236,224,0.08)", borderRadius: ".875rem", padding: ".875rem", textAlign: "center" }}>
                      <div style={{ fontSize: "1.375rem", fontWeight: 800, color: c }}>{v}</div>
                      <div style={{ fontSize: ".6rem", color: "#8c8174", marginTop: ".2rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>{l}</div>
                    </div>
                  ))}
                </div>
                {/* Jobs */}
                <div style={{ fontSize: ".625rem", fontWeight: 600, color: "#8c8174", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: ".5rem" }}>Jobs gần đây</div>
                <div style={{ display: "flex", flexDirection: "column", gap: ".375rem" }}>
                  {[
                    ["📸", "Wedding · Minh & Linh", "24 Jun 2025 · 1,240 ảnh", "Xong",       "#c99a5e"],
                    ["🎬", "Portrait · Hà Anh",     "22 Jun 2025 · 380 ảnh",   "Retouch",    "#8c8174"],
                    ["🏠", "Interior · Horizon",    "20 Jun 2025 · 96 ảnh",    "Drive Sync", "#f3d88e"],
                  ].map(([icon, name, sub, badge, bc]) => (
                    <div key={name as string} style={{ display: "flex", alignItems: "center", gap: ".625rem", background: "rgba(244,236,224,0.02)", border: "1px solid rgba(244,236,224,0.06)", borderRadius: ".75rem", padding: ".5rem .75rem" }}>
                      <span style={{ fontSize: ".875rem", flexShrink: 0 }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: ".75rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#f4ece0" }}>{name}</div>
                        <div style={{ fontSize: ".625rem", color: "#8c8174" }}>{sub}</div>
                      </div>
                      <span style={{ fontSize: ".5625rem", fontWeight: 700, padding: ".2rem .5rem", borderRadius: 999, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".06em", background: `${bc}18`, color: bc as string, border: `1px solid ${bc}35` }}>{badge}</span>
                    </div>
                  ))}
                </div>
                {/* Drive bar */}
                <div style={{ marginTop: ".875rem", background: "rgba(201,154,94,0.08)", border: "1px solid rgba(201,154,94,0.18)", borderRadius: ".875rem", padding: ".75rem .875rem", display: "flex", alignItems: "center", gap: ".625rem" }}>
                  <span style={{ fontSize: "1rem" }}>☁</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: ".625rem", fontWeight: 600, color: "#8c8174" }}>Google Drive Sync · Đang hoạt động</div>
                    <div style={{ marginTop: ".375rem", height: 3, background: "rgba(244,236,224,0.08)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "68%", background: "linear-gradient(90deg,#c99a5e,#f3d88e)", borderRadius: 99, animation: "tlSlide 1.5s cubic-bezier(0.22,1,0.36,1) 1s both" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: ".75rem", fontWeight: 700, color: "#f3d88e" }}>68%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          TRUST MARQUEE
      ════════════════════════════════════════════════ */}
      <div style={{ padding: "2rem 0", borderTop: "1px solid rgba(244,236,224,0.08)", borderBottom: "1px solid rgba(244,236,224,0.08)", background: "#1c1813", overflow: "hidden" }}>
        <div style={{ display: "flex", width: "max-content", animation: "tlMarquee 28s linear infinite" }}>
          {[...logos, ...logos].map((name, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: ".5rem", whiteSpace: "nowrap", flexShrink: 0, padding: "0 2.5rem", fontSize: ".8125rem", fontWeight: 500, color: "#8c8174" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(201,154,94,0.5)", display: "inline-block" }} />
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════ */}
      <section id="tinh-nang" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <RevealDiv style={{ textAlign: "center", marginBottom: "3rem" }}>
            <Eyebrow center>Giải pháp</Eyebrow>
            <h2 style={{ fontSize: "clamp(1.875rem,4.5vw,3rem)", fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.1, margin: ".75rem auto 1rem", color: "#f4ece0", maxWidth: "22ch" }}>Mọi thứ một Studio cần, trong một nền tảng</h2>
            <div style={{ width: 40, height: 2, background: "#c99a5e", borderRadius: 99, margin: "1rem auto" }} />
            <p style={{ color: "#cbc0b0", fontSize: "1rem", lineHeight: 1.75, maxWidth: "52ch", margin: "0 auto" }}>TLORA Studio OS tích hợp toàn bộ quy trình vào một hệ thống thống nhất, thông minh và đẹp.</p>
          </RevealDiv>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {features.map((f, i) => (
              <RevealDiv key={f.label} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="tl-feat-card">
                  <div style={{ width: 44, height: 44, borderRadius: ".75rem", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", border: "1px solid rgba(201,154,94,0.2)", background: "rgba(201,154,94,0.1)" }}>
                    <f.icon size={20} style={{ color: "#c99a5e" }} />
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: ".4rem", color: "#f4ece0" }}>{f.label}</div>
                  <div style={{ fontSize: ".8125rem", color: "#8c8174", lineHeight: 1.65 }}>{f.desc}</div>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          WORKFLOW
      ════════════════════════════════════════════════ */}
      <section id="workflow" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#1c1813]">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <RevealDiv>
            <Eyebrow>Quy trình</Eyebrow>
            <h2 style={{ fontSize: "clamp(1.875rem,4.5vw,3rem)", fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.1, margin: ".75rem 0 1rem", color: "#f4ece0" }}>Từ thẻ nhớ đến<br />bàn giao khách hàng</h2>
            <div style={{ width: 40, height: 2, background: "#c99a5e", borderRadius: 99, margin: "1rem 0" }} />
            <p style={{ color: "#cbc0b0", fontSize: "1rem", lineHeight: 1.75, maxWidth: "44ch" }}>TLORA tự động hóa từng bước, giúp bạn tập trung vào chụp ảnh — không phải vào quản lý thủ công.</p>
          </RevealDiv>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "1.375rem", top: 0, bottom: 0, width: 1, background: "linear-gradient(180deg,rgba(201,154,94,0.6),rgba(201,154,94,0.1),transparent)", zIndex: 0 }} />
            <div id="tl-timeline" style={{ display: "flex", flexDirection: "column" }}>
              {workflow.map((s) => (
                <div key={s.n} className="tl-timeline-step" style={{ paddingBottom: s.n === "06" ? 0 : undefined }}>
                  <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".8125rem", fontWeight: 700, background: "#1c1813", border: `2px solid ${s.accent ? "#c99a5e" : "rgba(201,154,94,0.35)"}`, boxShadow: s.accent ? "0 0 18px rgba(201,154,94,0.4)" : "none", zIndex: 2, position: "relative", color: s.accent ? "#c99a5e" : "#8c8174" }}>{s.n}</div>
                  <div style={{ paddingTop: ".5rem" }}>
                    <div style={{ fontSize: ".9375rem", fontWeight: 700, marginBottom: ".25rem", color: "#f4ece0" }}>{s.title}</div>
                    <div style={{ fontSize: ".8125rem", color: "#8c8174", lineHeight: 1.6 }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════════ */}
      <section id="bang-gia" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <RevealDiv style={{ textAlign: "center", marginBottom: "3rem" }}>
            <Eyebrow center>Bảng giá</Eyebrow>
            <h2 style={{ fontSize: "clamp(1.875rem,4.5vw,3rem)", fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.1, margin: ".75rem auto 1rem", color: "#f4ece0", maxWidth: "22ch" }}>Giá minh bạch, không ẩn phí</h2>
            <div style={{ width: 40, height: 2, background: "#c99a5e", borderRadius: 99, margin: "1rem auto" }} />
            <p style={{ color: "#cbc0b0", fontSize: "1rem", lineHeight: 1.75, maxWidth: "52ch", margin: "0 auto" }}>Chọn gói phù hợp với quy mô Studio của bạn. Nâng cấp hoặc hủy bất kỳ lúc nào.</p>
          </RevealDiv>
          {/* Plan grid */}
          <div className="tl-plan-grid">
            {plans.map((p) => (
              <RevealDiv key={p.id} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div className={`tl-plan-card${(plan ?? "medium") === p.id ? " selected" : ""}`}>
                  {("hot" in p && p.hot) && (
                    <span style={{ position: "absolute", top: "1.25rem", right: "1.25rem", padding: ".25rem .75rem", borderRadius: 999, background: "#c99a5e", fontSize: ".5625rem", fontWeight: 800, color: "#14110f", letterSpacing: ".06em", textTransform: "uppercase", boxShadow: "0 0 15px rgba(201,154,94,0.25)" }}>Phổ biến nhất</span>
                  )}
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f4ece0" }}>{p.name}</div>
                  <div style={{ fontSize: ".8125rem", color: "#8c8174", marginTop: ".25rem" }}>{p.text}</div>
                  <div style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-.04em", margin: "1.25rem 0 .25rem", color: "#c99a5e" }}>{money(p.price)}</div>
                  <div style={{ fontSize: ".75rem", color: "#8c8174", marginBottom: "1rem" }}>Thanh toán một lần · sở hữu trọn bộ</div>
                  <div style={{ height: 1, background: "rgba(244,236,224,0.07)", margin: ".875rem 0" }} />
                  <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: ".625rem", flex: 1 }}>
                    {p.features.map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: ".625rem", fontSize: ".8125rem", color: "#cbc0b0" }}>
                        <span style={{ width: 15, height: 15, borderRadius: "50%", background: "rgba(201,154,94,0.12)", border: "1px solid rgba(201,154,94,0.25)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: ".45rem", color: "#c99a5e" }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => selectPlan(p.id)} className="tl-btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
                    {(plan ?? "medium") === p.id ? "Đang chọn gói này" : "Chọn gói này"}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          REGISTRATION FORM
      ════════════════════════════════════════════════ */}
      <div ref={formRef} className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#14110f]">
        <div className="mx-auto max-w-6xl">
          {/* Step breadcrumb */}
          {plan && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem", marginBottom: "2rem" }}>
              {["Chọn gói", "Thông tin", "Xác nhận"].map((s, i) => {
                const idx = i + 1;
                const active = idx === (step === 1 ? 2 : 3);
                const done   = (step === 1 && idx < 2) || (step === 2 && idx < 3);
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".75rem", fontWeight: 700, background: done ? "rgba(201,154,94,0.15)" : active ? "#c99a5e" : "rgba(244,236,224,0.05)", border: done ? "1px solid rgba(201,154,94,0.4)" : active ? "none" : "1px solid rgba(244,236,224,0.1)", color: done ? "#c99a5e" : active ? "#14110f" : "#8c8174" }}>{done ? "✓" : idx}</div>
                      <span style={{ fontSize: ".8125rem", fontWeight: 500, color: active ? "#f4ece0" : "#8c8174" }}>{s}</span>
                    </div>
                    {i < 2 && <div style={{ width: 28, height: 1, background: done ? "rgba(201,154,94,0.4)" : "rgba(244,236,224,0.08)" }} />}
                  </div>
                );
              })}
            </div>
          )}

          {!plan ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "#1c1813", border: "1px solid rgba(244,236,224,0.08)", borderRadius: "1.25rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>☝️</div>
              <p style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: ".5rem", color: "#f4ece0" }}>Chọn gói của bạn ở trên để bắt đầu đăng ký</p>
              <p style={{ color: "#8c8174", fontSize: ".9rem" }}>Sau khi chọn gói, form đăng ký sẽ xuất hiện tại đây.</p>
              <a href="#bang-gia" className="tl-btn-primary" style={{ display: "inline-flex", marginTop: "1.5rem" }}>Xem bảng giá <ArrowRight size={15} /></a>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 lg:gap-8 items-start">
              {/* Form panel */}
              <div style={{ background: "#1c1813", border: "1px solid rgba(244,236,224,0.08)", borderRadius: "1.25rem", padding: "2rem", boxShadow: "0 40px 80px rgba(0,0,0,.35)" }}>
                {step === 1 ? (
                  <>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: ".375rem", color: "#f4ece0" }}>Thông tin Studio & tài khoản</h2>
                    <p style={{ fontSize: ".8125rem", color: "#8c8174", marginBottom: "1.75rem" }}>Thông tin này sẽ được dùng để khởi tạo không gian Studio riêng của bạn.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TlInput label="Tên Studio"        value={form.studio}         onChange={update("studio")} />
                      <TlInput label="Người đại diện"   value={form.representative} onChange={update("representative")} />
                      <TlInput label="Email"             type="email" value={form.email} onChange={update("email")}  error={clickedSubmit && taken.email ? "Email đã được sử dụng." : undefined} />
                      <TlInput label="Số điện thoại"    value={form.phone}          onChange={update("phone")}  error={clickedSubmit && taken.phone ? "Số điện thoại đã tồn tại." : undefined} />
                      <TlInput label="Tên đăng nhập"    value={form.username}       onChange={update("username")} error={clickedSubmit && taken.username ? "Tên đăng nhập đã tồn tại." : undefined} />
                      
                      <div>
                        <TlInput
                          label="Mật khẩu"
                          type={show ? "text" : "password"}
                          value={form.password}
                          onChange={update("password")}
                          error={clickedSubmit && (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[!@#$%^&*(),.?":{}|<>]/.test(form.password) || form.password.length < 6) ? "Mật khẩu chưa đạt yêu cầu bảo mật." : undefined}
                          suffix={
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShow(!show);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#8c8174",
                                cursor: "pointer",
                                padding: ".25rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {show ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          }
                        />
                        <div style={{ marginTop: ".5rem", display: "flex", flexDirection: "column", gap: ".25rem" }}>
                          {[
                            { label: "Mật khẩu phải từ 6 kí tự trở lên", met: form.password.length >= 6 },
                            { label: "Mật khẩu phải có từ 1 chữ hoa và 1 chữ thường trở lên", met: /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) },
                            { label: "Mật khẩu phải có ký tự đặc biệt", met: /[!@#$%^&*(),.?":{}|<>]/.test(form.password) },
                          ].map((rule, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: ".375rem", fontSize: ".6875rem", color: rule.met ? "#c99a5e" : "#8c8174", transition: "color 0.3s" }}>
                              <span style={{ fontSize: ".875rem", lineHeight: 1 }}>{rule.met ? "✓" : "○"}</span>
                              <span>{rule.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <TlInput
                        label="Xác nhận mật khẩu"
                        type={show ? "text" : "password"}
                        value={form.confirm}
                        onChange={update("confirm")}
                        error={form.confirm && form.confirm !== form.password ? "Mật khẩu chưa khớp." : (clickedSubmit && form.password !== form.confirm ? "Mật khẩu xác nhận chưa khớp." : undefined)}
                      />
                    </div>

                    {/* Domain */}
                    <div style={{ marginTop: "1.5rem", borderTop: "1px solid rgba(244,236,224,0.07)", paddingTop: "1.5rem" }}>
                      <p style={{ fontWeight: 700, marginBottom: ".35rem", color: "#f4ece0", fontSize: ".9375rem" }}>{plan === "basic" ? "Subdomain miễn phí" : "Tên miền riêng"}</p>
                      <p style={{ fontSize: ".8125rem", color: "#8c8174", marginBottom: ".875rem" }}>
                        {plan === "basic" ? "Nhập tên subdomain mong muốn cho không gian Studio của bạn." : "Nhập tên miền riêng của bạn. Chúng tôi hỗ trợ cài đặt."}
                      </p>
                      {plan === "basic" ? (
                        <div style={{
                          display: "flex",
                          alignItems: "stretch",
                          borderRadius: ".75rem",
                          overflow: "hidden",
                          border: domFocused ? "1px solid rgba(201,154,94,0.7)" : "1px solid rgba(244,236,224,0.12)",
                          boxShadow: domFocused ? "0 0 0 3px rgba(201,154,94,0.12)" : "none",
                          background: "rgba(255,255,255,0.04)",
                          transition: "border-color .3s, box-shadow .3s"
                        }}>
                          <input
                            style={{
                              flex: 1,
                              padding: ".75rem 1rem",
                              border: "none",
                              borderRadius: "0",
                              background: "transparent",
                              color: "#f4ece0",
                              fontFamily: "inherit",
                              fontSize: ".875rem",
                              outline: "none"
                            }}
                            placeholder="ten-studio"
                            value={form.domain}
                            onFocus={() => setDomFocused(true)}
                            onBlur={() => setDomFocused(false)}
                            onChange={(e) => {
                              const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                              setForm({ ...form, domain: val });
                            }}
                          />
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "0 0.75rem",
                            background: "rgba(255,255,255,0.02)",
                            borderLeft: "1px solid rgba(244,236,224,0.12)",
                            color: "#c99a5e",
                            fontSize: ".875rem",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 600,
                            userSelect: "none",
                            flexShrink: 0
                          }}>
                            .tlgroup.site
                          </div>
                        </div>
                      ) : (
                        <input className="tl-input" placeholder="mystudio.com" value={form.domain} onChange={update("domain")} />
                      )}
                    </div>

                    <button
                      disabled={checkingAvailability || !form.studio || !form.representative || !form.email || !form.phone || !form.username || !form.password || !form.confirm || !domain}
                      onClick={handleConfirmStep1}
                      className="tl-btn-primary"
                      style={{ width: "100%", marginTop: "1.5rem" }}
                    >
                      {checkingAvailability ? "Đang xác minh..." : "Xác nhận thông tin"}
                      <ArrowRight size={15} />
                    </button>
                    <button onClick={() => setPlan(null)} className="tl-btn-ghost" style={{ width: "100%", marginTop: ".75rem" }}>
                      ← Chọn gói khác
                    </button>
                  </>
                ) : (
                  <>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-.02em", marginBottom: ".375rem", color: "#f4ece0" }}>Xác nhận thông tin</h2>
                    <p style={{ fontSize: ".8125rem", color: "#8c8174", marginBottom: "1.75rem" }}>Kiểm tra lại thông tin trước khi thanh toán.</p>
                    <div style={{ borderRadius: ".875rem", border: "1px solid rgba(244,236,224,0.07)", padding: "1.25rem", background: "rgba(255,255,255,.02)" }}>
                      {[["Studio", form.studio], ["Gói", selected?.name || ""], ["Email", form.email], ["Số điện thoại", form.phone], ["Tên đăng nhập", form.username], ["Tên miền", domain], ["Tổng thanh toán", money(selected?.price || 0)]].map(([label, value]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: ".5rem 0", borderBottom: "1px solid rgba(244,236,224,0.05)" }}>
                          <span style={{ fontSize: ".8125rem", color: "#8c8174" }}>{label}</span>
                          <b style={{ fontSize: ".8125rem", color: label === "Tổng thanh toán" ? "#c99a5e" : "#f4ece0" }}>{value}</b>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: ".75rem", marginTop: "1.25rem", padding: "1rem", borderRadius: ".875rem", background: "rgba(201,154,94,0.06)", border: "1px solid rgba(201,154,94,0.18)" }}>
                      <Sparkles size={15} style={{ color: "#c99a5e", flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: ".8125rem", color: "#cbc0b0", lineHeight: 1.6 }}>Studio sẽ được kích hoạt ngay sau khi thanh toán thành công qua SePay. Thông tin đăng nhập và license sẽ gửi về email của bạn.</p>
                    </div>
                    <button onClick={checkout} className="tl-btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
                      Xác minh thanh toán SePay <ArrowRight size={15} />
                    </button>
                    <button onClick={() => setStep(1)} className="tl-btn-ghost" style={{ width: "100%", marginTop: ".75rem" }}>
                      ← Quay lại chỉnh sửa
                    </button>
                  </>
                )}
              </div>

              {/* Order sidebar */}
              <aside style={{ position: "sticky", top: "6rem", background: "#1c1813", border: "1px solid rgba(244,236,224,0.08)", borderRadius: "1.25rem", overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,.4)" }}>
                <div style={{ padding: "1.125rem 1.5rem", borderBottom: "1px solid rgba(244,236,224,0.07)", background: "rgba(201,154,94,0.06)" }}>
                  <p style={{ fontSize: ".625rem", fontWeight: 600, letterSpacing: ".15em", textTransform: "uppercase", color: "#c99a5e" }}>Tổng thanh toán</p>
                  <h3 style={{ fontWeight: 800, marginTop: ".25rem", fontSize: "1.0625rem", color: "#f4ece0" }}>Đơn hàng của bạn</h3>
                </div>
                <div style={{ padding: "1.125rem 1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".875rem", padding: ".375rem 0" }}>
                    <span style={{ color: "#8c8174" }}>Gói {selected?.name}</span>
                    <b style={{ color: "#f4ece0" }}>{money(selected?.price || 0)}</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".875rem", padding: ".375rem 0" }}>
                    <span style={{ color: "#8c8174" }}>{plan === "basic" ? "Subdomain" : "Tên miền"}</span>
                    <span style={{ color: "#c99a5e", fontWeight: 600 }}>Miễn phí</span>
                  </div>
                  <div style={{ height: 1, background: "rgba(244,236,224,0.07)", margin: ".875rem 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <span style={{ fontWeight: 700, color: "#f4ece0" }}>Tổng tiền</span>
                    <span style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-.04em", color: "#c99a5e" }}>{money(selected?.price || 0)}</span>
                  </div>
                  <div style={{ marginTop: "1.125rem", padding: ".75rem", borderRadius: ".75rem", background: "rgba(201,154,94,0.06)", border: "1px solid rgba(201,154,94,0.18)" }}>
                    <p style={{ fontSize: ".625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "#c99a5e", marginBottom: ".35rem" }}>Tên miền</p>
                    <p style={{ fontSize: ".8rem", fontFamily: "'JetBrains Mono', monospace", color: "#cbc0b0", wordBreak: "break-all" }}>{domain || `${slug}.tlora-studio-os`}</p>
                  </div>
                  <div style={{ marginTop: "1.125rem", display: "flex", flexDirection: "column", gap: ".4375rem" }}>
                    <p style={{ fontSize: ".625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".12em", color: "#8c8174", marginBottom: ".2rem" }}>Bạn sẽ nhận được</p>
                    {plans.find(x => x.id === plan)?.features.map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".75rem", color: "#cbc0b0" }}>
                        <Check size={11} style={{ color: "#c99a5e", flexShrink: 0 }} />{f}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "1.125rem", padding: ".625rem", borderRadius: ".75rem", textAlign: "center", background: "rgba(201,154,94,0.06)", border: "1px solid rgba(201,154,94,0.18)" }}>
                    <p style={{ fontSize: ".75rem", color: "#8c8174" }}>🔒 Thanh toán bảo mật qua SePay</p>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          FAQ — 2 column layout
      ════════════════════════════════════════════════ */}
      <section id="faq" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#1c1813] relative overflow-hidden">
        {/* subtle light accent */}
        <div style={{ position: "absolute", right: 0, top: "50%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,154,94,0.07) 0%, transparent 70%)", filter: "blur(60px)", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-12 lg:gap-20 items-start">
          {/* Left: heading */}
          <RevealDiv className="lg:sticky lg:top-28">
            <Eyebrow>FAQ</Eyebrow>
            <h2 style={{ fontSize: "clamp(1.875rem,3.5vw,2.5rem)", fontWeight: 800, letterSpacing: "-.035em", lineHeight: 1.15, margin: ".75rem 0 1rem", color: "#f4ece0" }}>Câu hỏi<br />thường gặp</h2>
            <div style={{ width: 40, height: 2, background: "#c99a5e", borderRadius: 99, margin: "1rem 0 1.25rem" }} />
            <p style={{ fontSize: ".875rem", color: "#8c8174", lineHeight: 1.75, maxWidth: "28ch" }}>Chưa tìm thấy câu trả lời? Liên hệ chúng tôi qua email hoặc số điện thoại.</p>
            <a href="mailto:hello@tlorastudio.vn" className="tl-btn-ghost" style={{ display: "inline-flex", marginTop: "1.5rem", fontSize: ".8125rem" }}>Gửi email hỗ trợ</a>
          </RevealDiv>
          {/* Right: accordion */}
          <RevealDiv style={{ transitionDelay: ".12s" }}>
            <div style={{ borderRadius: "1.25rem", border: "1px solid rgba(244,236,224,0.08)", overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
              {faqs.map((faq, i) => (
                <div key={i} className={`tl-faq-item${openFaq === i ? " tl-faq-open" : ""}`}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.25rem", padding: "1.25rem 1.5rem", background: "transparent", cursor: "pointer", border: "none", fontFamily: "inherit", color: "#f4ece0", textAlign: "left", fontSize: ".9375rem", fontWeight: 600, transition: "color .3s" }}>
                    <span style={{ flex: 1 }}>{faq.q}</span>
                    <ChevronDown size={18} style={{ flexShrink: 0, transition: "transform .4s cubic-bezier(0.34,1.56,0.64,1)", transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)", color: "#c99a5e" }} />
                  </button>
                  <div className="tl-faq-a">
                    <p style={{ color: "#8c8174", fontSize: ".875rem", lineHeight: 1.75, padding: "0 1.5rem 1.25rem" }}>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-[#14110f] text-center relative overflow-hidden">
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,154,94,0.14) 0%, transparent 65%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", filter: "blur(60px)", animation: "tlFloat 6s ease-in-out infinite" }} />
        </div>
        <RevealDiv style={{ position: "relative", zIndex: 1 }}>
          <Eyebrow center>Bắt đầu ngay hôm nay</Eyebrow>
          <h2 style={{ fontSize: "clamp(1.875rem,5vw,3.5rem)", fontWeight: 900, letterSpacing: "-.04em", lineHeight: 1.1, margin: ".75rem auto 1.25rem", color: "#f4ece0", maxWidth: "18ch" }}>
            Sẵn sàng vận hành Studio theo cách chuyên nghiệp hơn?
          </h2>
          <p style={{ color: "#cbc0b0", fontSize: "1rem", marginBottom: "2rem", maxWidth: "42ch", margin: "0 auto 2rem" }}>Tham gia cùng 2,400+ studio ảnh đang dùng TLORA để tiết kiệm thời gian và tăng chất lượng dịch vụ.</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#bang-gia" className="tl-btn-primary" style={{ fontSize: "1rem", padding: "1rem 2rem" }}>Đăng ký ngay <ArrowRight size={16} /></a>
            <a href="#tinh-nang" className="tl-btn-ghost" style={{ fontSize: "1rem", padding: "1rem 2rem" }}>Xem tính năng</a>
          </div>
          <p style={{ marginTop: "1.25rem", fontSize: ".8125rem", color: "#8c8174" }}>Không cần thẻ tín dụng · Kích hoạt trong 30 giây · Hủy bất kỳ lúc nào</p>
        </RevealDiv>
      </section>

      <ScrollReveal />
      <TimelineReveal />
    </div>
  );
}

/* ─── Sub-components ─── */

function Eyebrow({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", padding: ".3rem .75rem", borderRadius: 999, border: "1px solid rgba(244,236,224,0.1)", background: "rgba(244,236,224,0.04)", fontSize: ".6875rem", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#8c8174", ...(center ? { margin: "0 auto", justifyContent: "center" } : {}) }}>
      {!center && <span style={{ width: 14, height: 1, background: "#8c8174", display: "inline-block" }} />}
      {children}
    </div>
  );
}

function RevealDiv({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("vis"); obs.unobserve(el); } }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`tl-reveal ${className || ""}`.trim()} style={style}>{children}</div>;
}

function TlInput({ label, error, suffix, ...props }: { label: string; error?: string; suffix?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", fontSize: ".8125rem", fontWeight: 600, color: "#cbc0b0" }}>
      <span>{label}</span>
      <div style={{ position: "relative", marginTop: ".45rem" }}>
        <input {...props} className={`tl-input${error ? " err" : ""}`} style={{ display: "block", width: "100%" }} />
        {suffix && (
          <div style={{ position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", zIndex: 10 }}>
            {suffix}
          </div>
        )}
      </div>
      {error && <span style={{ display: "block", marginTop: ".25rem", fontSize: ".6875rem", color: "#FCA5A5" }}>{error}</span>}
    </div>
  );
}

function ScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); obs.unobserve(e.target); } }), { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    document.querySelectorAll(".tl-reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return null;
}

function TimelineReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target as HTMLElement;
        setTimeout(() => el.classList.add("vis"), Number(el.dataset.idx || 0) * 100);
      }
    }), { threshold: 0.1 });
    document.querySelectorAll(".tl-timeline-step").forEach((el, i) => { (el as HTMLElement).dataset.idx = String(i); obs.observe(el); });
    return () => obs.disconnect();
  }, []);
  return null;
}
