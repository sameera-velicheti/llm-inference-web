// node testing/puppeteer/multi-model.js
// Tests: send a prompt, wait for all 3 model cards to appear,
// expand one card, then click "Use only" to pin a model.
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 60, args: ["--start-maximized"], defaultViewport: null });
  const page = await browser.newPage();

  try {
    console.log("Starting Multi-Model Test...");

    // Register a fresh test user
    const ts = Date.now();
    await page.goto("http://localhost:3000/register.html");
    await page.type("#username", `mmuser${ts}`);
    await page.type("#email",    `mmuser${ts}@test.com`);
    await page.type("#password", "Password123!");
    await page.type("#confirmPassword", "Password123!");
    await page.click("#submitBtn");
    await page.waitForSelector("#logoutBtn", { timeout: 10000 });
    console.log("Registered and logged in.");

    // Type a prompt
    await page.waitForSelector("#chatInput");
    await page.type("#chatInput", "What is 2 + 2?");
    await page.click("#sendBtn");

    // Wait for at least one model card to appear
    await page.waitForSelector(".model-card", { timeout: 15000 });
    const cardCount = await page.$$eval(".model-card", els => els.length);
    console.log(`Model cards rendered: ${cardCount}`);
    if (cardCount !== 3) throw new Error(`Expected 3 cards, got ${cardCount}`);

    // Wait for llama3.2 card body to have content (streaming)
    await page.waitForFunction(
      () => document.querySelector("#body-llama3\\.2")?.textContent.length > 0,
      { timeout: 30000 }
    );
    console.log("llama3.2 card has content. Streaming works.");

    // Click Expand on mistral card
    await page.click("#expand-mistral");
    await page.waitForFunction(
      () => document.querySelector("#card-mistral")?.classList.contains("expanded"),
      { timeout: 5000 }
    );
    console.log("Expand test passed.");

    // Click Collapse to restore 3-col view
    await page.click("#expand-mistral");

    // Click "Use only" on gemma3 to pin
    await page.click("#transfer-gemma3");
    await page.waitForFunction(
      () => !document.getElementById("pinnedBanner")?.classList.contains("hidden"),
      { timeout: 5000 }
    );
    console.log("Transfer / pin test passed.");

    // Send another message in pinned (gemma3-only) mode
    await page.type("#chatInput", "What is the capital of France?");
    await page.click("#sendBtn");
    await page.waitForSelector(".model-card", { timeout: 15000 });
    const pinnedCards = await page.$$eval(".model-card", els => els.length);
    console.log(`Pinned mode cards: ${pinnedCards} (expected 1)`);
    if (pinnedCards !== 1) throw new Error(`Expected 1 pinned card, got ${pinnedCards}`);

    // Unpin
    await page.click("#unpinBtn");
    await page.waitForFunction(
      () => document.getElementById("pinnedBanner")?.classList.contains("hidden"),
      { timeout: 5000 }
    );
    console.log("Unpin test passed.");

    console.log("Multi-Model Test PASSED ✓");
  } catch (err) {
    console.error("Multi-Model Test FAILED:", err.message);
  } finally {
    await browser.close();
  }
})();
