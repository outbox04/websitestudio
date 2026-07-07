const url = "https://script.google.com/macros/s/AKfycbztilHT2YA3lg5vOn2thNfMzulVC8VGhfWar80iAl1bh8OjvbDrKTi4RoRapcBnE6ol/exec";

async function testGetSchedule() {
  console.log("Testing GET schedule...");
  try {
    const response = await fetch(`${url}?action=get_schedule`);
    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error fetching schedule:", error);
  }
}

async function testAddBooking() {
  console.log("\nTesting POST add_booking...");
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
    
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    // Note: Google Apps Script POST requests redirect (302) to another URL, fetch handles this automatically.
    // If it is no-cors, we won't see the body, but standard fetch handles redirects. Let's see the response text.
    const text = await response.text();
    console.log("Response status:", response.status);
    console.log("Response body:", text);
  } catch (error) {
    console.error("Error adding booking:", error);
  }
}

async function runTests() {
  await testGetSchedule();
  // We will run add booking to verify writing as well
  await testAddBooking();
  // Get schedule again to verify it has been written
  console.log("\nFetching schedule again to verify addition...");
  await testGetSchedule();
}

runTests();
