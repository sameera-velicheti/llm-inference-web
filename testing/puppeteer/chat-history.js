// node testing/puppeteer/chat-history.js

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
    console.log("Starting Chat History Test...");

    await page.goto("http://localhost:3000/login.html");

    await page.type("#email", "testuser@example.com");
    await page.type("#password", "password123");

    await page.click("#submitBtn");

    // Wait until logged in (chat page loads)
    await page.waitForSelector("#logoutBtn", { timeout: 10000 });

    // Check chats exist
    await page.waitForSelector("#chatList", { timeout: 5000 });

    console.log("Chat History Test Passed: chats loaded");

  } catch (err) {
    console.error("Chat History Test Failed:", err);
  } finally {
    await browser.close();
  }
})();