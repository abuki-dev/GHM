const mongoose = require("mongoose");
const feedbackSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "users" },
  title: { type: String, required: true },
  body: { type: String, required: true },
});
const Feedback = mongoose.model("feedback", feedbackSchema);
module.exports = Feedback;
