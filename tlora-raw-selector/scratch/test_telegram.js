const token = "8841132194:AAFq5hbB0cr0YwFYmGz6TBHa3fR3WBA7e4Q";

async function testTelegramBot() {
  console.log("Testing Telegram Bot token via getMe...");
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error testing Telegram Bot:", error);
  }
}

testTelegramBot();
