const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  try {
    console.log("Starting Guest Test...");
    await page.goto("http://localhost:3000/index.html");

    await page.click("#guestBtn");
    await page.waitForNavigation({ timeout: 5000 });

    console.log("Guest Test Passed: navigated to chat-guest.html");
  } catch (err) {
    console.error("Guest Test Failed:", err);
  } finally {
    await browser.close();
  }
})();
