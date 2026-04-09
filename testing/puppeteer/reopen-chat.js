// node testing/puppeteer/reopen-chat.js

const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ["--start-maximized"],
    defaultViewport: null
  });

  const page = await browser.newPage();

  try {
    console.log("Starting Reopen Chat Test...");

    await page.goto("http://localhost:3000/login.html");

    await page.type("#email", "testuser@example.com");
    await page.type("#password", "password123");

    await page.click("#submitBtn");

    await page.waitForSelector("#logoutBtn", { timeout: 10000 });

    await page.waitForSelector(".chat-item", { timeout: 5000 });

    await page.click(".chat-item");

    await page.waitForSelector(".message", { timeout: 5000 });

    console.log("Reopen Chat Test Passed");

  } catch (err) {
    console.error("Reopen Chat Test Failed:", err);
  } finally {
    await browser.close();
  }
})();