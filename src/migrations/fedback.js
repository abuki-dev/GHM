const mongoose = require("mongoose");
const feedbackSchema = new mongoose.Schema({
  feedbackId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: "Users" },
  title: { type: String, required: true },
  body: { type: String, required: true },
});
const Feedback = mongoose.model("Feedback", feedbackSchema);
module.exports = Feedback;
