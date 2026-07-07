const url = "https://script.google.com/macros/s/AKfycbyYDnx8QEaHl4mFWUevY9QUQv0lB1yIfr_r3KwX4eZAewvcDnz7lIdpg1YGo5I8s2R5Hg/exec";

async function runTest() {
  console.log("Step 1: Testing GET transactions list...");
  try {
    const response = await fetch(url);
    console.log("GET Response status:", response.status);
    const data = await response.json();
    console.log("GET Response data keys:", Object.keys(data));
    console.log("Success flag:", data.success);
    if (data.success && Array.isArray(data.transactions)) {
      console.log(`Successfully fetched ${data.transactions.length} transactions.`);
      if (data.transactions.length > 0) {
        console.log("Latest transaction:", JSON.stringify(data.transactions[0], null, 2));
      }
    } else {
      console.error("Failed to parse transactions list correctly:", data);
      return;
    }
  } catch (error) {
    console.error("Error fetching transactions list:", error);
    return;
  }

  console.log("\nStep 2: Testing POST add_transaction...");
  const uniqueDesc = `Test Chi tiêu Antigravity ${Math.floor(Math.random() * 10000)}`;
  const payload = {
    action: "add_transaction",
    type: "Chi",
    category: "Chi tiêu khác",
    amount: 120000,
    description: uniqueDesc,
    source: "Desktop App Test",
    date: "18/06/2026"
  };

  try {
    const postResponse = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });
    
    console.log("POST Response status:", postResponse.status);
    const postData = await postResponse.json();
    console.log("POST Response body:", JSON.stringify(postData, null, 2));

    if (postData.success) {
      console.log("🎯 POST test passed successfully!");
    } else {
      console.error("POST test failed:", postData.error);
    }
  } catch (error) {
    console.error("Error posting transaction:", error);
  }
}

runTest();
