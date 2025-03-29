const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const travelStorySchema = new Schema({
    title: { type: String, required: true },
    story: { type: String, required: true },
    visitedLocation: { type: [String], default: [] },  // Keeps this as an array for multiple locations
    isFavourite: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdOn: { type: Date, default: Date.now },
    imageUrl: { type: String, required: true },
    visitedDate: { type: Date, required: true }  // Remove default here, as you may want it to be set explicitly
});

module.exports = mongoose.model("TravelStory", travelStorySchema);
