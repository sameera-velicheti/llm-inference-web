const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require("path");

// Import auth routes
const authRoutes = require("./routes/authRoutes");

// Import chat routes
const chatRoute = require("./routes/chatRoute");

// Create Express app
const app = express();

const multiLLMRoute = require("./routes/multiLLMRoute");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api", multiLLMRoute);

app.use(
  session({
    secret: "iteration1-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);

// Serve static frontend files from the public directory
app.use(express.static(path.join(__dirname, "../../public")));

app.use("/api/auth", authRoutes);
app.use("/api", chatRoute);

module.exports = app;
