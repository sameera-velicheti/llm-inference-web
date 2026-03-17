// to test, make sure server is running, open a second terminal, go to approprite file path, then do 
// node testing/puppeteer/register.js
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50, args: ["--start-maximized"], defaultViewport: null });
  const page = await browser.newPage();

  await page.setViewport({
  width: 1920,
  height: 1080
});
  try {
    console.log("Starting Register Test...");
    await page.goto("http://localhost:3000/register.html");

    await page.type("#username", "testuser");
    await page.type("#email", "testuser@example.com");
    await page.type("#password", "password123");
    await page.type("#confirmPassword", "password123");

    await page.click("#submitBtn");
    await page.waitForNavigation({ timeout: 5000 });
    console.log("Register Test Passed: navigated to chat-user.html");

  } catch (err) {
    console.error("Registration Failed or Timed Out!:", err);
  } finally {
    await browser.close();
  }
})();

//this test should always pass when the server has just opened and it is run for the first time. Any attempts to run this test will result in an "existing user" error and cause a timeout
