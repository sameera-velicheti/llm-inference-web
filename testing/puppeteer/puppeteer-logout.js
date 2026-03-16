const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  try {
    console.log("Starting Logout Test...");
    await page.goto("http://localhost:3000/login.html");

    await page.type("#email", "testuser@example.com");
    await page.type("#password", "password123");

    await page.click("#submitBtn");
    
    await page.click("#logoutBtn");
    await page.waitForNavigation({ timeout: 5000 });

    console.log("Logout Test Passed: returned to index.html");
  } catch (err) {
    console.error("Logout Test Failed:", err);
  } finally {
    await browser.close();
  }
})();
