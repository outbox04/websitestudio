/**
 * Test parseDateTimeString - biến thể thời gian & ngày
 */

function parseDateTimeString(str) {
  var clean = str.trim();
  var dateStr = "";
  var timeStr = "";

  var timeMatch = clean.match(/(\d{1,2})\s*[hH]\s*(\d{0,2})/);
  var timeMatch2 = clean.match(/(\d{1,2}):(\d{2})/);

  if (timeMatch) {
    var h = parseInt(timeMatch[1], 10);
    var m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    timeStr = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
    clean = clean.replace(timeMatch[0], "").trim();
  } else if (timeMatch2) {
    timeStr = String(parseInt(timeMatch2[1], 10)).padStart(2, "0") + ":" + timeMatch2[2];
    clean = clean.replace(timeMatch2[0], "").trim();
  }

  var dl = clean.toLowerCase().trim();
  if (dl === "hôm nay" || dl === "hom nay" || dl === "today" || dl === "") {
    var t = new Date();
    dateStr = String(t.getDate()).padStart(2, "0") + "/" + String(t.getMonth() + 1).padStart(2, "0") + "/" + t.getFullYear();
  } else if (dl === "ngày mai" || dl === "ngay mai" || dl === "mai" || dl === "tomorrow") {
    var tm = new Date();
    tm.setDate(tm.getDate() + 1);
    dateStr = String(tm.getDate()).padStart(2, "0") + "/" + String(tm.getMonth() + 1).padStart(2, "0") + "/" + tm.getFullYear();
  } else {
    var dateParts = clean.match(/(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})(?:\s*[\/\-\.]\s*(\d{2,4}))?/);
    if (dateParts) {
      var day = String(parseInt(dateParts[1], 10)).padStart(2, "0");
      var month = String(parseInt(dateParts[2], 10)).padStart(2, "0");
      var year = dateParts[3] ? dateParts[3] : String(new Date().getFullYear());
      if (year.length === 2) year = "20" + year;
      dateStr = day + "/" + month + "/" + year;
    } else {
      dateStr = clean;
    }
  }
  return { dateStr: dateStr, timeStr: timeStr };
}

// =============================================
// TEST CASES
// =============================================
const today = new Date();
const dd = String(today.getDate()).padStart(2, "0");
const mm = String(today.getMonth() + 1).padStart(2, "0");
const yyyy = today.getFullYear();
const todayStr = `${dd}/${mm}/${yyyy}`;

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tmStr = `${String(tomorrow.getDate()).padStart(2, "0")}/${String(tomorrow.getMonth() + 1).padStart(2, "0")}/${tomorrow.getFullYear()}`;

const tests = [
  // Giờ variants
  ["22/06/2026 14h30",  "22/06/2026", "14:30", "Ngày + 14h30"],
  ["22/06/2026 14h",    "22/06/2026", "14:00", "Ngày + 14h"],
  ["22/06/2026 3h",     "22/06/2026", "03:00", "Ngày + 3h"],
  ["22/06/2026 9h00",   "22/06/2026", "09:00", "Ngày + 9h00"],
  ["22/06/2026 15:30",  "22/06/2026", "15:30", "Ngày + 15:30"],
  ["22/06/2026",        "22/06/2026", "",      "Ngày only, no time"],
  
  // Hôm nay variants
  ["Hôm nay 3h",        todayStr,     "03:00", "Hôm nay 3h"],
  ["hom nay 14h31",     todayStr,     "14:31", "hom nay 14h31"],
  ["today 10h",         todayStr,     "10:00", "today 10h"],
  ["hôm nay",           todayStr,     "",      "hôm nay no time"],

  // Ngày mai
  ["mai 15h",           tmStr,        "15:00", "mai 15h"],
  ["ngày mai 8h30",     tmStr,        "08:30", "ngày mai 8h30"],
  
  // dd/MM without year
  ["22/06 14h30",       "22/06/" + yyyy, "14:30", "dd/MM 14h30 (no year)"],
  
  // Short date formats
  ["5/7/2026 10h",      "05/07/2026", "10:00", "d/M/yyyy 10h"],
  ["05-07-2026 9h",     "05/07/2026", "09:00", "dd-MM-yyyy 9h"],
  ["5.7 16h",           "05/07/" + yyyy, "16:00", "d.M 16h"],
];

console.log("=== Test parseDateTimeString ===\n");
let ok = 0, fail = 0;
tests.forEach(([input, expectedDate, expectedTime, desc]) => {
  const result = parseDateTimeString(input);
  const passDate = result.dateStr === expectedDate;
  const passTime = result.timeStr === expectedTime;
  const pass = passDate && passTime;
  if (pass) ok++; else fail++;
  console.log(`${pass ? "✅" : "❌"} ${desc}`);
  if (!pass) {
    console.log(`   Input: "${input}"`);
    if (!passDate) console.log(`   Date: expected "${expectedDate}" got "${result.dateStr}"`);
    if (!passTime) console.log(`   Time: expected "${expectedTime}" got "${result.timeStr}"`);
  }
});
console.log(`\n${ok}/${tests.length} pass ${fail === 0 ? "🎉" : `❌ ${fail} fail`}`);
