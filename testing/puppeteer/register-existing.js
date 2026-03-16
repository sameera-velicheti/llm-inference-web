// to test, make sure server is running, open a second terminal, go to approprite file path, then do 
// node testing/puppeteer/register-existing.js
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

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

//this test should always fail because we are testing with a user that is in the system. a registered user cannot register with the same credentials
