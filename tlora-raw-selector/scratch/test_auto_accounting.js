/**
 * TEST LIVE: Auto-Accounting khi thêm booking có cọc
 * Dùng 1 URL duy nhất cho cả Khách hàng lẫn Kế toán
 * 
 * Chạy: node scratch/test_auto_accounting.js
 */

// Thay bằng URL Web App của bạn (1 URL duy nhất cho cả 2 tab)
const SCRIPT_URL = process.env.APPS_SCRIPT_URL || "";

async function runTest() {
  if (!SCRIPT_URL) {
    console.log("⚠️  Chưa có URL! Chạy lại với:\n");
    console.log("   $env:APPS_SCRIPT_URL=\"https://script.google.com/macros/s/YOUR_ID/exec\"; node scratch/test_auto_accounting.js\n");
    console.log("Hoặc sửa dòng SCRIPT_URL trong file này.\n");
    
    // Test logic parseAmountFromString cục bộ thay thế
    console.log("--- Test logic parseAmountFromString (cục bộ) ---");
    testParseAmount();
    return;
  }

  const uniqueTestName = `AutoTest-${Date.now()}`;
  const depositText = "Đã cọc 2.5tr";

  console.log(`\n🚀 Bắt đầu test live với URL:\n   ${SCRIPT_URL}\n`);
  console.log(`👤 Tên khách test: "${uniqueTestName}"`);
  console.log(`💰 Cọc: "${depositText}" → kỳ vọng 2.500.000đ\n`);

  // STEP 1: POST add_booking lên Khách hàng
  console.log("STEP 1: Ghi lịch chụp có cọc...");
  let bookingOk = false;
  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_booking",
        shootDate: "27/06/2026",
        customerName: uniqueTestName,
        totalPrice: "7.500.000đ",
        depositStatus: depositText,
        description: "Chụp ảnh sự kiện ngoài trời",
        notes: "Test tự động AI"
      })
    });

    const data = await res.json();
    if (data.success) {
      console.log("  ✅ Booking ghi thành công!");
      console.log(`  📝 Thông báo: ${data.message}`);
      bookingOk = true;
    } else {
      console.log("  ❌ Booking thất bại:", data.error || JSON.stringify(data));
      return;
    }
  } catch (err) {
    console.error("  ❌ Lỗi kết nối:", err.message);
    return;
  }

  // STEP 2: Đợi Google Sheets xử lý
  console.log("\n⏳ Đợi 4 giây để Google Sheets xử lý...");
  await new Promise(r => setTimeout(r, 4000));

  // STEP 3: GET transactions từ CÙNG URL (không cần ?action=, mặc định là get_transactions)
  console.log("\nSTEP 2: Lấy danh sách giao dịch từ sheet BẢNG THEO DÕI THU/CHI...");
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();

    if (!data.success || !Array.isArray(data.transactions)) {
      console.log("  ❌ Không lấy được giao dịch:", JSON.stringify(data));
      return;
    }

    console.log(`  📊 Tổng số giao dịch: ${data.transactions.length}`);

    // Tìm giao dịch cọc tự động
    const found = data.transactions.find(tx =>
      tx.type === "Thu" &&
      tx.category === "Đặt cọc" &&
      tx.amount === 2500000 &&
      tx.description.includes(uniqueTestName)
    );

    if (found) {
      console.log("\n🎯 ===== TEST PASSED =====");
      console.log("✅ Tự động ghi kế toán hoạt động hoàn hảo!");
      console.log("\n📋 Chi tiết giao dịch tự động:");
      console.log(`  📅 Ngày:     ${found.date}`);
      console.log(`  💹 Loại:     ${found.type}`);
      console.log(`  🏷️  Hạng mục: ${found.category}`);
      console.log(`  💵 Số tiền:  ${found.amount.toLocaleString("vi-VN")}đ`);
      console.log(`  📝 Mô tả:    ${found.description}`);
      console.log(`  📌 Nguồn:    ${found.source}`);
    } else {
      console.log("\n❌ ===== TEST FAILED =====");
      console.log("Không tìm thấy giao dịch cọc tự động trong kế toán.");
      console.log("\nCó thể do:");
      console.log("  1. Script cũ chưa được deploy lại sau khi sửa code");
      console.log("  2. Tên sheet 'BẢNG THEO DÕI THU/CHI' không khớp");
      console.log("  3. parseAmountFromString không nhận diện được '2.5tr'");
      console.log("\n5 giao dịch gần nhất:");
      data.transactions.slice(0, 5).forEach((tx, i) => {
        console.log(`  ${i+1}. [${tx.type}] ${tx.amount}đ - ${tx.description?.substring(0, 50)}`);
      });
    }
  } catch (err) {
    console.error("  ❌ Lỗi khi lấy giao dịch:", err.message);
  }
}

function testParseAmount() {
  const tests = [
    ["Đã cọc 2.5tr", 2500000],
    ["Đã cọc 500k", 500000],
    ["Đã cọc 1000000", 1000000],
    ["Chưa cọc", 0],
  ];

  function parseAmountFromString(str) {
    if (!str) return 0;
    var clean = str.toLowerCase().trim();
    var matchTr = clean.match(/(\d+[\.,]\d+|\d+)\s*(?:tr|triệu|trieu|m(?!k|\d))/);
    if (matchTr) return parseFloat(matchTr[1].replace(",", ".")) * 1000000;
    var matchK = clean.match(/(\d+)\s*k/);
    if (matchK) return parseInt(matchK[1], 10) * 1000;
    var cleanNum = clean.replace(/[^0-9]/g, "");
    return cleanNum ? parseInt(cleanNum, 10) : 0;
  }

  tests.forEach(([input, expected]) => {
    const result = parseAmountFromString(input);
    const ok = result === expected;
    console.log(`  ${ok ? "✅" : "❌"} "${input}" → ${result.toLocaleString()}đ ${ok ? "" : `(kỳ vọng ${expected.toLocaleString()}đ)`}`);
  });
}

runTest();
