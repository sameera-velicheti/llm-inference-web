// to test, make sure server is running, open a second terminal, go to approprite file path, then do 
// node testing/puppeteer/reset-password.js
// NOTE: AFTER RUNNING THIS TEST, THE USER testuser@example.com will have a different password. any future attempts to login will be invalid
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50, args: ["--start-maximized"], defaultViewport: null });
  const page = await browser.newPage();

  await page.setViewport({
  width: 1920,
  height: 1080
});
  try {
    console.log("Starting Reset Password Test...");
    await page.goto("http://localhost:3000/reset-password.html");

    // Step 1: request token
    await page.type("#email", "testuser@example.com");
    await page.click("#submitBtn1");
    await page.waitForSelector("#step2.active", { timeout: 5000 });

    // Step 2: reset password
    const token = await page.$eval("#tokenDisplay", el => el.textContent.trim());

    
    await page.type("#newPassword", "newpassword123");
    await page.type("#confirmNewPassword", "newpassword123");

    await page.click("#submitBtn2");
    await page.waitForSelector("#step3.active", { timeout: 5000 });

    console.log("Reset Password Test Passed: password updated successfully");
  } catch (err) {
    console.error("Reset Password Test Failed:", err);
  } finally {
    await browser.close();
  }
})();
