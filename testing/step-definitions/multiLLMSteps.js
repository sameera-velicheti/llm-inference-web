const { Given, When, Then } = require("@cucumber/cucumber");
const assert = require("assert");
const puppeteer = require("puppeteer");

let browser;
let page;

Given("the user is logged into their account", async function () {
    browser = await puppeteer.launch({ headless: false });
    page = await browser.newPage();

    await page.goto("http://localhost:3000/login.html");

    await page.type("#email", "test@test.com");
    await page.type("#password", "password123");

    await page.click("#loginBtn");

    await page.waitForNavigation();
});

Given("the user is on the chat page", async function () {
    await page.goto("http://localhost:3000/chat-user.html");
});

When("the user enters {string}", async function (prompt) {
    await page.type("#chatInput", prompt);
});

When("clicks the send button", async function () {
    await page.click("#sendBtn");

    await page.waitForTimeout(5000);
});

Then("OpenAI should generate a response", async function () {
    const text = await page.$eval(
        "#openaiResponse",
        el => el.textContent
    );

    assert(text.length > 0);
});

Then("Gemini should generate a response", async function () {
    const text = await page.$eval(
        "#geminiResponse",
        el => el.textContent
    );

    assert(text.length > 0);
});

Then("Claude should generate a response", async function () {
    const text = await page.$eval(
        "#claudeResponse",
        el => el.textContent
    );

    assert(text.length > 0);

    await browser.close();
});
