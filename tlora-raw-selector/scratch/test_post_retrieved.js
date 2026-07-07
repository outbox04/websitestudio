const url = "https://script.google.com/macros/s/AKfycbztiIHT2YA3Ig5vOn2thNfMzulVC8VGhfWar80iAI1bh8OjvbDrKTi4RoRapcBnE6ol/exec";

async function run() {
  console.log("Testing POST add_booking...");
  try {
    const payload = {
      action: "add_booking",
      shootDate: "20/06/2026",
      customerName: "Khách hàng Test Antigravity",
      totalPrice: "3.500.000đ",
      depositStatus: "Đã cọc 500.000đ",
      description: "Chụp ảnh ngoại cảnh kỷ niệm sinh nhật",
      notes: "Test tự động từ AI"
    };
    
    // We send a POST request with the JSON payload.
    // Google Apps Script doPost receives it.
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    const text = await response.text();
    console.log("Response status:", response.status);
    console.log("Response body:");
    console.log(text);
  } catch (error) {
    console.error("Error adding booking:", error);
  }
}

run();
