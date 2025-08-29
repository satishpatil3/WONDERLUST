const express = require("express");
const router = express.Router({ mergeParams: true });
const Listing = require("../models/listing");
const Review = require("../models/review"); 
const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");

// ✅ Middleware: Only review author or listing owner can delete review
const isReviewDeletableBy = async (req, res, next) => {
  const { id, reviewId } = req.params;

  const review = await Review.findById(reviewId);
  const listing = await Listing.findById(id);

  if (!review || !listing) {
    req.flash("error", "Review or listing not found");
    return res.redirect(`/listings/${id}`);
  }

  if (
    !review.author.equals(req.user._id) &&
    !listing.author.equals(req.user._id)
  ) {
    req.flash("error", "You do not have permission to delete this review.");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

// ✅ POST /listings/:id/reviews — Add new review
router.post("/", isLoggedIn, wrapAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  const review = new Review(req.body.review);
  review.author = req.user._id;
  listing.reviews.push(review);
  await review.save();
  await listing.save();

  req.flash("success", "Review added!");
  res.redirect(`/listings/${listing._id}`);
}));

// ✅ DELETE /listings/:id/reviews/:reviewId — Delete review
router.delete("/:reviewId", isLoggedIn, isReviewDeletableBy, wrapAsync(async (req, res) => {
  const { id, reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Review deleted!");
  res.redirect(`/listings/${id}`);
}));

module.exports = router;
