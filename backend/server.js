// import the express app
const app = require("./src/app");

// choose a port
const PORT = 3000;

// start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});