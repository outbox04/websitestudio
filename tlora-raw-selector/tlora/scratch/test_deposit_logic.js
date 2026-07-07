/**
 * Test parseAmountFromString - hỗ trợ đầy đủ bảng quy đổi VNĐ
 */

function parseAmountFromString(str) {
  if (!str) return 0;
  var lower = str.toLowerCase().trim();

  // 1. TỶ: 1tỷ5, 1ty5, 1 tỷ 5, 1tỷ, 1ty
  var mTy = lower.match(/(\d+)\s*(?:tỷ|ty)\s*(\d*)/);
  if (mTy) {
    var base = parseInt(mTy[1], 10) * 1000000000;
    if (mTy[2] && mTy[2].length > 0) {
      var f = mTy[2];
      base += f.length === 1 ? parseInt(f, 10) * 100000000 : parseInt(f, 10) * 1000000;
    }
    return base;
  }

  // 2. B (billion): 1B5, 2B
  var mB = lower.match(/(\d+)\s*b\s*(\d+)/);
  if (mB && /\db/i.test(str)) {
    var base = parseInt(mB[1], 10) * 1000000000;
    var f = mB[2];
    base += f.length === 1 ? parseInt(f, 10) * 100000000 : parseInt(f, 10) * 1000000;
    return base;
  }

  // 3. TRIỆU with suffix digits: 1tr2, 1tr5, 1tr250, 2tr75, 10tr5, 1M5, 1M250
  var mTrF = lower.match(/(\d+)\s*(?:tr|triệu|trieu|m)\s*(\d+)/);
  if (mTrF) {
    var base = parseInt(mTrF[1], 10) * 1000000;
    var f = mTrF[2];
    base += f.length === 1 ? parseInt(f, 10) * 100000 : parseInt(f, 10) * 1000;
    return base;
  }

  // 4. TRIỆU decimal: 1.5tr, 1,5tr, 2.5M, 1tr, 2triệu
  var mTr = lower.match(/(\d+[.,]\d+|\d+)\s*(?:tr|triệu|trieu|m)(?![a-z0-9])/i);
  if (mTr) {
    return Math.round(parseFloat(mTr[1].replace(",", ".")) * 1000000);
  }

  // 5. K: 500k, 750k
  var mK = lower.match(/(\d+[.,]?\d*)\s*k(?![a-z0-9])/i);
  if (mK) {
    return Math.round(parseFloat(mK[1].replace(",", ".")) * 1000);
  }

  // 6. Fallback: raw number (1000000, 1.000.000)
  var mNum = lower.match(/(\d[\d.,]*)/);
  if (mNum) {
    var numStr = mNum[1].replace(/\./g, "").replace(",", ".");
    var result = parseFloat(numStr);
    if (!isNaN(result) && result > 0) return result;
  }

  return 0;
}

// =============================================
// TEST CASES từ bảng quy đổi của user
// =============================================
const tests = [
  // K format
  ["500k",        500000,       "500k"],
  ["750k",        750000,       "750k"],

  // TR basic
  ["1tr",         1000000,      "1tr"],

  // TR with suffix digits (KEY NEW FEATURE)
  ["1tr2",        1200000,      "1tr2 → 1.200.000"],
  ["1tr5",        1500000,      "1tr5 → 1.500.000"],
  ["1tr250",      1250000,      "1tr250 → 1.250.000"],
  ["2tr75",       2075000,      "2tr75 → 2.075.000"],
  ["10tr5",       10500000,     "10tr5 → 10.500.000"],

  // TR decimal
  ["1,5tr",       1500000,      "1,5tr"],
  ["1.5tr",       1500000,      "1.5tr"],

  // M format (same as TR)
  ["1M5",         1500000,      "1M5 → 1.500.000"],
  ["1M250",       1250000,      "1M250 → 1.250.000"],

  // TỶ (billion)
  ["1 tỷ 5",      1500000000,   "1 tỷ 5 → 1.500.000.000"],
  ["1ty5",        1500000000,   "1ty5 → 1.500.000.000"],
  ["1B5",         1500000000,   "1B5 → 1.500.000.000"],

  // Đã cọc prefix (real usage)
  ["Đã cọc 500k",      500000,       "Đã cọc 500k"],
  ["Đã cọc 2.5tr",     2500000,      "Đã cọc 2.5tr"],
  ["Đã cọc 1tr5",      1500000,      "Đã cọc 1tr5"],
  ["Đã cọc 2tr75",     2075000,      "Đã cọc 2tr75"],
  ["Đã cọc 1000000",   1000000,      "Đã cọc 1000000"],
  ["Đã cọc 1.000.000", 1000000,      "Đã cọc 1.000.000"],
  ["Đã cọc 2.000.000đ",2000000,      "Đã cọc 2.000.000đ"],

  // Zero / empty
  ["Chưa cọc",    0,            "Chưa cọc → 0"],
  ["",            0,            "Empty → 0"],
];

console.log("=== Test parseAmountFromString (bảng quy đổi đầy đủ) ===\n");
let ok = 0, fail = 0;
tests.forEach(([input, expected, desc]) => {
  const result = parseAmountFromString(input);
  const pass = result === expected;
  if (pass) ok++; else fail++;
  console.log(`${pass ? "✅" : "❌"} ${desc}`);
  if (!pass) {
    console.log(`   Input:    "${input}"`);
    console.log(`   Expected: ${expected.toLocaleString("vi-VN")}đ`);
    console.log(`   Got:      ${result.toLocaleString("vi-VN")}đ`);
  }
});
console.log(`\n${ok}/${tests.length} pass ${fail === 0 ? "🎉" : `❌ ${fail} fail`}`);
