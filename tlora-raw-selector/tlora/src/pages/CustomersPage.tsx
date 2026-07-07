import { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Search,
  Users,
  Copy,
  Info
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CustomerBooking {
  shootDate: string;
  shootTime: string;
  customerName: string;
  phoneNumber: string;
  totalPrice: string;
  depositStatus: string;
  cost: string;
  description: string;
  notes: string;
}

const MOCK_BOOKINGS: CustomerBooking[] = [
  { shootDate: "22/06/2026", shootTime: "14:30", customerName: "Nguyễn Văn A", phoneNumber: "0912345678", totalPrice: "2.500.000đ", depositStatus: "Đã cọc 1tr", cost: "2.5tr", description: "Chụp chân dung doanh nhân", notes: "Studio gói 2 tiếng" },
  { shootDate: "24/06/2026", shootTime: "09:00", customerName: "Lê Thị B", phoneNumber: "0988111222", totalPrice: "5.000.000đ", depositStatus: "Chưa cọc", cost: "5tr", description: "Chụp ảnh cưới dã ngoại", notes: "Trang phục áo dài & váy cưới" },
  { shootDate: "28/06/2026", shootTime: "15:00", customerName: "Trần Văn C", phoneNumber: "0977333444", totalPrice: "12.000.000đ", depositStatus: "Đã cọc 2tr", cost: "12tr", description: "Chụp phóng sự cưới gói Gold", notes: "Cần lấy file RAW gấp" }
];

export function CustomersPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">("dashboard");
  const [customerScriptUrl, setCustomerScriptUrl] = useState(localStorage.getItem("tlora_customer_script_url") || "");
  const [customerTelegramBotToken, setCustomerTelegramBotToken] = useState(localStorage.getItem("tlora_customer_telegram_token") || "");

  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUsingMock, setIsUsingMock] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDeposit, setFilterDeposit] = useState<"Tất cả" | "Đã cọc" | "Chưa cọc">("Tất cả");

  // New Booking Form State
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formTotalPrice, setFormTotalPrice] = useState("");
  const [formDeposit, setFormDeposit] = useState("Chưa cọc");
  const [formCost, setFormCost] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Copy code status
  const [copiedText, setCopiedText] = useState(false);

  const getTodayFormatted = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  useEffect(() => {
    setFormDate(getTodayFormatted());
  }, []);

  const loadData = async (urlToFetch = customerScriptUrl, silent = false) => {
    if (!urlToFetch) {
      setBookings(MOCK_BOOKINGS);
      setIsUsingMock(true);
      return;
    }

    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await fetch(`${urlToFetch}?action=get_schedule`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.schedule)) {
        setBookings(data.schedule);
        setIsUsingMock(false);
      } else {
        throw new Error("Dữ liệu trả về không đúng định dạng. Cần cập nhật Apps Script.");
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        setError("Không thể kết nối đến Google Sheets. Đang hiển thị dữ liệu mẫu.");
        setBookings(MOCK_BOOKINGS);
        setIsUsingMock(true);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    if (!customerScriptUrl) return;

    const interval = setInterval(() => {
      void loadData(customerScriptUrl, true);
    }, 5000);

    return () => clearInterval(interval);
  }, [customerScriptUrl]);

  const handleSaveConfig = () => {
    localStorage.setItem("tlora_customer_script_url", customerScriptUrl.trim());
    localStorage.setItem("tlora_customer_telegram_token", customerTelegramBotToken.trim());
    setSuccessMsg("Đã lưu cấu hình Khách hàng thành công!");
    setTimeout(() => setSuccessMsg(""), 3000);
    void loadData(customerScriptUrl.trim());
  };

  const handleSetupWebhook = () => {
    if (!customerTelegramBotToken || !customerScriptUrl) {
      setError("Vui lòng nhập đầy đủ Token Bot Telegram và Google Apps Script URL trước.");
      return;
    }
    const webhookUrl = customerScriptUrl.includes("?") 
      ? `${customerScriptUrl}&bot=customer`
      : `${customerScriptUrl}?bot=customer`;
    const url = `https://api.telegram.org/bot${customerTelegramBotToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    window.open(url, "_blank");
  };

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("Vui lòng nhập tên khách hàng.");
      return;
    }
    if (!formDate.trim()) {
      setError("Vui lòng nhập ngày chụp.");
      return;
    }

    setError("");

    if (isUsingMock) {
      const newBk: CustomerBooking = {
        shootDate: formDate,
        shootTime: formTime.trim(),
        customerName: formName.trim(),
        phoneNumber: formPhone.trim(),
        totalPrice: formTotalPrice.trim() || "-",
        depositStatus: formDeposit,
        cost: formCost.trim(),
        description: formDesc.trim() || "Chụp ảnh",
        notes: formNotes.trim()
      };
      setBookings((prev) => [newBk, ...prev]);
      setFormName(""); setFormTime(""); setFormPhone("");
      setFormTotalPrice(""); setFormCost("");
      setFormDesc(""); setFormNotes("");
      setSuccessMsg("Đã thêm lịch chụp mẫu thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
      return;
    }

    setSubmitting(true);
    try {
      await fetch(customerScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "add_booking",
          shootDate: formDate,
          shootTime: formTime.trim(),
          customerName: formName.trim(),
          phoneNumber: formPhone.trim(),
          totalPrice: formTotalPrice.trim() || "-",
          depositStatus: formDeposit,
          cost: formCost.trim(),
          description: formDesc.trim() || "Chụp ảnh",
          notes: formNotes.trim()
        })
      });

      setFormName(""); setFormTime(""); setFormPhone("");
      setFormTotalPrice(""); setFormCost("");
      setFormDesc(""); setFormNotes("");
      setSuccessMsg("Lịch chụp mới đã được gửi thành công! Đang đồng bộ...");
      setTimeout(() => setSuccessMsg(""), 4000);

      setTimeout(() => {
        void loadData();
      }, 2500);
    } catch (err) {
      setError("Không thể gửi thông tin lên Google Sheet. " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.totalPrice || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.notes.toLowerCase().includes(searchTerm.toLowerCase());

      const isUnpaid =
        b.depositStatus.toLowerCase().includes("chưa cọc") ||
        b.depositStatus.toLowerCase().includes("chưa thanh toán") ||
        b.depositStatus === "chưa" ||
        !b.depositStatus;

      const matchFilter =
        filterDeposit === "Tất cả" ||
        (filterDeposit === "Đã cọc" && !isUnpaid) ||
        (filterDeposit === "Chưa cọc" && isUnpaid);

      return matchSearch && matchFilter;
    });
  }, [bookings, searchTerm, filterDeposit]);

  const metrics = useMemo(() => {
    let total = bookings.length;
    let deposited = 0;
    let unpaid = 0;
    bookings.forEach((b) => {
      const isUnpaid =
        b.depositStatus.toLowerCase().includes("chưa cọc") ||
        b.depositStatus.toLowerCase().includes("chưa thanh toán") ||
        b.depositStatus === "chưa" ||
        !b.depositStatus;
      if (isUnpaid) unpaid++;
      else deposited++;
    });
    return { total, deposited, unpaid };
  }, [bookings]);

  // Apps Script template specifically for managing customers & bookings
  const accountingTelegramToken = localStorage.getItem("tlora_accounting_telegram_token") || "";
  const appsScriptCodeForCustomer = `const CUSTOMER_BOT_TOKEN = "${customerTelegramBotToken || "ĐIỀN_TOKEN_BOT_KHÁCH_HÀNG"}";
const ACCOUNTING_BOT_TOKEN = "${accountingTelegramToken || "ĐIỀN_TOKEN_BOT_KẾ_TOÁN"}";

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var botType = (e && e.parameter && e.parameter.bot) || "accounting";
    
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    if (contents.message) {
      if (botType === "customer") {
        handleTelegramCustomerMessage(contents.message);
      } else {
        handleTelegramAccountingMessage(contents.message);
      }
      return HtmlService.createHtmlOutput("ok");
    }
    
    if (contents.action === "add_transaction") {
      var txSheet = spreadsheet.getSheetByName("BẢNG THEO DÕI THU/CHI") || spreadsheet.getSheetByName("THU/CHI") || spreadsheet.getSheetByName("Giao dịch");
      if (!txSheet) {
        txSheet = spreadsheet.getActiveSheet();
      }
      var amount = Number(contents.amount) || 0;
      var type = contents.type || "Chi";
      var category = contents.category || "Khác";
      var description = contents.description || "";
      var source = contents.source || "Desktop App";
      
      var txDate = new Date();
      if (contents.date) {
        var parts = contents.date.split("/");
        if (parts.length === 3) {
          txDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 12, 0, 0);
        } else {
          var parsed = Date.parse(contents.date);
          if (!isNaN(parsed)) {
            txDate = new Date(parsed);
          }
        }
      }
      
      txSheet.appendRow([txDate, type, category, amount, description, source]);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Giao dịch đã được lưu vào Google Sheet!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (contents.action === "add_booking") {
      var customerSheet = getOrCreateCustomerSheet(spreadsheet);
      
      var shootDateVal = contents.shootDate || "";
      var shootTime    = contents.shootTime || "";
      var customerName = contents.customerName || "";
      var phoneNumber  = contents.phoneNumber || "";
      var totalPrice   = contents.totalPrice || "";
      var depositStatus = contents.depositStatus || "";
      var costVal      = contents.cost || "";
      var descriptionVal = contents.description || "";
      var notesVal = contents.notes || "";
      
      var finalDate = shootDateVal;
      var dateParts = shootDateVal.split("/");
      if (dateParts.length === 3) {
        finalDate = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]), 12, 0, 0);
      }
      
      customerSheet.appendRow([finalDate, shootTime, customerName, phoneNumber, totalPrice, depositStatus, costVal, descriptionVal, notesVal]);
      
      // Auto-log deposit to transaction sheet if any
      var depositAmount = parseAmountFromString(depositStatus);
      if (depositAmount > 0) {
        var txSheet = spreadsheet.getSheetByName("BẢNG THEO DÕI THU/CHI") || spreadsheet.getSheetByName("THU/CHI") || spreadsheet.getSheetByName("Giao dịch");
        if (!txSheet) {
          txSheet = spreadsheet.insertSheet("BẢNG THEO DÕI THU/CHI");
          txSheet.appendRow(["Ngày", "Loại", "Hạng mục", "Số tiền", "Mô tả", "Nguồn"]);
        }
        var txDate = finalDate instanceof Date ? finalDate : new Date();
        txSheet.appendRow([txDate, "Thu", "Đặt cọc", depositAmount, "Khách cọc: " + customerName + " (" + descriptionVal + ")", "Lịch chụp (" + customerName + ")"]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Khách hàng mới đã được lưu!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var action = (e && e.parameter && e.parameter.action) || "get_transactions";
  
  if (action === "get_schedule") {
    var customerSheet = getOrCreateCustomerSheet(spreadsheet);
    
    var data = customerSheet.getDataRange().getValues();
    var schedule = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[2]) continue;
      
      var dateVal = "";
      if (row[0] instanceof Date) {
        dateVal = Utilities.formatDate(row[0], Session.getScriptTimeZone(), "dd/MM/yyyy");
      } else {
        dateVal = String(row[0]);
      }
      
      schedule.push({
        shootDate: dateVal,
        shootTime: String(row[1] || ""),
        customerName: String(row[2] || ""),
        phoneNumber: String(row[3] || ""),
        totalPrice: String(row[4] || ""),
        depositStatus: String(row[5] || ""),
        cost: String(row[6] || ""),
        description: String(row[7] || ""),
        notes: String(row[8] || "")
      });
    }
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      schedule: schedule
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Default: get transactions
  var txSheet = spreadsheet.getSheetByName("BẢNG THEO DÕI THU/CHI") || spreadsheet.getSheetByName("THU/CHI") || spreadsheet.getSheetByName("Giao dịch");
  if (!txSheet) {
    var sheets = spreadsheet.getSheets();
    if (sheets.length === 1 && (sheets[0].getName() === "Trang tính 1" || sheets[0].getName() === "Sheet1")) {
      txSheet = sheets[0];
      txSheet.setName("BẢNG THEO DÕI THU/CHI");
      if (txSheet.getLastRow() === 0) {
        txSheet.appendRow(["Ngày", "Loại", "Hạng mục", "Số tiền", "Mô tả", "Nguồn"]);
      }
    } else {
      txSheet = spreadsheet.insertSheet("BẢNG THEO DÕI THU/CHI");
      txSheet.appendRow(["Ngày", "Loại", "Hạng mục", "Số tiền", "Mô tả", "Nguồn"]);
    }
  }
  
  var data = txSheet.getDataRange().getValues();
  var transactions = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    
    var dateVal = "";
    if (row[0] instanceof Date) {
      dateVal = Utilities.formatDate(row[0], Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    } else {
      dateVal = String(row[0]);
    }
    
    transactions.push({
      date: dateVal,
      type: row[1],
      category: row[2],
      amount: Number(row[3]) || 0,
      description: row[4],
      source: row[5]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    transactions: transactions.reverse()
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleTelegramCustomerMessage(message) {
  var chatId = message.chat.id;
  var text = message.text || "";
  var username = message.from.username || message.from.first_name || "Telegram";
  var cleanText = text.trim();
  
  var lowerText = cleanText.toLowerCase();
  if (lowerText === "ok" || lowerText === "xác nhận" || lowerText === "xac nhan" || lowerText === "có" || lowerText === "co" || lowerText === "yes") {
    var props = PropertiesService.getScriptProperties();
    var pendingKey = "pending_" + chatId;
    var pendingJson = props.getProperty(pendingKey);
    if (pendingJson) {
      props.deleteProperty(pendingKey);
      var pending = JSON.parse(pendingJson);
      saveBookingToSheet(pending, username);
      sendTelegramMessage(chatId, "✅ Đã xác nhận & ghi nhận lịch chụp!\\n\\n" + formatBookingInfo(pending), "customer");
      return;
    }
  }
  
  var parts = cleanText.split("|");
  if (parts.length < 2) {
    sendTelegramMessage(chatId, "⚠️ Sai cú pháp! Nhập theo dạng:\\nNgày giờ | Tên | SĐT | Đã cọc | Chi phí | Mô tả | Ghi chú\\n\\nVí dụ:\\n22/06/2026 14h30 | Nguyễn Văn A | 0912345678 | 1tr5 | 5tr | Chụp cưới | Studio", "customer");
    return;
  }
  
  var dateTimeStr = parts[0].trim();
  var nameStr     = parts[1].trim();
  var phoneStr    = parts.length > 2 ? parts[2].trim() : "";
  var depositStr  = parts.length > 3 ? parts[3].trim() : "Chưa cọc";
  var costStr     = parts.length > 4 ? parts[4].trim() : "";
  var descStr     = parts.length > 5 ? parts[5].trim() : "Chụp ảnh";
  var notesStr    = parts.length > 6 ? parts[6].trim() : "";
  
  var parsed = parseDateTimeString(dateTimeStr);
  var booking = { dateStr: parsed.dateStr, timeStr: parsed.timeStr, name: nameStr, phone: phoneStr, deposit: depositStr, cost: costStr, desc: descStr, notes: notesStr };
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var cSheet = getOrCreateCustomerSheet(spreadsheet);
  var conflicts = checkDateConflict(cSheet, parsed.dateStr);
  
  if (conflicts.length > 0) {
    var props2 = PropertiesService.getScriptProperties();
    props2.setProperty("pending_" + chatId, JSON.stringify(booking));
    var conflictList = conflicts.map(function(c) { return "  • " + c.time + " - " + c.name + (c.phone ? " (" + c.phone + ")" : ""); }).join("\\n");
    sendTelegramMessage(chatId, "🔴 CẢNH BÁO TRÙNG LỊCH!\\n\\n📅 Ngày " + parsed.dateStr + " đã có " + conflicts.length + " lịch chụp:\\n" + conflictList + "\\n\\n📋 Booking mới:\\n" + formatBookingInfo(booking) + "\\n\\n⚡ Gửi OK để xác nhận chốt lịch.", "customer");
    return;
  }
  
  saveBookingToSheet(booking, username);
  sendTelegramMessage(chatId, "✅ Đã ghi nhận lịch chụp & Ghi sổ Kế toán!\\n\\n" + formatBookingInfo(booking), "customer");
}

function saveBookingToSheet(booking, username) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var cSheet = getOrCreateCustomerSheet(spreadsheet);
  var dbDate = booking.dateStr;
  var dp = booking.dateStr.split("/");
  if (dp.length === 3) dbDate = new Date(Number(dp[2]), Number(dp[1]) - 1, Number(dp[0]), 12, 0, 0);
  cSheet.appendRow([dbDate, booking.timeStr, booking.name, booking.phone, booking.cost || "", booking.deposit, booking.cost || "", booking.desc, booking.notes]);
  var depAmt = parseAmountFromString(booking.deposit);
  if (depAmt > 0) {
    var txSheet = spreadsheet.getSheetByName("BẢNG THEO DÕI THU/CHI") || spreadsheet.getSheetByName("THU/CHI") || spreadsheet.getSheetByName("Giao dịch");
    if (!txSheet) { txSheet = spreadsheet.insertSheet("BẢNG THEO DÕI THU/CHI"); txSheet.appendRow(["Ngày","Loại","Hạng mục","Số tiền","Mô tả","Nguồn"]); }
    txSheet.appendRow([dbDate instanceof Date ? dbDate : new Date(), "Thu", "Đặt cọc", depAmt, "Khách cọc: " + booking.name + " (" + booking.desc + ")", "Telegram (" + (username || "Bot") + ")"]);
  }
}

function formatBookingInfo(b) {
  var lines = [];
  lines.push("📅 Ngày: " + b.dateStr + (b.timeStr ? " " + b.timeStr : ""));
  lines.push("👤 Khách: " + b.name);
  if (b.phone) lines.push("📱 SĐT: " + b.phone);
  lines.push("💰 Đã cọc: " + b.deposit);
  if (b.cost) lines.push("💵 Chi phí: " + b.cost);
  lines.push("📝 Nội dung: " + b.desc);
  if (b.notes) lines.push("ℹ️ Ghi chú: " + b.notes);
  return lines.join("\\n");
}

function checkDateConflict(sheet, dateStr) {
  var data = sheet.getDataRange().getValues();
  var conflicts = [];
  var tp = dateStr.split("/");
  var tDay = tp.length >= 2 ? parseInt(tp[0], 10) : -1;
  var tMonth = tp.length >= 2 ? parseInt(tp[1], 10) : -1;
  var tYear = tp.length >= 3 ? parseInt(tp[2], 10) : new Date().getFullYear();
  for (var i = 1; i < data.length; i++) {
    var row = data[i]; var ed = row[0]; var eDay=-1, eMon=-1, eYear=-1;
    if (ed instanceof Date) { eDay=ed.getDate(); eMon=ed.getMonth()+1; eYear=ed.getFullYear(); }
    else { var ep=String(ed).split("/"); if(ep.length>=2){eDay=parseInt(ep[0],10);eMon=parseInt(ep[1],10);eYear=ep.length>=3?parseInt(ep[2],10):new Date().getFullYear();} }
    if (eDay===tDay && eMon===tMonth && eYear===tYear) { conflicts.push({time:String(row[1]||"Chưa rõ giờ"),name:String(row[2]||""),phone:String(row[3]||"")}); }
  }
  return conflicts;
}

function parseDateTimeString(str) {
  var clean = str.trim(); var dateStr = ""; var timeStr = "";
  var tm = clean.match(/(\d{1,2})\s*[hH]\s*(\d{0,2})/);
  var tm2 = clean.match(/(\d{1,2}):(\d{2})/);
  if (tm) { var hh=parseInt(tm[1],10); var mi=tm[2]?parseInt(tm[2],10):0; timeStr=String(hh).padStart(2,"0")+":"+String(mi).padStart(2,"0"); clean=clean.replace(tm[0],"").trim(); }
  else if (tm2) { timeStr=String(parseInt(tm2[1],10)).padStart(2,"0")+":"+tm2[2]; clean=clean.replace(tm2[0],"").trim(); }
  var dl = clean.toLowerCase().trim();
  if (dl==="hôm nay"||dl==="hom nay"||dl==="today"||dl==="") { var t=new Date(); dateStr=String(t.getDate()).padStart(2,"0")+"/"+String(t.getMonth()+1).padStart(2,"0")+"/"+t.getFullYear(); }
  else if (dl==="ngày mai"||dl==="ngay mai"||dl==="mai"||dl==="tomorrow") { var t2=new Date(); t2.setDate(t2.getDate()+1); dateStr=String(t2.getDate()).padStart(2,"0")+"/"+String(t2.getMonth()+1).padStart(2,"0")+"/"+t2.getFullYear(); }
  else { var dp=clean.match(/(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})(?:\s*[\/\-\.]\s*(\d{2,4}))?/); if(dp){var d=String(parseInt(dp[1],10)).padStart(2,"0");var mo=String(parseInt(dp[2],10)).padStart(2,"0");var y=dp[3]?dp[3]:String(new Date().getFullYear());if(y.length===2)y="20"+y;dateStr=d+"/"+mo+"/"+y;}else{dateStr=clean;} }
  return { dateStr: dateStr, timeStr: timeStr };
}

function getOrCreateCustomerSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName("KHÁCH HÀNG") || spreadsheet.getSheetByName("Khách hàng");
  if (!sheet) { sheet = spreadsheet.insertSheet("KHÁCH HÀNG"); sheet.appendRow(["Ngày chụp","Giờ chụp","Tên khách hàng","SĐT","Giá gói","Đã cọc","Chi phí","Mô tả buổi chụp","Ghi chú"]); }
  return sheet;
}

function handleTelegramAccountingMessage(message) {
  var chatId = message.chat.id;
  var text = message.text || "";
  var username = message.from.username || message.from.first_name || "Telegram";
  var cleanText = text.trim();
  var type = "";
  var amountStr = "";
  var description = "";
  
  if (cleanText.startsWith("+") || cleanText.toLowerCase().startsWith("thu ")) {
    type = "Thu";
    cleanText = cleanText.replace(/^\\+/, "").replace(/^thu\\s+/i, "").trim();
  } else if (cleanText.startsWith("-") || cleanText.toLowerCase().startsWith("chi ")) {
    type = "Chi";
    cleanText = cleanText.replace(/^\\-/, "").replace(/^chi\\s+/i, "").trim();
  } else {
    sendTelegramMessage(chatId, "⚠️ Sai cú pháp! Vui lòng nhập:\\n+ [Số tiền] [Mô tả] (Ví dụ: +500k Cọc chụp ảnh)\\n- [Số tiền] [Mô tả] (Ví dụ: -150k Mua cafe)", "accounting");
    return;
  }
  
  var match = cleanText.match(/^([0-9.,]+(?:[kKmM]|(?:tr|tỷ|ty|b)\s*\d*|\d*))(?:\s+(.*))?$/i);
  if (!match) {
    sendTelegramMessage(chatId, "⚠️ Không nhận diện được số tiền! Ví dụ: +500k hoặc -200000", "accounting");
    return;
  }
  
  amountStr = match[1];
  description = match[2] ? match[2].trim() : "Không có mô tả";
  var amount = parseAmount(amountStr);
  if (amount <= 0) {
    sendTelegramMessage(chatId, "⚠️ Số tiền phải lớn hơn 0!", "accounting");
    return;
  }
  
  var category = detectCategory(description, type);
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var txSheet = spreadsheet.getSheetByName("BẢNG THEO DÕI THU/CHI") || spreadsheet.getSheetByName("THU/CHI") || spreadsheet.getSheetByName("Giao dịch");
  if (!txSheet) {
    txSheet = spreadsheet.getActiveSheet();
  }
  txSheet.appendRow([new Date(), type, category, amount, description, "Telegram (" + username + ")"]);
  
  var formattedAmount = formatCurrency(amount);
  sendTelegramMessage(chatId, "✅ Đã ghi sổ kế toán thành công!\\n\\n🔹 Loại: " + type + "\\n🔹 Số tiền: " + formattedAmount + "\\n🔹 Hạng mục: " + category + "\\n🔹 Mô tả: " + description, "accounting");
}

function parseAmount(str) {
  return parseAmountFromString(str);
}

function detectCategory(desc, type) {
  var d = desc.toLowerCase();
  if (type === "Thu") {
    if (d.includes("chụp") || d.includes("ảnh") || d.includes("show") || d.includes("quay")) return "Thuê chụp ảnh";
    if (d.includes("cọc") || d.includes("đặt")) return "Đặt cọc";
    if (d.includes("váy") || d.includes("thuê")) return "Thuê váy/đồ";
    return "Doanh thu khác";
  } else {
    if (d.includes("đèn") || d.includes("máy") || d.includes("lens") || d.includes("thẻ") || d.includes("thiết bị")) return "Mua thiết bị";
    if (d.includes("make") || d.includes("trang điểm") || d.includes("mẫu") || d.includes("model")) return "Cát-xê mẫu/makeup";
    if (d.includes("ads") || d.includes("quảng cáo") || d.includes("fb") || d.includes("marketing")) return "Marketing/Ads";
    if (d.includes("lương") || d.includes("phụ") || d.includes("trợ lý")) return "Lương nhân viên";
    if (d.includes("studio") || d.includes("phòng") || d.includes("thuê studio")) return "Thuê váy/Studio";
    return "Chi tiêu khác";
  }
}

function sendTelegramMessage(chatId, text, botType) {
  var token = (botType === "customer") ? CUSTOMER_BOT_TOKEN : ACCOUNTING_BOT_TOKEN;
  var url = "https://api.telegram.org/bot" + token + "/sendMessage";
  var payload = {
    chat_id: chatId,
    text: text
  };
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };
  UrlFetchApp.fetch(url, options);
}

function formatCurrency(amount) {
  return amount.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",") + " đ";
}

function parseAmountFromString(str) {
  if (!str) return 0;
  var lower = str.toLowerCase().trim();

  // TỶ: 1tỷ5, 1ty5, 1 tỷ 5
  var mTy = lower.match(/(\d+)\s*(?:tỷ|ty)\s*(\d*)/);
  if (mTy) {
    var base = parseInt(mTy[1], 10) * 1000000000;
    if (mTy[2] && mTy[2].length > 0) {
      var f = mTy[2];
      base += f.length === 1 ? parseInt(f, 10) * 100000000 : parseInt(f, 10) * 1000000;
    }
    return base;
  }

  // B (billion): 1B5
  var mB = lower.match(/(\d+)\s*b\s*(\d+)/);
  if (mB) {
    var base2 = parseInt(mB[1], 10) * 1000000000;
    var f2 = mB[2];
    base2 += f2.length === 1 ? parseInt(f2, 10) * 100000000 : parseInt(f2, 10) * 1000000;
    return base2;
  }

  // TRIỆU + suffix digits: 1tr2, 1tr5, 1tr250, 2tr75, 1M5, 1M250
  var mTrF = lower.match(/(\d+)\s*(?:tr|triệu|trieu|m)\s*(\d+)/);
  if (mTrF) {
    var base3 = parseInt(mTrF[1], 10) * 1000000;
    var f3 = mTrF[2];
    base3 += f3.length === 1 ? parseInt(f3, 10) * 100000 : parseInt(f3, 10) * 1000;
    return base3;
  }

  // TRIỆU decimal: 1.5tr, 1,5tr, 2.5M, 1tr, 2triệu
  var mTr = lower.match(/(\d+[.,]\d+|\d+)\s*(?:tr|triệu|trieu|m)(?![a-z0-9])/i);
  if (mTr) {
    return Math.round(parseFloat(mTr[1].replace(",", ".")) * 1000000);
  }

  // K: 500k, 750k
  var mK = lower.match(/(\d+[.,]?\d*)\s*k(?![a-z0-9])/i);
  if (mK) {
    return Math.round(parseFloat(mK[1].replace(",", ".")) * 1000);
  }

  // Fallback: raw number (1000000, 1.000.000)
  var mNum = lower.match(/(\d[\d.,]*)/);
  if (mNum) {
    var numStr = mNum[1].replace(/\./g, "").replace(",", ".");
    var result = parseFloat(numStr);
    if (!isNaN(result) && result > 0) return result;
  }

  return 0;
}

function myFunction() {
  Logger.log("Apps Script hoạt động bình thường! Không cần chạy trực tiếp hàm này. Vui lòng Triển khai (Deploy) dưới dạng Web App để sử dụng.");
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appsScriptCodeForCustomer);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="pb-20">
      <TopBar
        title="Quản lý Khách hàng & Lịch chụp"
        description="Quản lý danh sách khách hàng chụp ảnh, tình trạng đặt cọc, mô tả nội dung buổi chụp và các ghi chú đi kèm đồng bộ trực tiếp với Google Sheets."
        hideStatusPills={true}
      />

      <div className="px-8 space-y-6">
        {/* Tab Selection */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "dashboard" ? "border-brand text-brand" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Danh sách & Lịch chụp
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "settings" ? "border-brand text-brand" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Cài đặt
          </button>
        </div>

        {/* Global Notifications */}
        {error ? (
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {successMsg ? (
          <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        ) : null}

        {/* MOCK BANNER */}
        {activeTab === "dashboard" && isUsingMock && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-sm text-warning flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Đang sử dụng dữ liệu mẫu</p>
              <p className="text-xs mt-0.5 opacity-90">
                Ứng dụng chưa liên kết với Google Sheets. Chuyển sang tab <strong>Cài đặt</strong> để cấu hình Web App URL và thiết lập bot tự động đồng bộ lịch chụp.
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: DASHBOARD (LIST & ADD BOOKING) */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Metrics Rows */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <Card className="p-5 border border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-muted font-medium">Tổng số khách hàng</p>
                  <p className="text-2xl font-bold text-ink mt-1">{metrics.total}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                  <Users className="h-5 w-5" />
                </div>
              </Card>

              <Card className="p-5 border border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-muted font-medium">Lịch chụp đã cọc</p>
                  <p className="text-2xl font-bold text-success mt-1">{metrics.deposited}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-success/15 flex items-center justify-center text-success shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </Card>

              <Card className="p-5 border border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-muted font-medium">Lịch chụp chưa cọc</p>
                  <p className="text-2xl font-bold text-danger mt-1">{metrics.unpaid}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-danger/15 flex items-center justify-center text-danger shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </Card>
            </div>

            {/* Main Content Layout */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Booking List */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-brand" />
                        Lịch chụp & Buổi chụp của Studio
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading} className="h-8">
                        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
                        Làm mới
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Search & Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-ink-faint" />
                        <input
                          type="text"
                          placeholder="Tìm kiếm theo tên khách, nội dung, ghi chú..."
                          className="h-9 w-full rounded-xl border border-border bg-navy-soft pl-10 pr-3.5 text-xs text-ink outline-none placeholder:text-ink-faint focus:border-brand/40 transition"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="flex rounded-xl bg-navy-soft p-1 gap-1 shrink-0">
                        {["Tất cả", "Đã cọc", "Chưa cọc"].map((val) => (
                          <button
                            key={val}
                            onClick={() => setFilterDeposit(val as any)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition ${
                              filterDeposit === val ? "bg-indigo-soft text-ink shadow" : "text-ink-muted hover:text-ink"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table list */}
                    {filteredBookings.length === 0 ? (
                      <div className="rounded-xl border border-border bg-navy-soft/40 p-8 text-center text-sm text-ink-muted">
                        Không tìm thấy lịch chụp nào phù hợp.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs text-ink-muted">
                          <thead>
                            <tr className="border-b border-border text-[10px] uppercase tracking-wider text-ink-faint">
                              <th className="pb-3 pr-4 font-semibold">Ngày</th>
                              <th className="pb-3 px-4 font-semibold">Giờ</th>
                              <th className="pb-3 px-4 font-semibold">Khách hàng</th>
                              <th className="pb-3 px-4 font-semibold">SĐT</th>
                              <th className="pb-3 px-4 font-semibold">Chi phí</th>
                              <th className="pb-3 px-4 font-semibold">Tình trạng cọc</th>
                              <th className="pb-3 px-4 font-semibold">Nội dung</th>
                              <th className="pb-3 pl-4 font-semibold text-right">Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {filteredBookings.map((b, idx) => {
                              const isUnpaid =
                                b.depositStatus.toLowerCase().includes("chưa cọc") ||
                                b.depositStatus.toLowerCase().includes("chưa thanh toán") ||
                                b.depositStatus === "chưa" ||
                                !b.depositStatus;

                              return (
                                <tr key={idx} className="hover:bg-navy-soft/20 transition-colors">
                                  <td className="py-3 pr-4 font-medium text-ink whitespace-nowrap">
                                    {b.shootDate}
                                  </td>
                                  <td className="py-3 px-4 text-ink-muted whitespace-nowrap">
                                    {b.shootTime || "-"}
                                  </td>
                                  <td className="py-3 px-4 text-ink font-semibold flex items-center gap-1.5 whitespace-nowrap">
                                    <User className="h-3.5 w-3.5 text-ink-muted" />
                                    {b.customerName}
                                  </td>
                                  <td className="py-3 px-4 text-ink-muted whitespace-nowrap">
                                    {b.phoneNumber || "-"}
                                  </td>
                                  <td className="py-3 px-4 text-ink font-semibold whitespace-nowrap">
                                    {b.cost || b.totalPrice || "-"}
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                                        isUnpaid ? "bg-danger/15 text-danger" : "bg-success/15 text-success"
                                      }`}
                                    >
                                      {b.depositStatus || "Chưa cọc"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-ink-muted">
                                    {b.description}
                                  </td>
                                  <td className="py-3 pl-4 text-right text-ink-faint">
                                    {b.notes || "-"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Add Form */}
              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Thêm lịch chụp mới</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddBooking} className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-ink-muted">Ngày chụp</label>
                          <input
                            type="text"
                            placeholder="dd/mm/yyyy"
                            className="h-9 w-full rounded-xl border border-border bg-navy-soft px-3 text-sm text-ink outline-none"
                            value={formDate}
                            onChange={(e) => setFormDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-ink-muted">Giờ chụp</label>
                          <input
                            type="text"
                            placeholder="VD: 14h30, 9h"
                            className="h-9 w-full rounded-xl border border-border bg-navy-soft px-3 text-sm text-ink outline-none"
                            value={formTime}
                            onChange={(e) => setFormTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-ink-muted">Tên khách hàng</label>
                          <input
                            type="text"
                            placeholder="Nguyễn Văn A"
                            className="h-9 w-full rounded-xl border border-border bg-navy-soft px-3 text-sm text-ink outline-none"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-ink-muted">SĐT</label>
                          <input
                            type="text"
                            placeholder="0912345678"
                            className="h-9 w-full rounded-xl border border-border bg-navy-soft px-3 text-sm text-ink outline-none"
                            value={formPhone}
                            onChange={(e) => setFormPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-ink-muted">Chi phí / Giá gói</label>
                          <input
                            type="text"
                            placeholder="VD: 2.5tr, 500k"
                            className="h-9 w-full rounded-xl border border-border bg-navy-soft px-3 text-sm text-ink outline-none"
                            value={formCost}
                            onChange={(e) => setFormCost(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-ink-muted">Đã cọc</label>
                          <input
                            type="text"
                            placeholder="VD: 1tr5, Chưa cọc"
                            className="h-9 w-full rounded-xl border border-border bg-navy-soft px-3 text-sm text-ink outline-none"
                            value={formDeposit}
                            onChange={(e) => setFormDeposit(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-ink-muted">Mô tả nội dung buổi chụp</label>
                        <input
                          type="text"
                          placeholder="Chụp ảnh cưới dã ngoại, chụp chân dung..."
                          className="h-9 w-full rounded-xl border border-border bg-navy-soft px-3 text-sm text-ink outline-none"
                          value={formDesc}
                          onChange={(e) => setFormDesc(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-ink-muted">Ghi chú</label>
                        <input
                          type="text"
                          placeholder="Studio Vintage, make tự túc..."
                          className="h-9 w-full rounded-xl border border-border bg-navy-soft px-3 text-sm text-ink outline-none"
                          value={formNotes}
                          onChange={(e) => setFormNotes(e.target.value)}
                        />
                      </div>

                      <Button type="submit" disabled={submitting} className="w-full h-9 text-xs">
                        {submitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : <PlusCircle className="h-3.5 w-3.5 mr-1" />}
                        Ghi nhận lịch chụp
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CÀI ĐẶT (gộp Cấu hình + Script + Hướng dẫn) */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Cấu hình API */}
            <Card>
              <CardHeader>
                <CardTitle>Cấu hình API kết nối Google Sheets & Telegram</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-ink-muted font-medium">Google Apps Script Web App URL</label>
                  <input
                    type="text"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="h-10 w-full rounded-xl border border-border bg-navy-soft px-3.5 text-sm text-ink outline-none"
                    value={customerScriptUrl}
                    onChange={(e) => setCustomerScriptUrl(e.target.value)}
                  />
                  <p className="text-[11px] text-ink-faint">
                    URL Web App sau khi Deploy dự án Google Apps Script.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-ink-muted font-medium">Token Bot Telegram quản lý Khách hàng</label>
                  <input
                    type="text"
                    placeholder="8944617717:AAGGb_B-..."
                    className="h-10 w-full rounded-xl border border-border bg-navy-soft px-3.5 text-sm text-ink outline-none"
                    value={customerTelegramBotToken}
                    onChange={(e) => setCustomerTelegramBotToken(e.target.value)}
                  />
                  <p className="text-[11px] text-ink-faint">
                    Token của Bot Telegram được tạo từ @BotFather dùng để ghi nhận lịch chụp trực tiếp.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleSaveConfig} className="h-10 text-xs flex-1">
                    Lưu cấu hình
                  </Button>
                  <Button variant="outline" onClick={handleSetupWebhook} className="h-10 text-xs flex-1">
                    Kích hoạt Telegram Webhook
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Mã nguồn Apps Script */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Mã nguồn Google Apps Script</span>
                  <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8">
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    {copiedText ? "Đã copy!" : "Copy code"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-ink-muted mb-3">
                  Tạo một dự án Google Apps Script mới gắn với trang tính Google Sheet của bạn. Copy toàn bộ đoạn code dưới đây, paste vào trình soạn thảo Apps Script, thay thế Token Bot Telegram của bạn, bấm Lưu và Deploy dưới dạng <strong>Web App</strong> (chọn Access là Anyone).
                </p>
                <div className="relative">
                  <pre className="max-h-[300px] overflow-y-auto rounded-xl border border-border bg-surface p-4 text-[10px] text-brand font-mono whitespace-pre-wrap select-all">
                    {appsScriptCodeForCustomer}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Hướng dẫn Telegram */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Hướng dẫn sử dụng Bot Telegram nhập lịch chụp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs text-ink-muted">
                <div className="space-y-1.5">
                  <p className="font-semibold text-ink">Cú pháp nhập dữ liệu lịch chụp trên Telegram:</p>
                  <div className="rounded-xl border border-border bg-navy-soft/40 p-3 font-mono text-[11px] text-brand">
                    [Ngày chụp] | [Tên khách hàng] | [Tình trạng cọc] | [Nội dung chụp] | [Ghi chú]
                  </div>
                  <p>Các trường thông tin phân cách bằng dấu gạch đứng <code className="font-semibold">|</code>.</p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-ink">Ví dụ hợp lệ:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <code className="font-mono text-brand">22/06/2026 | Nguyễn Văn A | Đã cọc 1M | Chụp doanh nhân | Studio gói 2h</code>
                    </li>
                    <li>
                      <code className="font-mono text-brand">Hôm nay | Lê Thị B | Chưa cọc | Chụp ảnh gia đình dã ngoại | Make up tự túc</code>
                    </li>
                  </ul>
                  <p className="text-[11px] text-ink-faint italic mt-1">
                    * Mẹo: Bạn có thể điền ngày chụp là "Hôm nay" hoặc "Today", hệ thống sẽ tự động chuyển thành ngày hiện tại!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
