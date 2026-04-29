const puppeteer = require("puppeteer");

(async () => {
    const browser = await puppeteer.launch({
        headless: false
    });

    const page = await browser.newPage();

    try {
        await page.goto("http://localhost:3000/chat-user.html");

        await page.type(
            "#chatInput",
            "What is cloud computing?"
        );

        await page.click("#sendBtn");

        await page.waitForTimeout(5000);

        await page.reload();

        const chatExists = await page.$("#chatList");

        if (chatExists) {
            console.log(
                " Chat saved successfully"
            );
        } else {
            console.log(
                " Chat was not saved"
            );
        }

    } catch (err) {
        console.error(err);
    }

    await browser.close();
})();
