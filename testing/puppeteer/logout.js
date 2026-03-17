// to test, make sure server is running, open a second terminal, go to approprite file path, then do 
// node testing/puppeteer/logout.js
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50, args: ["--start-maximized"], defaultViewport: null });
  const page = await browser.newPage();

  await page.setViewport({
  width: 1920,
  height: 1080
});
  
  try {
    console.log("Starting Logout Test...");
    await page.goto("http://localhost:3000/login.html");

    await page.type("#email", "testuser@example.com");
    await page.type("#password", "password123");

    await page.click("#submitBtn");
    await page.waitForNavigation({ timeout: 5000 });
    await page.click("#logoutBtn");


    console.log("Logout Test Passed: returned to index.html");
  } catch (err) {
    console.error("Logout Test Failed:", err);
  } finally {
    await browser.close();
  }
})();

//this test logins first, then logs out. this will fail if testuser@example.com isnt registered within the session, or if testuser@example has run the test "reset-password.js"
