const base = "AKfycbztilHT2YA3lg5vOn2thNfMzulVC8VGhfWar80iAl1bh8OjvbDrKTi4RoRapcBnE6ol";

// We will try variations of characters:
// Index 42 (zero-based): '0' -> can be '0' or 'O'
// Index 46: '1' -> can be '1' or 'l' or 'I'
// Index 50: 'O' -> can be 'O' or '0'
// Index 70: 'o' -> can be 'o' or '0' or 'O'

const c42_options = ['0', 'O'];
const c46_options = ['1', 'l', 'I'];
const c50_options = ['O', '0'];
const c70_options = ['o', '0', 'O'];

function replaceAt(str, index, replacement) {
  return str.substring(0, index) + replacement + str.substring(index + 1);
}

async function testUrl(deploymentId) {
  const url = `https://script.google.com/macros/s/${deploymentId}/exec?action=get_schedule`;
  try {
    const res = await fetch(url, { method: "GET" });
    if (res.status === 200) {
      console.log(`[SUCCESS] Found working Deployment ID: ${deploymentId}`);
      try {
        const text = await res.text();
        console.log("Response text start:", text.substring(0, 200));
      } catch (e) {}
      return true;
    }
  } catch (err) {
    // network error
  }
  return false;
}

async function run() {
  console.log("Testing permutations of deployment ID...");
  let count = 0;
  for (const c42 of c42_options) {
    for (const c46 of c46_options) {
      for (const c50 of c50_options) {
        for (const c70 of c70_options) {
          let current = base;
          current = replaceAt(current, 42, c42);
          current = replaceAt(current, 46, c46);
          current = replaceAt(current, 50, c50);
          current = replaceAt(current, 70, c70);
          
          count++;
          // Log progress occasionally
          if (count % 10 === 0) {
            console.log(`Tested ${count}/36 combinations...`);
          }
          
          const success = await testUrl(current);
          if (success) {
            console.log("Done!");
            return;
          }
        }
      }
    }
  }
  console.log("Tested all 36 combinations. No working URL found. The deployment might actually be inactive or private.");
}

run();
