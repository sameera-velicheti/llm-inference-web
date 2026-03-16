const puppeteer = require("puppeteer");

(async () => {

  const browser = await puppeteer.launch({
    headless: false   // change to true later
  });

  const page = await browser.newPage();

  await page.goto("http://localhost:3000/login.html");

  // fill form
  await page.type("#email", "test@example.com");
  await page.type("#password", "Password123!");

  await page.click("button[type=submit]");

  // wait for redirect
  await page.waitForNavigation();

  const url = page.url();

  if (url.includes("chat-user")) {
    console.log("Login test passed");
  } else {
    console.log("Login test failed");
  }

  await browser.close();

})();
