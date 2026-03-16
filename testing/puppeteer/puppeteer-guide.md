To properly test using puppeteer: 

Open Terminal 1:
```bash
rmdir /s llm-inference-web //this is to remove any old cloned files

git clone https://github.com/sameera-velicheti/llm-inference-web.git

cd llm-inference-web

npm install

node backend/server.js


//should say "Server running on http://localhost:3000"
```

Open Terminal 2: at the top of cmd, there is a + and down arrow, open another cmd terminal
```bash
cd llm-inference-web

npm install

//now we can run the specific tests
//but assuming we just opened the server and there are no registered accounts
//follow this order to see all outcomes

node testing/puppeteer/register.js
node testing/puppeteer/login.js
node testing/puppeteer/logout.js
node testing/puppeteer/forgot-password.js
node testing/puppateer/reset-password.js

//at this point, trying to log back in with login.js will not work, as it will try to use the old password
node testing/puppeteer/login.js

//trying to register again as well won't work because credentials already exist in the database
node testing/puppeteer/register.js

//

```
