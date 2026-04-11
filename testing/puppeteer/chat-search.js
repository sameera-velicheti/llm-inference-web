// node testing/puppeteer/chat-search.js

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
    console.log("Starting Chat Search Test...");

    await page.goto("http://localhost:3000/login.html");

    await page.type("#email", "testuser@example.com");
    await page.type("#password", "password123");
    await page.click("#submitBtn");

    // wait for chat page
    await page.waitForSelector("#logoutBtn", { timeout: 10000 });
    await page.waitForSelector("#chatList", { timeout: 10000 });

    // give time for chats to render
    await new Promise(resolve => setTimeout(resolve, 1500));

    const chatItems = await page.$$(".chat-item");

    if (chatItems.length < 3) {
      console.log("Chat Search Test Skipped: fewer than 3 chats available");
      await browser.close();
      return;
    }

    // get text from THIRD chat (index 2)
    const thirdChatText = await page.$$eval(
      ".chat-item",
      items => items[2].textContent.trim()
    );

    // use first word as keyword
    const keyword = thirdChatText.split(" ")[0];

    console.log("Searching for keyword:", keyword);

    await page.click("#chatSearch");
    await page.type("#chatSearch", keyword);

    // wait for search results to update
    await new Promise(resolve => setTimeout(resolve, 1500));

    const filteredItems = await page.$$(".chat-item");

    if (filteredItems.length > 0) {
      console.log(`Chat Search Test Passed: results found for "${keyword}"`);
    } else {
      console.log(`Chat Search Test Failed: no results for "${keyword}"`);
    }

  } catch (err) {
    console.error("Chat Search Test Failed:", err);
  } finally {
    await browser.close();
  }
})();