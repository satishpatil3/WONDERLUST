const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: String,
  description: String,
  price: Number,
  location: String,         // Add if not already
  country: String,          // ✅ Add this
  image: {
    url: String,
    filename: String
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review"
    }
  ]
});


module.exports = mongoose.model("Listing", listingSchema);
