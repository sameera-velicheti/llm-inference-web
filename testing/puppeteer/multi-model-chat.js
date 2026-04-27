// to test, make sure server is running, open a second terminal, go to appropriate file path, then do
// node testing/puppeteer/multi-model-chat.js
// this test requires a registered account (testuser@example.com / password123) to already exist
// run register.js first if starting from a fresh database

const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ["--start-fullscreen"],
    defaultViewport: null
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    console.log("Starting Multi-Model Chat Test...");

    // ── Step 1: Log in ───────────────────────────────────────
    await page.goto("http://localhost:3000/login.html");
    await page.type("#email", "testuser@example.com");
    await page.type("#password", "password123");
    await page.click("#submitBtn");
    await page.waitForNavigation({ timeout: 5000 });
    console.log("  Step 1 Passed: logged in");

    // ── Step 2: Model selector bar loads ────────────────────
    await page.waitForSelector(".model-checkbox-item", { timeout: 5000 });
    const modelCount = await page.$$eval(".model-checkbox-item", els => els.length);
    console.log(`  Step 2 Passed: model bar loaded with ${modelCount} model(s)`);

    // ── Step 3: All models checked by default ────────────────
    const allChecked = await page.evaluate(() => {
      return [...document.querySelectorAll('#modelCheckboxes input[type="checkbox"]')]
        .every(cb => cb.checked);
    });
    if (!allChecked) throw new Error("Not all model checkboxes are checked by default");
    console.log("  Step 3 Passed: all models checked by default");

    // ── Step 4: Send a message and see response cards ────────
    await page.waitForSelector("#chatInput", { timeout: 5000 });
    await page.type("#chatInput", "What is 2 + 2?");
    await page.click(".chat-send-btn");

    await page.waitForSelector(".model-card", { timeout: 5000 });
    await page.waitForFunction(
      () => ![...document.querySelectorAll(".model-card-body")]
              .some(b => b.textContent.trim() === "Thinking…"),
      { timeout: 30000 }
    );
    const cardCount = await page.$$eval(".model-card", c => c.length);
    console.log(`  Step 4 Passed: ${cardCount} model response card(s) appeared`);

    // ── Step 5: Cards appear grouped together ────────────────
    const groups = await page.$$(".model-response-group");
    if (groups.length === 0) throw new Error("No response group found");
    console.log(`  Step 5 Passed: response cards grouped together (${groups.length} group(s))`);

    // ── Step 6: Deselect one model, send another message ─────
    const labels = await page.$$eval(".model-checkbox-item", els =>
      els.map(e => e.textContent.trim())
    );
    if (labels.length >= 2) {
      const lastLabel = labels[labels.length - 1];

      await page.evaluate(lbl => {
        const boxes = [...document.querySelectorAll('#modelCheckboxes input[type="checkbox"]')];
        const target = boxes.find(cb => cb.closest("label")?.textContent?.trim() === lbl);
        if (target) {
          target.checked = false;
          target.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, lastLabel);

      await page.type("#chatInput", "Deselect model test");
      await page.click(".chat-send-btn");

      await page.waitForFunction(
        () => ![...document.querySelectorAll(".model-card-body")]
                .some(b => b.textContent.trim() === "Thinking…"),
        { timeout: 30000 }
      );

const deselectedPresent = await page.evaluate(lbl => {
  const groups = document.querySelectorAll(".model-response-group");
  const latestGroup = groups[groups.length - 1];
  if (!latestGroup) return false;

  return [...latestGroup.querySelectorAll(".model-card-header")]
    .some(h => h.textContent.trim().toUpperCase() === lbl.toUpperCase());
}, lastLabel);

      if (deselectedPresent) throw new Error(`Deselected model "${lastLabel}" still appeared`);
      console.log(`  Step 6 Passed: deselected model "${lastLabel}" correctly excluded`);
    } else {
      console.log("  Step 6 Skipped: fewer than 2 models configured");
    }


    // ── Step 7: Search finds the chat ────────────────────────
    await page.waitForSelector("#chatSearch", { timeout: 5000 });
    await page.click("#chatSearch", { clickCount: 3 });
    await page.type("#chatSearch", "What is 2");
await page.waitForFunction(
  () => document.querySelectorAll("#chatList div").length > 0,
  { timeout: 5000 }
);

    const searchResultCount = await page.$$eval("#chatList div", els => els.length);
    if (searchResultCount === 0) throw new Error("Search returned no results");
    console.log(`  Step 8 Passed: search returned ${searchResultCount} result(s)`);

    console.log("\nMulti-Model Chat Test Passed: all steps completed successfully");

  } catch (err) {
    console.error("Multi-Model Chat Test Failed:", err.message);
  } finally {
    await browser.close();
  }
})();
