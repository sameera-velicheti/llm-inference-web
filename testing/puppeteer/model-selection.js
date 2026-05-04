// node testing/puppeteer/model-selection.js
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ["--start-maximized"],
    defaultViewport: null
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    console.log("Starting Model Selection Test...");

    // Login first
    await page.goto("http://localhost:3000/login.html");
    await page.type("#email", "testuser@example.com");
    await page.type("#password", "password123");
    await page.click("#submitBtn");
    await page.waitForSelector("#logoutBtn", { timeout: 10000 });

    // Wait for models to load into the dropdown
    await page.waitForSelector("#modelDropdown", { timeout: 5000 });

    // Open the model dropdown
    await page.click("#modelTrigger");
    await page.waitForFunction(
      () => !document.getElementById("modelDropdown").classList.contains("hidden"),
      { timeout: 5000 }
    );

    // Check local models section is present
    const localHeading = await page.$eval(
      "#modelDropdown .dropdown-heading",
      el => el.textContent.trim()
    );
    console.log("Local models section heading:", localHeading);

    // Check at least one model item exists
    const modelItems = await page.$$(".dropdown-item[data-model-id]");
    if (modelItems.length === 0) throw new Error("No model items found in dropdown");
    console.log(`Found ${modelItems.length} model(s) in dropdown`);

    // Click the first model item
    await modelItems[0].click();
    await page.waitForFunction(
      () => document.getElementById("modelDropdown").classList.contains("hidden"),
      { timeout: 3000 }
    );

    const selectedLabel = await page.$eval("#modelLabelText", el => el.textContent.trim());
    console.log("Selected model label:", selectedLabel);

    // Now try clicking a public model if available
    await page.click("#modelTrigger");
    await page.waitForFunction(
      () => !document.getElementById("modelDropdown").classList.contains("hidden"),
      { timeout: 5000 }
    );

    const allItems = await page.$$(".dropdown-item[data-model-id]");
    if (allItems.length > 1) {
      await allItems[allItems.length - 1].click(); // pick last (likely a public model)
      const newLabel = await page.$eval("#modelLabelText", el => el.textContent.trim());
      console.log("Switched to model:", newLabel);
    }

    console.log("Model Selection Test Passed");

  } catch (err) {
    console.error("Model Selection Test Failed:", err);
  } finally {
    await browser.close();
  }
})();
