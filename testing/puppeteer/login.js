// to test, make sure server is running, open a second terminal, go to approprite file path, then do 
// node testing/puppeteer/login.js
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50, args: ["--start-maximized"], defaultViewport: null });
  const page = await browser.newPage();

  await page.setViewport({
  width: 1920,
  height: 1080
});
  try {
    console.log("Starting Login Test...");
    await page.goto("http://localhost:3000/login.html");

    await page.type("#email", "testuser@example.com");
    await page.type("#password", "password123");

    await page.click("#submitBtn");
    await page.waitForNavigation({ timeout: 5000 });
    console.log("Login Test Passed: navigated to chat-user.html");

  } catch (err) {
    console.error("Login Test Failed:", err);
  } finally {
    await browser.close();
  }
})();

//this will only work if credentials used is already an account that was registered previously
