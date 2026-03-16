const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  try {
    console.log("Starting Register Test...");
    await page.goto("http://localhost:3000/register.html");

    await page.type("#username", "testuser");
    await page.type("#email", "testuser@example.com");
    await page.type("#password", "password123");
    await page.type("#confirmPassword", "password123");

    await page.click("#submitBtn");
    await page.waitForNavigation({ timeout: 5000 });
    console.log("Register Test Passed: navigated to chat-user.html");

  } catch (err) {
    console.error("Register Test Failed:", err);
  } finally {
    await browser.close();
  }
})();
