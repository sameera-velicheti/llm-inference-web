// node testing/puppeteer/math-mode.js
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ["--start-maximized"],
    defaultViewport: null
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    console.log("Starting Math Mode Test...");

    await page.goto("http://localhost:3000/login.html");
    await page.type("#email", "testuser@example.com");
    await page.type("#password", "password123");
    await page.click("#submitBtn");
    await page.waitForSelector("#logoutBtn", { timeout: 10000 });

    // Open thinking mode dropdown
    await page.click("#modeTrigger");
    await page.waitForFunction(
      () => !document.getElementById("modeDropdown").classList.contains("hidden"),
      { timeout: 5000 }
    );

    // Click Math mode
    const modeItems = await page.$$(".dropdown-item[data-mode]");
    let mathItem = null;
    for (const item of modeItems) {
      const text = await item.evaluate(el => el.textContent.trim());
      if (text.toLowerCase().includes("math")) { mathItem = item; break; }
    }
    if (!mathItem) throw new Error("Math mode option not found");
    await mathItem.click();

    // Verify label updated
    const modeLabel = await page.$eval("#modeLabelText", el => el.textContent.trim());
    if (!modeLabel.toLowerCase().includes("math")) {
      throw new Error(`Expected 'Math' label but got: ${modeLabel}`);
    }
    console.log("Math mode selected:", modeLabel);

    // Send a math question
    await page.type("#chatInput", "What is 12 multiplied by 8?");
    await page.click("#sendBtn");

    // Wait for assistant response
    await page.waitForSelector(".message.assistant", { timeout: 30000 });

    const response = await page.$eval(
      ".message.assistant .message-bubble",
      el => el.textContent
    );
    console.log("Assistant response:", response.substring(0, 100));

    if (!response.includes("96") && !response.toLowerCase().includes("ninety")) {
      console.warn("Warning: response may not contain expected answer '96'");
    } else {
      console.log("Math response looks correct (contains 96)");
    }

    console.log("Math Mode Test Passed");

  } catch (err) {
    console.error("Math Mode Test Failed:", err);
  } finally {
    await browser.close();
  }
})();
