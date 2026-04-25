// node testing/puppeteer/multi-llm.js

const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 80,
    defaultViewport: null
  });

  const page = await browser.newPage();

  try {
    console.log("Starting Multi-LLM Actions Test...");

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
      throw new Error(`Expected 3 LLM cards, got ${cards.length}`);
    }

    console.log("3 LLM cards detected");

    const regenerateBtn = await page.$("#chatgpt-card button");

    if (!regenerateBtn) {
      throw new Error("Regenerate button not found");
    }

    await regenerateBtn.click();

    console.log("Clicked Regenerate");

    // wait for text change
    await page.waitForFunction(() => {
      const el = document.getElementById("chatgpt-response");
      return el && el.textContent.includes("regenerated");
    });

    console.log("Regenerate worked");

    
    const continueBtn = await page.evaluateHandle(() => {
      const card = document.getElementById("claude-card");
      return card.querySelectorAll("button")[1]; // second button = continue
    });

    await continueBtn.click();

    console.log("Clicked Continue with Claude");

    // check active class applied
    await page.waitForFunction(() => {
      const card = document.getElementById("claude-card");
      return card && card.classList.contains("active");
    });

    console.log("Continue worked (Claude is active)");

 
    console.log("Multi-LLM Actions Test Passed");

  } catch (err) {
    console.error("Test Failed:", err);
  } finally {
    await browser.close();
  }
})();