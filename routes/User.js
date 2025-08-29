const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");

// Show register form
router.get("/register", (req, res) => {
  res.render("users/register");
});

// Register user
router.post(
  "/register",
  wrapAsync(async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const user = new User({ email, username });
      const registeredUser = await User.register(user, password);
      req.login(registeredUser, (err) => {
        if (err) return next(err);
        req.flash("success", "Welcome to Wanderlust!");
        res.redirect("/listings");
      });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/user/register");
    }
  })
);

// Show login form
router.get("/login", (req, res) => {
  res.render("users/login");
});

// Handle login
// Handle login (email or username support)
router.post(
  "/login",
  wrapAsync(async (req, res, next) => {
    const { username, password } = req.body;

    // If input is email, fetch the user and convert to username
    let loginUsername = username;
    if (username.includes("@")) {
      const user = await User.findOne({ email: username });
      if (!user) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/user/login");
      }
      loginUsername = user.username;
    }

    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        req.flash("error", "Invalid username or password");
        return res.redirect("/user/login");
      }
      req.logIn(user, (err) => {
        if (err) return next(err);
        req.flash("success", "Welcome back!");
        res.redirect("/listings");
      });
    })({ ...req, body: { ...req.body, username: loginUsername } }, res, next);
  })
);


// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    req.flash("success", "Logged out successfully");
    res.redirect("/listings");
  });
});

module.exports = router;
