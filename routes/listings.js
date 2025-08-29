// routes/listings.js
const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const { isLoggedIn, isListingAuthor } = require("../middleware");

// Joi schema for validation
const Joi = require("joi");
const listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    price: Joi.number().min(0).required(),
    location: Joi.string().required(),
    description: Joi.string().required(),
    country: Joi.string().required(),
    image: Joi.object({
      url: Joi.string().uri().allow("", null),
      filename: Joi.string().allow("", null)
    }).allow(null)
  }).required()
});

const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(", ");
    throw new ExpressError(400, msg);
  }
  next();
};

// INDEX
router.get("/", wrapAsync(async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index", { allListings });
}));

// NEW
router.get("/new", isLoggedIn, (req, res) => {
  res.render("listings/new");
});

// CREATE
router.post("/", isLoggedIn, validateListing, wrapAsync(async (req, res) => {
  const listing = new Listing(req.body.listing);
  listing.author = req.user._id;
  await listing.save();
  req.flash("success", "Listing created successfully!");
  res.redirect(`/listings/${listing._id}`);
}));

// SHOW
router.get("/:id", wrapAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: {
        path: "author"
      }
    })
    .populate("author");

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  res.render("listings/show", { listing });
}));

// EDIT
router.get("/:id/edit", isLoggedIn, isListingAuthor, wrapAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    req.flash("error", "Cannot edit a non-existent listing");
    return res.redirect("/listings");
  }
  res.render("listings/edit", { listing });
}));

// UPDATE
router.put("/:id", isLoggedIn, isListingAuthor, validateListing, wrapAsync(async (req, res) => {
  await Listing.findByIdAndUpdate(req.params.id, req.body.listing);
  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${req.params.id}`);
}));

// DELETE
router.delete("/:id", isLoggedIn, isListingAuthor, wrapAsync(async (req, res) => {
  await Listing.findByIdAndDelete(req.params.id);
  req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
}));

module.exports = router;
