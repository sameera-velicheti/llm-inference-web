// to test, make sure server is running, open a second terminal, go to approprite file path, then do 
// node testing/puppeteer/puppeteer-guest.js
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Go to homepage
  await page.goto("http://localhost:3000/index.html");

  // Click "Continue as guest" button
  await Promise.all([
    page.click("#guestBtn"),
    page.waitForNavigation({ waitUntil: "networkidle0" }) // <- wait for page navigation
  ]);

  // Check if we are on chat-guest.html
  const url = page.url();
  if (!url.includes("chat-guest.html")) {
    console.error("Did not navigate to chat-guest.html");
  } else {
    console.log("Successfully navigated to chat-guest.html");
  }

  // Optional: check that guest welcome message exists
  await page.waitForSelector("#welcomeMsg");
  const msgText = await page.$eval("#welcomeMsg h2", el => el.textContent);
  console.log("Guest welcome text:", msgText);

  await browser.close();
})();
