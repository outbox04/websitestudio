const url = "https://script.google.com/macros/s/AKfycbztiIHT2YA3Ig5vOn2thNfMzulVC8VGhfWar80iAI1bh8OjvbDrKTi4RoRapcBnE6ol/exec";

async function run() {
  console.log("Testing retrieved URL:", url);
  try {
    const response = await fetch(`${url}?action=get_schedule`);
    console.log("Response status:", response.status);
    const text = await response.text();
    console.log("Response body:");
    console.log(text);
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

run();
