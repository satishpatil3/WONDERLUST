// server.js
const express = require("express");
const app = express();
require("dotenv").config(); // ✅ Load .env variables
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ExpressError = require("./utils/ExpressError");

// Models
const User = require("./models/user");

// Routers
const userRouter = require("./routes/user");
const listingsRouter = require("./routes/listings");
const reviewRouter = require("./routes/review");

// ✅ Load DB URI from .env
const MONGODB_URI = process.env.MONGODB_URI;

// ✅ Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// View engine and static files
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Session & Flash
const sessionOptions = {
  secret: "thisshouldbeabettersecret",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 }
};
app.use(session(sessionOptions));
app.use(flash());

// Passport config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global locals
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Demo user (for quick testing)
app.get("/demouser", async (req, res) => {
  try {
    const user = new User({ email: "demo@example.com", username: "demoUser" });
    const registered = await User.register(user, "demopass");
    res.send(registered);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Routes
app.use("/user", userRouter);
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewRouter);

// 404 handler
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Error handler
app.use((err, req, res, next) => {
  const { status = 500, message = "Something went wrong!" } = err;
  res.status(status).render("error", { err });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/listings`);
});
