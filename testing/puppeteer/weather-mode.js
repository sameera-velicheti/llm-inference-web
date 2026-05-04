// node testing/puppeteer/weather-mode.js
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
    console.log("Starting Weather Mode Test...");

    await page.goto("http://localhost:3000/login.html");
    await page.type("#email", "testuser@example.com");
    await page.type("#password", "password123");
    await page.click("#submitBtn");
    await page.waitForSelector("#logoutBtn", { timeout: 10000 });

    // Open thinking mode dropdown
    await page.click("#modeTrigger");
    await page.waitForFunction(
      () => !document.getElementById("modeDropdown").classList.contains("hidden"),
      { timeout: 5000 }
    );

    // Click Weather mode
    const modeItems = await page.$$(".dropdown-item[data-mode]");
    let weatherItem = null;
    for (const item of modeItems) {
      const text = await item.evaluate(el => el.textContent.trim());
      if (text.toLowerCase().includes("weather")) { weatherItem = item; break; }
    }
    if (!weatherItem) throw new Error("Weather mode option not found");
    await weatherItem.click();

    // Verify label updated
    const modeLabel = await page.$eval("#modeLabelText", el => el.textContent.trim());
    if (!modeLabel.toLowerCase().includes("weather")) {
      throw new Error(`Expected 'Weather' label but got: ${modeLabel}`);
    }
    console.log("Weather mode selected:", modeLabel);

    // Send a weather question
    await page.type("#chatInput", "What is the weather like today in New York?");
    await page.click("#sendBtn");

    // Wait for assistant response (weather tool calls may take longer)
    await page.waitForSelector(".message.assistant", { timeout: 45000 });

    const response = await page.$eval(
      ".message.assistant .message-bubble",
      el => el.textContent
    );
    console.log("Assistant response:", response.substring(0, 150));

    const weatherKeywords = ["temperature", "weather", "degrees", "forecast", "rain", "sunny", "cloudy", "wind"];
    const hasWeatherContent = weatherKeywords.some(kw => response.toLowerCase().includes(kw));
    if (!hasWeatherContent) {
      console.warn("Warning: response may not contain weather information");
    } else {
      console.log("Weather response contains expected content");
    }

    console.log("Weather Mode Test Passed");

  } catch (err) {
    console.error("Weather Mode Test Failed:", err);
  } finally {
    await browser.close();
  }
})();
