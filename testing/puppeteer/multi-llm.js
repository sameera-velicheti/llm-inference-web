// node testing/puppeteer/multi-llm.js

const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 75,
    args: ["--start-maximized"],
    defaultViewport: null
  });

  const page = await browser.newPage();

  try {
    console.log("Starting Multi-LLM Test...");

    await page.goto("http://localhost:3000/login.html");

    await page.type("#email", "testuser@example.com");
    await page.type("#password", "password123");
    await page.click("#submitBtn");

    await page.waitForSelector("#chatInput", { timeout: 10000 });

    await page.type("#chatInput", "Explain recursion simply");
    await page.click("#sendBtn");

    await page.waitForSelector(".llm-card", { timeout: 10000 });

    const cards = await page.$$(".llm-card");

    if (cards.length !== 3) {
      throw new Error(`Expected 3 LLM cards, but found ${cards.length}`);
    }

    console.log("Three LLM response cards displayed");

    await page.click("button");

    console.log("Regenerate button clicked");

    const continueButtons = await page.$$("button");

    if (continueButtons.length < 2) {
      throw new Error("Continue button not found");
    }

    await continueButtons[1].click();

    console.log("Continue with LLM clicked");

    await page.waitForSelector(".llm-card.active", { timeout: 5000 });

    console.log("Multi-LLM Test Passed");

  } catch (err) {
    console.error("Multi-LLM Test Failed:", err);
  } finally {
    await browser.close();
  }
})();