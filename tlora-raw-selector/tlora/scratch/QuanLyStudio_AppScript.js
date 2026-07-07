// ===================================================================
// QUẢN LÝ STUDIO - Google Apps Script v2
// Copy toàn bộ code này vào Google Apps Script Editor rồi Deploy
// ===================================================================

const CUSTOMER_BOT_TOKEN = "ĐIỀN_TOKEN_BOT_KHÁCH_HÀNG";
const ACCOUNTING_BOT_TOKEN = "ĐIỀN_TOKEN_BOT_KẾ_TOÁN";

// Header cột sheet KHÁCH HÀNG (9 cột)
var CUSTOMER_HEADERS = ["Ngày chụp","Giờ chụp","Tên khách hàng","SĐT","Giá gói","Đã cọc","Chi phí","Mô tả buổi chụp","Ghi chú"];

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
      var txSheet = spreadsheet.getSheetByName("BẢNG THEO DÕI THU/CHI")
        || spreadsheet.getSheetByName("THU/CHI")
        || spreadsheet.getSheetByName("Giao dịch");
      if (!txSheet) txSheet = spreadsheet.getActiveSheet();

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
          if (!isNaN(parsed)) txDate = new Date(parsed);
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
      var depositStatus= contents.depositStatus || "";
      var costVal      = contents.cost || "";
      var descriptionVal = contents.description || "";
      var notesVal     = contents.notes || "";

      var finalDate = shootDateVal;
      var dateParts = shootDateVal.split("/");
      if (dateParts.length === 3) {
        finalDate = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]), 12, 0, 0);
      }

      customerSheet.appendRow([finalDate, shootTime, customerName, phoneNumber, totalPrice, depositStatus, costVal, descriptionVal, notesVal]);

      // AUTO-LOG CỌC VÀO KẾ TOÁN
      var depositAmount = parseAmountFromString(depositStatus);
      if (depositAmount > 0) {
        var txSheet2 = spreadsheet.getSheetByName("BẢNG THEO DÕI THU/CHI")
          || spreadsheet.getSheetByName("THU/CHI")
          || spreadsheet.getSheetByName("Giao dịch");
        if (!txSheet2) {
          txSheet2 = spreadsheet.insertSheet("BẢNG THEO DÕI THU/CHI");
          txSheet2.appendRow(["Ngày", "Loại", "Hạng mục", "Số tiền", "Mô tả", "Nguồn"]);
        }
        var txDate2 = finalDate instanceof Date ? finalDate : new Date();
        txSheet2.appendRow([
          txDate2, "Thu", "Đặt cọc", depositAmount,
          "Khách cọc: " + customerName + " (" + descriptionVal + ")",
          "Lịch chụp (" + customerName + ")"
        ]);
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
    var customerSheet = getOrCreateCustomerSheet(spreadsheet);

    var data = customerSheet.getDataRange().getValues();
    var schedule = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[2]) continue;
      var dateVal = row[0] instanceof Date
        ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), "dd/MM/yyyy")
        : String(row[0]);
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

  // Default: get_transactions
  var txSheet = spreadsheet.getSheetByName("BẢNG THEO DÕI THU/CHI")
    || spreadsheet.getSheetByName("THU/CHI")
    || spreadsheet.getSheetByName("Giao dịch");
  if (!txSheet) {
    var sheets = spreadsheet.getSheets();
    if (sheets.length === 1 && (sheets[0].getName() === "Trang tính 1" || sheets[0].getName() === "Sheet1")) {
      txSheet = sheets[0];
      txSheet.setName("BẢNG THEO DÕI THU/CHI");
      if (txSheet.getLastRow() === 0) txSheet.appendRow(["Ngày", "Loại", "Hạng mục", "Số tiền", "Mô tả", "Nguồn"]);
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
    var dateVal = row[0] instanceof Date
      ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm")
      : String(row[0]);
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

// ===================================================================
// TELEGRAM HANDLERS
// ===================================================================

function handleTelegramCustomerMessage(message) {
  var chatId = message.chat.id;
  var text = message.text || "";
  var username = message.from.username || message.from.first_name || "Telegram";
  var cleanText = text.trim();

  // === XỬ LÝ XÁC NHẬN TRÙNG LỊCH ===
  var lowerText = cleanText.toLowerCase();
  if (lowerText === "ok" || lowerText === "xác nhận" || lowerText === "xac nhan" || lowerText === "có" || lowerText === "co" || lowerText === "yes") {
    var props = PropertiesService.getScriptProperties();
    var pendingKey = "pending_" + chatId;
    var pendingJson = props.getProperty(pendingKey);
    if (pendingJson) {
      props.deleteProperty(pendingKey);
      var pending = JSON.parse(pendingJson);
      saveBookingToSheet(pending, username);
      sendTelegramMessage(chatId,
        "✅ Đã xác nhận & ghi nhận lịch chụp!\n\n" + formatBookingInfo(pending),
        "customer");
      return;
    }
    // Không có pending → bỏ qua, xử lý như input bình thường
  }

  // === PARSE INPUT ===
  // Cú pháp: Ngày giờ | Tên | SĐT | Đã cọc | Chi phí | Mô tả | Ghi chú
  var parts = cleanText.split("|");
  if (parts.length < 2) {
    sendTelegramMessage(chatId,
      "⚠️ Sai cú pháp! Nhập theo dạng:\nNgày giờ | Tên | SĐT | Đã cọc | Chi phí | Mô tả | Ghi chú\n\nVí dụ:\n22/06/2026 14h30 | Nguyễn Văn A | 0912345678 | 1tr5 | 5tr | Chụp cưới | Studio gói Gold\n\nHoặc:\nHôm nay 3h | Lê B | 0988111222 | 500k | 2tr | Chân dung",
      "customer");
    return;
  }

  var dateTimeStr = parts[0].trim();
  var nameStr     = parts[1].trim();
  var phoneStr    = parts.length > 2 ? parts[2].trim() : "";
  var depositStr  = parts.length > 3 ? parts[3].trim() : "Chưa cọc";
  var costStr     = parts.length > 4 ? parts[4].trim() : "";
  var descStr     = parts.length > 5 ? parts[5].trim() : "Chụp ảnh";
  var notesStr    = parts.length > 6 ? parts[6].trim() : "";

  // === PARSE NGÀY + GIỜ ===
  var parsed = parseDateTimeString(dateTimeStr);

  // Tạo booking object
  var booking = {
    dateStr: parsed.dateStr,
    timeStr: parsed.timeStr,
    name: nameStr,
    phone: phoneStr,
    deposit: depositStr,
    cost: costStr,
    desc: descStr,
    notes: notesStr
  };

  // === KIỂM TRA TRÙNG LỊCH ===
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var cSheet = getOrCreateCustomerSheet(spreadsheet);
  var conflicts = checkDateConflict(cSheet, parsed.dateStr);

  if (conflicts.length > 0) {
    // Lưu pending booking
    var props = PropertiesService.getScriptProperties();
    props.setProperty("pending_" + chatId, JSON.stringify(booking));

    var conflictList = conflicts.map(function(c) {
      return "  • " + c.time + " - " + c.name + (c.phone ? " (" + c.phone + ")" : "");
    }).join("\n");

    sendTelegramMessage(chatId,
      "🔴 CẢNH BÁO TRÙNG LỊCH!\n\n" +
      "📅 Ngày " + parsed.dateStr + " đã có " + conflicts.length + " lịch chụp:\n" +
      conflictList + "\n\n" +
      "📋 Booking mới:\n" + formatBookingInfo(booking) + "\n\n" +
      "⚡ Gửi \"OK\" để xác nhận vẫn chốt lịch, hoặc gửi lịch mới để hủy.",
      "customer");
    return;
  }

  // Không trùng → lưu ngay
  saveBookingToSheet(booking, username);
  sendTelegramMessage(chatId,
    "✅ Đã ghi nhận lịch chụp & Ghi sổ Kế toán!\n\n" + formatBookingInfo(booking),
    "customer");
}

// === LƯU BOOKING VÀO SHEET ===
function saveBookingToSheet(booking, username) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var cSheet = getOrCreateCustomerSheet(spreadsheet);

  var dbDate = booking.dateStr;
  var dp = booking.dateStr.split("/");
  if (dp.length === 3) {
    dbDate = new Date(Number(dp[2]), Number(dp[1]) - 1, Number(dp[0]), 12, 0, 0);
  }

  cSheet.appendRow([
    dbDate, booking.timeStr, booking.name, booking.phone,
    booking.cost || "", booking.deposit, booking.cost || "",
    booking.desc, booking.notes
  ]);

  // Auto-log cọc
  var depAmt = parseAmountFromString(booking.deposit);
  if (depAmt > 0) {
    var txSheet = spreadsheet.getSheetByName("BẢNG THEO DÕI THU/CHI")
      || spreadsheet.getSheetByName("THU/CHI")
      || spreadsheet.getSheetByName("Giao dịch");
    if (!txSheet) {
      txSheet = spreadsheet.insertSheet("BẢNG THEO DÕI THU/CHI");
      txSheet.appendRow(["Ngày", "Loại", "Hạng mục", "Số tiền", "Mô tả", "Nguồn"]);
    }
    txSheet.appendRow([
      dbDate instanceof Date ? dbDate : new Date(),
      "Thu", "Đặt cọc", depAmt,
      "Khách cọc: " + booking.name + " (" + booking.desc + ")",
      "Telegram (" + (username || "Bot") + ")"
    ]);
  }
}

// === FORMAT BOOKING INFO ===
function formatBookingInfo(b) {
  var lines = [];
  lines.push("📅 Ngày: " + b.dateStr + (b.timeStr ? " " + b.timeStr : ""));
  lines.push("👤 Khách: " + b.name);
  if (b.phone) lines.push("📱 SĐT: " + b.phone);
  lines.push("💰 Đã cọc: " + b.deposit);
  if (b.cost) lines.push("💵 Chi phí: " + b.cost);
  lines.push("📝 Nội dung: " + b.desc);
  if (b.notes) lines.push("ℹ️ Ghi chú: " + b.notes);
  return lines.join("\n");
}

// === KIỂM TRA TRÙNG LỊCH ===
function checkDateConflict(sheet, dateStr) {
  var data = sheet.getDataRange().getValues();
  var conflicts = [];
  // Chuẩn hóa dateStr thành dd/MM/yyyy
  var targetParts = dateStr.split("/");
  var targetDay = targetParts.length >= 2 ? parseInt(targetParts[0], 10) : -1;
  var targetMonth = targetParts.length >= 2 ? parseInt(targetParts[1], 10) : -1;
  var targetYear = targetParts.length >= 3 ? parseInt(targetParts[2], 10) : new Date().getFullYear();

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var existingDate = row[0];
    var existDay = -1, existMonth = -1, existYear = -1;

    if (existingDate instanceof Date) {
      existDay = existingDate.getDate();
      existMonth = existingDate.getMonth() + 1;
      existYear = existingDate.getFullYear();
    } else {
      var ep = String(existingDate).split("/");
      if (ep.length >= 2) {
        existDay = parseInt(ep[0], 10);
        existMonth = parseInt(ep[1], 10);
        existYear = ep.length >= 3 ? parseInt(ep[2], 10) : new Date().getFullYear();
      }
    }

    if (existDay === targetDay && existMonth === targetMonth && existYear === targetYear) {
      conflicts.push({
        time: String(row[1] || "Chưa rõ giờ"),
        name: String(row[2] || "Không tên"),
        phone: String(row[3] || "")
      });
    }
  }
  return conflicts;
}

// === PARSE NGÀY + GIỜ ===
function parseDateTimeString(str) {
  var clean = str.trim();
  var dateStr = "";
  var timeStr = "";

  // Tách giờ ra khỏi chuỗi
  var timeMatch = clean.match(/(\d{1,2})\s*[hH]\s*(\d{0,2})/);
  var timeMatch2 = clean.match(/(\d{1,2}):(\d{2})/);

  if (timeMatch) {
    var h = parseInt(timeMatch[1], 10);
    var m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    timeStr = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
    // Xóa phần giờ khỏi string để lấy ngày
    clean = clean.replace(timeMatch[0], "").trim();
  } else if (timeMatch2) {
    timeStr = String(parseInt(timeMatch2[1], 10)).padStart(2, "0") + ":" + timeMatch2[2];
    clean = clean.replace(timeMatch2[0], "").trim();
  }

  // Parse ngày
  var dl = clean.toLowerCase().trim();
  if (dl === "hôm nay" || dl === "hom nay" || dl === "today" || dl === "") {
    var t = new Date();
    dateStr = String(t.getDate()).padStart(2, "0") + "/" + String(t.getMonth() + 1).padStart(2, "0") + "/" + t.getFullYear();
  } else if (dl === "ngày mai" || dl === "ngay mai" || dl === "mai" || dl === "tomorrow") {
    var tm = new Date();
    tm.setDate(tm.getDate() + 1);
    dateStr = String(tm.getDate()).padStart(2, "0") + "/" + String(tm.getMonth() + 1).padStart(2, "0") + "/" + tm.getFullYear();
  } else {
    // Thử parse dd/MM hoặc dd/MM/yyyy
    var dateParts = clean.match(/(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})(?:\s*[\/\-\.]\s*(\d{2,4}))?/);
    if (dateParts) {
      var day = String(parseInt(dateParts[1], 10)).padStart(2, "0");
      var month = String(parseInt(dateParts[2], 10)).padStart(2, "0");
      var year = dateParts[3] ? dateParts[3] : String(new Date().getFullYear());
      if (year.length === 2) year = "20" + year;
      dateStr = day + "/" + month + "/" + year;
    } else {
      dateStr = clean; // fallback
    }
  }

  return { dateStr: dateStr, timeStr: timeStr };
}

// === GET OR CREATE CUSTOMER SHEET ===
function getOrCreateCustomerSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName("KHÁCH HÀNG") || spreadsheet.getSheetByName("Khách hàng");
  if (!sheet) {
    sheet = spreadsheet.insertSheet("KHÁCH HÀNG");
    sheet.appendRow(CUSTOMER_HEADERS);
  }
  return sheet;
}

// ===================================================================
// ACCOUNTING TELEGRAM HANDLER
// ===================================================================

function handleTelegramAccountingMessage(message) {
  var chatId = message.chat.id;
  var text = message.text || "";
  var username = message.from.username || message.from.first_name || "Telegram";
  var clean = text.trim();
  var type = "";

  if (clean.startsWith("+") || clean.toLowerCase().startsWith("thu ")) {
    type = "Thu";
    clean = clean.replace(/^\+/, "").replace(/^thu\s+/i, "").trim();
  } else if (clean.startsWith("-") || clean.toLowerCase().startsWith("chi ")) {
    type = "Chi";
    clean = clean.replace(/^-/, "").replace(/^chi\s+/i, "").trim();
  } else {
    sendTelegramMessage(chatId, "⚠️ Sai cú pháp!\n+ [Số tiền] [Mô tả]\n- [Số tiền] [Mô tả]\n\nVí dụ: +500k Cọc chụp ảnh", "accounting");
    return;
  }

  var match = clean.match(/^([0-9.,]+(?:[kKmM]|(?:tr|tỷ|ty|b)\s*\d*|\d*))(?:\s+(.*))?$/i);
  if (!match) {
    sendTelegramMessage(chatId, "⚠️ Không nhận diện được số tiền! Ví dụ: +500k hoặc -1tr5", "accounting");
    return;
  }

  var amountStr = match[1];
  var description = match[2] ? match[2].trim() : "Không có mô tả";
  var amount = parseAmountFromString(amountStr);
  if (amount <= 0) {
    sendTelegramMessage(chatId, "⚠️ Số tiền phải lớn hơn 0!", "accounting");
    return;
  }

  var category = detectCategory(description, type);
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var txSheet = spreadsheet.getSheetByName("BẢNG THEO DÕI THU/CHI")
    || spreadsheet.getSheetByName("THU/CHI")
    || spreadsheet.getSheetByName("Giao dịch");
  if (!txSheet) txSheet = spreadsheet.getActiveSheet();

  txSheet.appendRow([new Date(), type, category, amount, description, "Telegram (" + username + ")"]);
  sendTelegramMessage(chatId,
    "✅ Đã ghi sổ!\n\n🔹 Loại: " + type +
    "\n🔹 Số tiền: " + formatCurrency(amount) +
    "\n🔹 Hạng mục: " + category +
    "\n🔹 Mô tả: " + description,
    "accounting");
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

// *** PHÂN TÍCH SỐ TIỀN ***
// Hỗ trợ: 500k, 1tr, 1tr5, 2tr75, 1tr250, 1.5tr, 1M5, 1tỷ5, 1ty5, 1B5...
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

  // TRIỆU + suffix: 1tr2, 1tr5, 1tr250, 2tr75, 1M5
  var mTrF = lower.match(/(\d+)\s*(?:tr|triệu|trieu|m)\s*(\d+)/);
  if (mTrF) {
    var base3 = parseInt(mTrF[1], 10) * 1000000;
    var f3 = mTrF[2];
    base3 += f3.length === 1 ? parseInt(f3, 10) * 100000 : parseInt(f3, 10) * 1000;
    return base3;
  }

  // TRIỆU decimal: 1.5tr, 1,5tr, 1tr, 2triệu
  var mTr = lower.match(/(\d+[.,]\d+|\d+)\s*(?:tr|triệu|trieu|m)(?![a-z0-9])/i);
  if (mTr) {
    return Math.round(parseFloat(mTr[1].replace(",", ".")) * 1000000);
  }

  // K: 500k, 750k
  var mK = lower.match(/(\d+[.,]?\d*)\s*k(?![a-z0-9])/i);
  if (mK) {
    return Math.round(parseFloat(mK[1].replace(",", ".")) * 1000);
  }

  // Fallback: raw number
  var mNum = lower.match(/(\d[\d.,]*)/);
  if (mNum) {
    var numStr = mNum[1].replace(/\./g, "").replace(",", ".");
    var result = parseFloat(numStr);
    if (!isNaN(result) && result > 0) return result;
  }

  return 0;
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
    if (d.includes("đèn") || d.includes("máy") || d.includes("lens") || d.includes("thiết bị")) return "Mua thiết bị";
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
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ chat_id: chatId, text: text })
  });
}

function formatCurrency(amount) {
  var s = Math.round(amount).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
}

function myFunction() {
  Logger.log("Apps Script hoạt động bình thường! Vui lòng Deploy dưới dạng Web App để sử dụng.");
}
