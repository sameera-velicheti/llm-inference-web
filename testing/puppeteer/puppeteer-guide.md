The instructions for terminal 1-3 are all on how to get the server running. Instructions for terminal 4 are for the Jasmine and Puppeteer testing. 
To properly test: 

Open Terminal 1:

```bash
ollama serve
```

Open Terminal 2: 
```bash
ollama pull llama3.2:1b

 //this is to remove any old cloned files
rmdir /s /q llm-inference-web

git clone https://github.com/sameera-velicheti/llm-inference-web.git

//use this instead if we are still in branch
git clone -b ethan-iteration3-full-dev --single-branch https://github.com/sameera-velicheti/llm-inference-web.git

cd llm-inference-web
npm install

//IMPORTANT: before turning on the server, you must manually put in your API keys into the .env file.
//After the git is cloned onto your device, look for the .env file in the cloned files.
//You will need to edit the .env file by plugging in the corresponding API keys.

node backend/server.js

//should say "Server running on http://localhost:3000"
```
Open Terminal 3: This is for Jasmine and Puppetteer testing
```bash
cd llm-inference-web

npm install

//for Jasmine Testing
npm test

//now we can run the specific tests
//but assuming we just opened the server and there are no registered accounts
//follow this order to see all outcomes

node testing/puppeteer/register.js
node testing/puppeteer/login.js

# Iteration 3 LLM feature tests (run after login works)
node testing/puppeteer/model-selection.js
node testing/puppeteer/math-mode.js
node testing/puppeteer/weather-mode.js

node testing/puppeteer/logout.js
node testing/puppeteer/forgot-password.js
node testing/puppeteer/reset-password.js

//at this point, trying to log back in with login.js will not work, as it will try to use the old password
node testing/puppeteer/login.js

//trying to register again as well won't work because credentials already exist in the database
node testing/puppeteer/register.js

//
```
