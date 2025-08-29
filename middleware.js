const Listing = require("./models/listing");
const Review = require("./models/review");

// Middleware to check if the user is logged in
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be signed in!");
    return res.redirect("/user/login");
  }
  next();
};

// Middleware to check if the user is the author of the listing
module.exports.isListingAuthor = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing.author.equals(req.user._id)) {
    req.flash("error", "Forbidden action");
    return res.redirect(`/listings/${req.params.id}`);
  }
  next();
};

// Middleware to check if the user is the author of the review or the listing
module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  const listing = await Listing.findById(id);

  if (!review || !listing) {
    req.flash("error", "Review or listing not found");
    return res.redirect("/listings");
  }

  // Check if the user is the review author or listing author
  const isOwner = review.author.equals(req.user._id);
  const isListingOwner = listing.author.equals(req.user._id);

  if (!isOwner && !isListingOwner) {
    req.flash("error", "You do not have permission to delete this review");
    return res.redirect(`/listings/${id}`);
  }

  next();
};
