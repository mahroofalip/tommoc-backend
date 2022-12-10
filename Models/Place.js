const mongoose = require("mongoose");
const { Schema } = mongoose;

const placeSchema = Schema({
  place: String,
  users: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Place", placeSchema);
