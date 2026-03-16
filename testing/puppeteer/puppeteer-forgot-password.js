# to test, make sure server is running, open a second terminal, go to approprite file path, then do 
# node testing/puppeteer-forgot-password.js
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  try {
    console.log("Starting Forgot Password Test...");
    await page.goto("http://localhost:3000/reset-password.html");

    await page.type("#email", "testuser@example.com");
    await page.click("#submitBtn1");
    await page.waitForSelector("#step2.active", { timeout: 5000 });

    console.log("Forgot Password Test Passed: token step displayed");
  } catch (err) {
    console.error("Forgot Password Test Failed:", err);
  } finally {
    await browser.close();
  }
})();
