import { useEffect, useState, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  Copy,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  Info,
  Calendar,
  Layers,
  FileText,
  User,
  Code
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Transaction {
  date: string;
  type: "Thu" | "Chi" | string;
  category: string;
  amount: number;
  description: string;
  source: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { date: "18/06/2026 11:20", type: "Thu", category: "Thuê chụp ảnh", amount: 3500000, description: "Chụp ảnh phóng sự cưới gói Gold - Studio", source: "Telegram (Nam)" },
  { date: "18/06/2026 09:15", type: "Chi", category: "Chi tiêu khác", amount: 150000, description: "Mua nước ngọt & hoa quả tiếp khách tại studio", source: "Telegram (Hoa)" },
  { date: "17/06/2026 18:00", type: "Góp vốn", category: "Góp vốn hiện vật (Mua đồ)", amount: 12000000, description: "Góp vốn: Mua ống kính Sigma 24-70mm f2.8", source: "Telegram (Nam)" },
  { date: "17/06/2026 16:30", type: "Thu", category: "Đặt cọc", amount: 1000000, description: "Khách cọc lịch chụp chân dung doanh nhân ngày 22/06", source: "Desktop App" },
  { date: "16/06/2026 14:00", type: "Góp vốn", category: "Góp vốn tiền mặt", amount: 5000000, description: "Góp thêm vốn mặt lưu động cho quỹ studio", source: "Desktop App" },
  { date: "16/06/2026 10:00", type: "Chi", category: "Marketing/Ads", amount: 2000000, description: "Chạy quảng cáo Facebook chiến dịch mùa cưới tháng 6", source: "Desktop App" },
  { date: "15/06/2026 17:45", type: "Thu", category: "Thuê chụp ảnh", amount: 4500000, description: "Thanh toán gói chụp ảnh gia đình dã ngoại ngoại cảnh", source: "Telegram (Trang)" },
  { date: "14/06/2026 11:30", type: "Chi", category: "Thuê váy/Studio", amount: 1200000, description: "Thuê studio bối cảnh Vintage ngoài của bên đối tác", source: "Telegram (Nam)" },
  { date: "12/06/2026 15:00", type: "Chi", category: "Mua thiết bị", amount: 3200000, description: "Mua thẻ nhớ SanDisk Extreme Pro 128GB (2 cái)", source: "Desktop App" },
  { date: "10/06/2026 18:00", type: "Thu", category: "Thuê váy/đồ", amount: 1500000, description: "Thuê váy cưới cô dâu gói cao cấp đi tiệc", source: "Telegram (Hoa)" }
];

export function AccountingPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">("dashboard");
  const [scriptUrl, setScriptUrl] = useState(localStorage.getItem("tlora_accounting_script_url") || "");
  const [telegramBotToken, setTelegramBotToken] = useState(localStorage.getItem("tlora_accounting_telegram_token") || "");
  const [initialBalance, setInitialBalance] = useState(Number(localStorage.getItem("tlora_accounting_initial_balance")) || 0);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUsingMock, setIsUsingMock] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const getTodayFormatted = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // New Transaction Form State
  const [formType, setFormType] = useState<"Thu" | "Chi" | "Góp vốn">("Chi");
  const [formCategory, setFormCategory] = useState("Chi tiêu khác");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState(getTodayFormatted());
  const [addingTransaction, setAddingTransaction] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"Tất cả" | "Thu" | "Chi" | "Góp vốn">("Tất cả");

  // Copy state
  const [copiedText, setCopiedText] = useState(false);

  // Load accounting data
  const loadData = async (urlToFetch = scriptUrl, silent = false) => {
    if (!urlToFetch) {
      setTransactions(MOCK_TRANSACTIONS);
      setIsUsingMock(true);
      return;
    }

    if (!silent) setLoading(true);
    setError("");
    try {
      // Fetch from Google Apps Script Web App (JSONP or GET)
      const res = await fetch(urlToFetch);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        setIsUsingMock(false);
      } else {
        throw new Error("Dữ liệu Google Apps Script trả về không đúng định dạng.");
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        setError("Không thể kết nối đến Google Sheets API. Đang hiển thị dữ liệu mẫu.");
        setTransactions(MOCK_TRANSACTIONS);
        setIsUsingMock(true);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Real-time background synchronization (polls Google Sheets Web App every 5 seconds)
  useEffect(() => {
    void loadData();

    if (!scriptUrl) return;

    const interval = setInterval(() => {
      void loadData(scriptUrl, true);
    }, 5000);

    return () => clearInterval(interval);
  }, [scriptUrl]);

  // Save Settings
  const handleSaveConfig = () => {
    localStorage.setItem("tlora_accounting_script_url", scriptUrl.trim());
    localStorage.setItem("tlora_accounting_telegram_token", telegramBotToken.trim());
    localStorage.setItem("tlora_accounting_initial_balance", String(initialBalance));
    
    setSuccessMsg("Đã lưu cấu hình thành công!");
    setTimeout(() => setSuccessMsg(""), 3000);
    void loadData(scriptUrl.trim());
  };

  // Add new transaction manually
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ lớn hơn 0.");
      return;
    }
    if (!formDescription.trim()) {
      setError("Vui lòng nhập mô tả giao dịch.");
      return;
    }

    setError("");
    
    if (isUsingMock) {
      // Add local mock transaction
      const dateParts = formDate.split("/");
      const formattedDate = dateParts.length === 3 
        ? `${dateParts[0].padStart(2, "0")}/${dateParts[1].padStart(2, "0")}/${dateParts[2]} ${new Date().toTimeString().slice(0, 5)}`
        : new Date().toLocaleString("vi-VN", { hour12: false }).replace(",", "");

      const newTx: Transaction = {
        date: formattedDate,
        type: formType,
        category: formCategory,
        amount: amountNum,
        description: formDescription.trim(),
        source: "Desktop App"
      };
      setTransactions((prev) => [newTx, ...prev]);
      setFormAmount("");
      setFormDescription("");
      setSuccessMsg("Đã thêm giao dịch mẫu thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
      return;
    }

    // Call real API
    setAddingTransaction(true);
    try {
      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors", // Use no-cors for Google Apps Script Web App redirects if needed, but JSON POST usually requires cors
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "add_transaction",
          type: formType,
          category: formCategory,
          amount: amountNum,
          description: formDescription.trim(),
          source: "Desktop App",
          date: formDate
        })
      });
      
      setFormAmount("");
      setFormDescription("");
      setSuccessMsg("Giao dịch đã được gửi thành công! Hãy làm mới dữ liệu sau vài giây.");
      setTimeout(() => setSuccessMsg(""), 4000);
      
      // Delay and refresh
      setTimeout(() => {
        void loadData();
      }, 2000);
    } catch (err) {
      setError("Không thể gửi giao dịch lên Google Sheet. " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAddingTransaction(false);
    }
  };

  // Calculate Metrics
  const metrics = useMemo(() => {
    let thu = 0;
    let chi = 0;
    let gopTien = 0;
    let gopDo = 0;
    transactions.forEach((tx) => {
      if (tx.type === "Thu") thu += tx.amount;
      else if (tx.type === "Chi") chi += tx.amount;
      else if (tx.type === "Góp vốn") {
        if (tx.category === "Góp vốn tiền mặt") gopTien += tx.amount;
        else gopDo += tx.amount;
      }
    });
    const loiNhuan = thu - chi;
    const tienLuuDong = initialBalance + loiNhuan + gopTien;
    const tyLe = thu > 0 ? Math.round((loiNhuan / thu) * 100) : 0;
    return {
      revenue: thu,
      expense: chi,
      profit: loiNhuan,
      ratio: tyLe,
      cashOnHand: tienLuuDong,
      cashCapital: gopTien,
      assetCapital: gopDo
    };
  }, [transactions, initialBalance]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType =
        filterType === "Tất cả" || tx.type === filterType;
      
      return matchSearch && matchType;
    });
  }, [transactions, searchTerm, filterType]);

  // Categories list based on Type
  const categoriesList = useMemo(() => {
    if (formType === "Thu") {
      return ["Thuê chụp ảnh", "Đặt cọc", "Thuê váy/đồ", "Doanh thu khác"];
    } else if (formType === "Góp vốn") {
      return ["Góp vốn tiền mặt", "Góp vốn hiện vật (Mua đồ)"];
    }
    return ["Mua thiết bị", "Thuê váy/Studio", "Cát-xê mẫu/makeup", "Marketing/Ads", "Lương nhân viên", "Chi tiêu khác"];
  }, [formType]);

  // Update default category when type changes
  useEffect(() => {
    setFormCategory(categoriesList[0]);
  }, [formType, categoriesList]);

  // Apps Script Code Template
  const customerTelegramToken = localStorage.getItem("tlora_customer_telegram_token") || "";
  const appsScriptCode = `const CUSTOMER_BOT_TOKEN = "${customerTelegramToken || "ĐIỀN_TOKEN_BOT_KHÁCH_HÀNG"}";
const ACCOUNTING_BOT_TOKEN = "${telegramBotToken || "ĐIỀN_TOKEN_BOT_KẾ_TOÁN"}";

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
    
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
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
      var customerSheet = spreadsheet.getSheetByName("KHÁCH HÀNG") || spreadsheet.getSheetByName("Khách hàng");
      if (!customerSheet) {
        customerSheet = spreadsheet.insertSheet("KHÁCH HÀNG");
        customerSheet.appendRow(["Ngày chụp", "Tên khách hàng", "Giá gói", "Đã cọc", "Mô tả buổi chụp", "Ghi chú"]);
      }
      
      var shootDateVal = contents.shootDate || "";
      var customerName = contents.customerName || "";
      var totalPrice = contents.totalPrice || "";
      var depositStatus = contents.depositStatus || "";
      var descriptionVal = contents.description || "";
      var notesVal = contents.notes || "";
      
      // Parse shoot date if possible
      var finalDate = shootDateVal;
      var dateParts = shootDateVal.split("/");
      if (dateParts.length === 3) {
        finalDate = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]), 12, 0, 0);
      }
      
      customerSheet.appendRow([finalDate, customerName, totalPrice, depositStatus, descriptionVal, notesVal]);
      
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
        message: "Khách hàng mới đã được lưu vào Google Sheet và tự động ghi sổ kế toán (nếu đã cọc)!"
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
    var customerSheet = spreadsheet.getSheetByName("KHÁCH HÀNG") || spreadsheet.getSheetByName("Khách hàng");
    if (!customerSheet) {
      customerSheet = spreadsheet.insertSheet("KHÁCH HÀNG");
      customerSheet.appendRow(["Ngày chụp", "Tên khách hàng", "Giá gói", "Đã cọc", "Mô tả buổi chụp", "Ghi chú"]);
    }
    
    var data = customerSheet.getDataRange().getValues();
    var schedule = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[1]) continue;
      
      var dateVal = "";
      if (row[0] instanceof Date) {
        dateVal = Utilities.formatDate(row[0], Session.getScriptTimeZone(), "dd/MM/yyyy");
      } else {
        dateVal = String(row[0]);
      }
      
      schedule.push({
        shootDate: dateVal,
        customerName: String(row[1]),
        totalPrice: String(row[2]),
        depositStatus: String(row[3]),
        description: String(row[4]),
        notes: String(row[5])
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
  var tm = clean.match(/(\\d{1,2})\\s*[hH]\\s*(\\d{0,2})/);
  var tm2 = clean.match(/(\\d{1,2}):(\\d{2})/);
  if (tm) { var hh=parseInt(tm[1],10); var mi=tm[2]?parseInt(tm[2],10):0; timeStr=String(hh).padStart(2,"0")+":"+String(mi).padStart(2,"0"); clean=clean.replace(tm[0],"").trim(); }
  else if (tm2) { timeStr=String(parseInt(tm2[1],10)).padStart(2,"0")+":"+tm2[2]; clean=clean.replace(tm2[0],"").trim(); }
  var dl = clean.toLowerCase().trim();
  if (dl==="hôm nay"||dl==="hom nay"||dl==="today"||dl==="") { var t=new Date(); dateStr=String(t.getDate()).padStart(2,"0")+"/"+String(t.getMonth()+1).padStart(2,"0")+"/"+t.getFullYear(); }
  else if (dl==="ngày mai"||dl==="ngay mai"||dl==="mai"||dl==="tomorrow") { var t2=new Date(); t2.setDate(t2.getDate()+1); dateStr=String(t2.getDate()).padStart(2,"0")+"/"+String(t2.getMonth()+1).padStart(2,"0")+"/"+t2.getFullYear(); }
  else { var dp=clean.match(/(\\d{1,2})\\s*[\\/\\-\\.]\\s*(\\d{1,2})(?:\\s*[\\/\\-\\.]\\s*(\\d{2,4}))?/); if(dp){var d=String(parseInt(dp[1],10)).padStart(2,"0");var mo=String(parseInt(dp[2],10)).padStart(2,"0");var y=dp[3]?dp[3]:String(new Date().getFullYear());if(y.length===2)y="20"+y;dateStr=d+"/"+mo+"/"+y;}else{dateStr=clean;} }
  return { dateStr: dateStr, timeStr: timeStr };
}

function getOrCreateCustomerSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName("KHÁCH HÀNG") || spreadsheet.getSheetByName("Khách hàng");
  if (!sheet) { sheet = spreadsheet.insertSheet("KHÁCH HÀNG"); sheet.appendRow(["Ngày chụp","Giờ chụp","Tên khách hàng","SĐT","Giá gói","Đã cọc","Chi phí","Mô tả buổi chụp","Ghi chú"]); }
  return sheet;
}
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

  
  sendTelegramMessage(chatId, "✅ Đã ghi nhận lịch chụp & Ghi sổ Kế toán thành công!\\n\\n📅 Ngày chụp: " + finalDate + "\\n👤 Khách hàng: " + nameStr + "\\n💵 Giá gói: " + priceStr + "\\n💵 Đã cọc: " + depositStr + "\\n📝 Nội dung: " + descStr + "\\nℹ️ Ghi chú: " + (notesStr || "-"), "customer");
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
  
  var match = cleanText.match(/^([0-9.,]+(?:[kKmM]|(?:tr|tỷ|ty|b)\\s*\\d*|\\d*))(?:\\s+(.*))?$/i);
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
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Setup Webhook script help link
  const handleSetupWebhook = async () => {
    if (!telegramBotToken || !scriptUrl) {
      setError("Vui lòng nhập đầy đủ Token Bot Telegram và Google Apps Script URL trước.");
      return;
    }
    const webhookUrl = scriptUrl.includes("?") 
      ? `${scriptUrl}&bot=accounting`
      : `${scriptUrl}?bot=accounting`;
    const url = `https://api.telegram.org/bot${telegramBotToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    window.open(url, "_blank");
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("vi-VN") + "đ";
  };

  // Custom SVG Chart Mock/Real Cashflow
  const renderChart = () => {
    // Generate data for 6 months
    const months = ["T1", "T2", "T3", "T4", "T5", "T6"];
    const maxVal = Math.max(metrics.revenue, metrics.expense, 5000000) * 1.1;
    
    // Scale factor to map values to SVG height (max 150px)
    const scale = (val: number) => (val / maxVal) * 120;

    // Simulate past month values based on current metrics
    const revData = [
      metrics.revenue * 0.7,
      metrics.revenue * 0.85,
      metrics.revenue * 0.6,
      metrics.revenue * 0.9,
      metrics.revenue * 0.75,
      metrics.revenue
    ];
    const expData = [
      metrics.expense * 0.6,
      metrics.expense * 0.8,
      metrics.expense * 0.7,
      metrics.expense * 0.65,
      metrics.expense * 0.9,
      metrics.expense
    ];

    return (
      <div className="relative w-full h-[180px] bg-navy-soft/30 rounded-2xl p-4 flex flex-col justify-between border border-border/40">
        <div className="flex justify-between items-center text-xs text-ink-muted mb-2">
          <span>Doanh thu & Chi tiêu 6 tháng gần nhất</span>
          <div className="flex gap-3">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-success rounded-full"></span>Thu</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-danger rounded-full"></span>Chi</span>
          </div>
        </div>
        
        {/* SVG Drawing */}
        <svg className="w-full flex-1" viewBox="0 0 360 140">
          {/* Grid lines */}
          <line x1="30" y1="20" x2="350" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
          <line x1="30" y1="60" x2="350" y2="60" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
          <line x1="30" y1="100" x2="350" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
          <line x1="30" y1="120" x2="350" y2="120" stroke="rgba(255,255,255,0.1)" />

          {months.map((m, idx) => {
            const x = 50 + idx * 50;
            const revHeight = scale(revData[idx]);
            const expHeight = scale(expData[idx]);
            
            return (
              <g key={m}>
                {/* Revenue bar (Green) */}
                <rect 
                  x={x - 12} 
                  y={120 - revHeight} 
                  width="8" 
                  height={Math.max(revHeight, 2)} 
                  fill="url(#greenGradient)" 
                  rx="2"
                />
                {/* Expense bar (Red) */}
                <rect 
                  x={x} 
                  y={120 - expHeight} 
                  width="8" 
                  height={Math.max(expHeight, 2)} 
                  fill="url(#redGradient)" 
                  rx="2"
                />
                {/* Label */}
                <text x={x - 4} y="135" fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="middle">
                  {m}
                </text>
              </g>
            );
          })}

          {/* Gradients */}
          <defs>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <div className="pb-20">
      <TopBar
        title="Kế toán & Chi tiêu Studio"
        description="Theo dõi doanh thu, chi tiêu, lợi nhuận ròng của Studio đồng bộ tức thời qua Telegram Bot và Google Sheets API."
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
            Bảng điều khiển
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
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Đang sử dụng dữ liệu mẫu</p>
              <p className="text-xs mt-0.5 opacity-90">
                Ứng dụng chưa liên kết với Google Sheets. Chuyển sang tab <strong>Cấu hình API</strong> để cấu hình Web App URL hoặc xem tab <strong>Cài đặt Telegram & Script</strong> để thiết lập hệ thống ghi sổ kế toán tự động.
              </p>
            </div>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Cash Balance Hero Banner */}
            <div className="rounded-3xl border border-brand/20 bg-brand-gradient p-6 text-white shadow-glow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/70 font-semibold">Tiền lưu động hiện có (Quỹ)</p>
                <h3 className="text-3.5xl font-bold mt-1.5">{formatNumber(metrics.cashOnHand)}</h3>
                <p className="text-xs text-white/70 mt-1">Tổng tiền mặt khả dụng hiện có trong két và tài khoản ngân hàng của Studio</p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs bg-white/15 px-3 py-1.5 rounded-xl font-medium">
                  Vốn đầu vào: {formatNumber(initialBalance)}
                </span>
                <span className="text-xs bg-white/15 px-3 py-1.5 rounded-xl font-medium">
                  Giao dịch: {transactions.length}
                </span>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card className="p-5 border border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-muted font-medium">Doanh thu (Thu)</p>
                  <p className="text-xl font-bold text-success mt-1">{formatNumber(metrics.revenue)}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-success/15 flex items-center justify-center text-success shrink-0">
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
              </Card>

              <Card className="p-5 border border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-muted font-medium">Chi tiêu studio</p>
                  <p className="text-xl font-bold text-danger mt-1">{formatNumber(metrics.expense)}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-danger/15 flex items-center justify-center text-danger shrink-0">
                  <TrendingDown className="h-4.5 w-4.5" />
                </div>
              </Card>

              <Card className="p-5 border border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-muted font-medium">Vốn góp tiền mặt</p>
                  <p className="text-xl font-bold text-indigo-400 mt-1">{formatNumber(metrics.cashCapital)}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                  <Wallet className="h-4.5 w-4.5" />
                </div>
              </Card>

              <Card className="p-5 border border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-muted font-medium">Góp vốn mua đồ</p>
                  <p className="text-xl font-bold text-orange-400 mt-1">{formatNumber(metrics.assetCapital)}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-400 shrink-0">
                  <PlusCircle className="h-4.5 w-4.5" />
                </div>
              </Card>
            </div>

            {/* Chart and Quick Input Form */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Chart */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center justify-between w-full">
                      <span>Báo cáo doanh số</span>
                      <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading} className="h-8">
                        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                        Làm mới
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center h-[200px]">
                    {renderChart()}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Add Form */}
              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Ghi sổ nhanh</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddTransaction} className="space-y-3.5">
                      {/* Type Toggle */}
                      <div className="flex rounded-xl bg-navy-soft p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => setFormType("Chi")}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition ${
                            formType === "Chi" ? "bg-danger text-white shadow" : "text-ink-muted hover:text-ink"
                          }`}
                        >
                          Chi tiêu
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormType("Thu")}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition ${
                            formType === "Thu" ? "bg-success text-white shadow" : "text-ink-muted hover:text-ink"
                          }`}
                        >
                          Doanh thu
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormType("Góp vốn")}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition ${
                            formType === "Góp vốn" ? "bg-brand text-white shadow" : "text-ink-muted hover:text-ink"
                          }`}
                        >
                          Góp vốn
                        </button>
                      </div>

                      {/* Category select */}
                      <div className="space-y-1">
                        <label className="text-xs text-ink-muted">Phân loại chi tiết</label>
                        <select
                          className="h-9 w-full rounded-xl border border-border bg-navy-soft px-3 text-sm text-ink outline-none"
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                        >
                          {categoriesList.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date input */}
                      <div className="space-y-1">
                        <label className="text-xs text-ink-muted">Ngày ghi nhận</label>
                        <input
                          type="text"
                          placeholder="dd/mm/yyyy"
                          className="h-9 w-full rounded-xl border border-border bg-navy-soft px-3 text-sm text-ink outline-none"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          required
                        />
                      </div>

                      {/* Amount input */}
                      <div className="space-y-1">
                        <label className="text-xs text-ink-muted">Số tiền (đ)</label>
                        <input
                          type="number"
                          placeholder="Ví dụ: 150000"
                          className="h-9 w-full rounded-xl border border-border bg-navy-soft px-3 text-sm text-ink outline-none"
                          value={formAmount}
                          onChange={(e) => setFormAmount(e.target.value)}
                          required
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <label className="text-xs text-ink-muted">
                          {formCategory === "Góp vốn hiện vật (Mua đồ)" ? "Góp bằng hiện vật gì (Ghi chú)" : "Mô tả chi tiết"}
                        </label>
                        <input
                          type="text"
                          placeholder={formCategory === "Góp vốn hiện vật (Mua đồ)" ? "Ví dụ: Máy ảnh Canon R6, Lens Sigma..." : "Ví dụ: Mua cafe tiếp khách"}
                          className="h-9 w-full rounded-xl border border-border bg-navy-soft px-3 text-sm text-ink outline-none"
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          required
                        />
                      </div>

                      <Button type="submit" disabled={addingTransaction} className="w-full h-9 text-xs">
                        {addingTransaction ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : <PlusCircle className="h-3.5 w-3.5 mr-1" />}
                        Ghi vào sổ kế toán
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Transactions History */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                  <CardTitle className="text-base font-semibold">Lịch sử giao dịch chi tiêu</CardTitle>
                  
                    {/* Search and Filters */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <input
                        type="text"
                        placeholder="Tìm kiếm mô tả/hạng mục..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8.5 rounded-xl border border-border bg-navy-soft px-3 text-xs text-ink placeholder:text-ink-faint outline-none w-48"
                      />
                      
                      <div className="flex border border-border rounded-xl p-0.5 bg-navy-soft">
                        {["Tất cả", "Thu", "Chi", "Góp vốn"].map((type) => (
                          <button
                            key={type}
                            onClick={() => setFilterType(type as any)}
                            className={`px-2.5 py-1 rounded-lg text-xs transition ${
                              filterType === type ? "bg-brand text-white" : "text-ink-muted hover:text-ink"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-[360px] overflow-auto">
                {filteredTransactions.length === 0 ? (
                  <div className="p-8 text-center text-sm text-ink-muted">Không tìm thấy giao dịch nào phù hợp.</div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border bg-navy-soft/20 text-ink-muted text-xs">
                        <th className="px-4 py-3 font-semibold"><Calendar className="h-3 w-3 inline mr-1" />Ngày</th>
                        <th className="px-4 py-3 font-semibold">Phân loại</th>
                        <th className="px-4 py-3 font-semibold"><Layers className="h-3 w-3 inline mr-1" />Hạng mục</th>
                        <th className="px-4 py-3 font-semibold"><DollarSign className="h-3 w-3 inline mr-1" />Số tiền</th>
                        <th className="px-4 py-3 font-semibold"><FileText className="h-3 w-3 inline mr-1" />Mô tả</th>
                        <th className="px-4 py-3 font-semibold"><User className="h-3 w-3 inline mr-1" />Nguồn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredTransactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-navy-soft/20 text-xs">
                          <td className="px-4 py-2.5 text-ink-muted whitespace-nowrap">{tx.date}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 font-bold ${
                                tx.type === "Thu"
                                  ? "bg-success/15 text-success"
                                  : tx.type === "Chi"
                                    ? "bg-danger/15 text-danger"
                                    : "bg-indigo-500/15 text-indigo-400"
                              }`}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-medium text-ink whitespace-nowrap">{tx.category}</td>
                          <td className="px-4 py-2.5 font-semibold text-ink">
                            <span className={tx.type === "Thu" ? "text-success" : tx.type === "Chi" ? "text-danger" : "text-indigo-400"}>
                              {tx.type === "Thu" || tx.type === "Góp vốn" ? "+" : "-"}{tx.amount.toLocaleString("vi-VN")} đ
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-ink-muted max-w-[240px] truncate" title={tx.description}>
                            {tx.description}
                          </td>
                          <td className="px-4 py-2.5 text-ink-faint">{tx.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: CÀI ĐẶT (gộp Cấu hình + Script + Hướng dẫn) */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Cấu hình API */}
            <Card>
              <CardHeader>
                <CardTitle>Liên kết Google Sheets API & Telegram</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Google Apps Script Web App URL</label>
                  <input
                    type="text"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={scriptUrl}
                    onChange={(e) => setScriptUrl(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-navy-soft px-3.5 text-sm text-ink outline-none"
                  />
                  <p className="text-xs text-ink-muted">
                    Khi Deploy Apps Script, chọn chạy dưới danh nghĩa của bạn và cấp quyền truy cập cho <strong>"Anyone"</strong>.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-medium text-ink">Token Bot Telegram</label>
                  <input
                    type="password"
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-navy-soft px-3.5 text-sm text-ink outline-none"
                  />
                  <p className="text-xs text-ink-muted">
                    Token nhận được từ `@BotFather` khi tạo bot.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-medium text-ink">Vốn lưu động ban đầu (Quỹ ban đầu)</label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 10000000"
                    value={initialBalance || ""}
                    onChange={(e) => setInitialBalance(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-border bg-navy-soft px-3.5 text-sm text-ink outline-none"
                  />
                  <p className="text-xs text-ink-muted">
                    Số tiền mặt/tiền tài khoản lưu động ban đầu hiện có trước khi tính các giao dịch Thu/Chi.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <Button onClick={handleSaveConfig} className="px-4">
                    Lưu cấu hình
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleSetupWebhook()}
                    disabled={!telegramBotToken || !scriptUrl}
                    className="px-4"
                  >
                    Kích hoạt Webhook Telegram Bot
                  </Button>
                  <Button
                    variant="subtle"
                    onClick={() => void loadData(scriptUrl)}
                    disabled={loading}
                    className="px-4"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
                    Tải lại dữ liệu
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Hướng dẫn cấu hình */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <HelpCircle className="h-5 w-5 text-brand" />
                  Hướng dẫn cấu hình hệ thống Kế toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-sm text-ink-muted leading-relaxed">
                <div>
                  <h3 className="font-semibold text-ink text-sm mb-1.5">Bước 1: Chuẩn bị Google Trang Tính</h3>
                  <p>Tạo một Google Trang tính mới. Tại hàng đầu tiên, tạo các cột tiêu đề theo thứ tự:</p>
                  <div className="mt-2 overflow-x-auto">
                    <table className="border border-border text-center rounded-xl bg-navy-soft/30 text-xs w-full">
                      <thead>
                        <tr className="bg-navy-soft border-b border-border">
                          <th className="px-3 py-1.5">A</th>
                          <th className="px-3 py-1.5">B</th>
                          <th className="px-3 py-1.5">C</th>
                          <th className="px-3 py-1.5">D</th>
                          <th className="px-3 py-1.5">E</th>
                          <th className="px-3 py-1.5">F</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-3 py-2 border-r border-border font-medium text-ink">Ngày</td>
                          <td className="px-3 py-2 border-r border-border font-medium text-ink">Loại</td>
                          <td className="px-3 py-2 border-r border-border font-medium text-ink">Hạng mục</td>
                          <td className="px-3 py-2 border-r border-border font-medium text-ink">Số tiền</td>
                          <td className="px-3 py-2 border-r border-border font-medium text-ink">Mô tả</td>
                          <td className="px-3 py-2 font-medium text-ink">Nguồn</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-ink text-sm mb-1.5">Bước 2: Sử dụng trên Telegram</h3>
                  <p>Mở cuộc trò chuyện với Bot và nhập thu chi:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-xs bg-navy-soft/40 p-3 rounded-xl border border-border/30">
                    <li>Ghi <strong>Thu</strong>: <code className="text-success font-bold text-xs bg-success/10 px-1 py-0.5 rounded">+</code> hoặc <code className="text-success font-bold text-xs bg-success/10 px-1 py-0.5 rounded">thu</code></li>
                    <li className="pl-4">Ví dụ: <code className="text-ink font-mono font-bold">+1500k Chụp ảnh cưới</code></li>
                    <li className="mt-1.5">Ghi <strong>Chi</strong>: <code className="text-danger font-bold text-xs bg-danger/10 px-1 py-0.5 rounded">-</code> hoặc <code className="text-danger font-bold text-xs bg-danger/10 px-1 py-0.5 rounded">chi</code></li>
                    <li className="pl-4">Ví dụ: <code className="text-ink font-mono font-bold">-200k Mua ổ cắm</code></li>
                  </ul>
                  <p className="mt-2 text-xs text-brand flex items-center gap-1 font-medium">
                    <Info className="h-3.5 w-3.5" />
                    Hệ thống tự nhận diện "k" (x1,000), "tr/triệu" (x1,000,000) và tự phân loại hạng mục!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Apps Script Code Copy Card */}
            <Card>
              <CardHeader className="flex justify-between items-center w-full">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Code className="h-4 w-4 text-brand" />
                  Mã nguồn Google Apps Script
                </CardTitle>
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8">
                  {copiedText ? <CheckCircle2 className="h-3.5 w-3.5 text-success mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copiedText ? "Đã copy!" : "Copy code"}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-navy-soft rounded-2xl border border-border/50 text-[11px] font-mono overflow-auto max-h-[300px] text-ink-muted leading-relaxed">
                  {appsScriptCode}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
