const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");

// Import auth routes
const authRoutes = require("./routes/authRoutes");

// Create Express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: "iteration1-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("LLM Web Inference backend is running.");
});

module.exports = app;