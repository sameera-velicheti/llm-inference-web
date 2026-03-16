# to test, make sure server is running, open a second terminal, go to approprite file path, then do 
# node testing/puppeteer/puppeteer-register.js
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  // Helper function to register a user
  async function registerUser(username, email, password) {
    await page.goto("http://localhost:3000/register.html");

    await page.type("#username", username);
    await page.type("#email", email);
    await page.type("#password", password);
    await page.type("#confirmPassword", password);

    // Click "Create account" and wait for potential navigation
    await Promise.all([
      page.click("#submitBtn"),
      page.waitForTimeout(2000) // wait for JS to handle response
    ]);

    // Check for error message
    const errorMsg = await page.$eval("#errorMsg", el => el.textContent.trim());
    return errorMsg;
  }

  // --- Test 1: Known account (should fail) ---
  const knownEmail = "example@domain.com"; // replace with an existing email in DB
  console.log("➡ Trying to register a known account...");
  const errorKnown = await registerUser("TestUser", knownEmail, "Password123");

  if (errorKnown.includes("already exists")) {
    console.log("Expected behavior for known account:", errorKnown);
  } else {
    console.error("Unexpected behavior for known account:", errorKnown);
  }

  // Wait a bit before trying new account
  await page.waitForTimeout(1000);

  // --- Test 2: Unknown account (should pass) ---
  const uniqueEmail = `user${Date.now()}@test.com`;
  console.log("➡ Trying to register a new account:", uniqueEmail);

  await page.goto("http://localhost:3000/register.html");

  await page.type("#username", "NewUser");
  await page.type("#email", uniqueEmail);
  await page.type("#password", "Password123");
  await page.type("#confirmPassword", "Password123");

  await Promise.all([
    page.click("#submitBtn"),
    page.waitForNavigation({ waitUntil: "networkidle0" }) // wait for redirect to chat-user.html
  ]);

  const url = page.url();
  if (url.includes("chat-user.html")) {
    console.log("Successfully registered new account!");
  } else {
    console.error("Failed to register new account. Current URL:", url);
  }

  await browser.close();
})();
